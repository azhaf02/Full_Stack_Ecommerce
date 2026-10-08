"""Order lifecycle rules.

update_status() is the only way an order's status should change. It enforces the allow-list of
transitions, the payment rules from the Payment-Order-Inventory integration guide, writes the
order_status_history row, and keeps orders.payment_status consistent for refunds.

It flushes but does not commit: the caller (route or service) commits, so everything that happens
in a status change, including hooks such as stock deduction, lands in one transaction.
"""
import secrets
from dataclasses import dataclass
from datetime import datetime, timezone
from decimal import Decimal
from typing import Callable, Dict, FrozenSet, List, Optional
from sqlalchemy.orm import Session
from app.models.order import Order, OrderItem, OrderStatusHistory, OrderStatus, PaymentStatus, PaymentMethod
from app.services.inventory_service import validate_stock, InsufficientStockError

S = OrderStatus

ALLOWED_TRANSITIONS: Dict[str, FrozenSet[str]] = {
    S.PLACED.value: frozenset({S.CONFIRMED.value, S.CANCELLED.value}),
    S.CONFIRMED.value: frozenset({S.PROCESSING.value, S.CANCELLED.value}),
    S.PROCESSING.value: frozenset({S.PACKED.value, S.CANCELLED.value}),
    S.PACKED.value: frozenset({S.SHIPPED.value}),
    S.SHIPPED.value: frozenset({S.OUT_FOR_DELIVERY.value}),
    S.OUT_FOR_DELIVERY.value: frozenset({S.DELIVERED.value}),
    S.DELIVERED.value: frozenset({S.RETURN_REQUESTED.value}),
    S.RETURN_REQUESTED.value: frozenset({S.RETURN_APPROVED.value, S.DELIVERED.value}),
    S.RETURN_APPROVED.value: frozenset({S.RETURNED.value}),
    S.RETURNED.value: frozenset({S.REFUND_PENDING.value}),
    S.CANCELLED.value: frozenset({S.REFUND_PENDING.value}),
    S.REFUND_PENDING.value: frozenset({S.REFUNDED.value}),
    S.REFUNDED.value: frozenset(),
}

# A customer may cancel only before the order is packed.
CUSTOMER_CANCELLABLE: FrozenSet[str] = frozenset({S.PLACED.value, S.CONFIRMED.value, S.PROCESSING.value})

# Payment status that follows the order into a refund.
_PAYMENT_FOLLOWS_ORDER = {
    S.REFUND_PENDING.value: PaymentStatus.REFUND_PENDING.value,
    S.REFUNDED.value: PaymentStatus.REFUNDED.value,
}


class OrderServiceError(Exception):
    """Base class for order rule violations."""


class UnknownStatus(OrderServiceError):
    def __init__(self, status: str):
        super().__init__(f"'{status}' is not a valid order status")
        self.status = status


class InvalidTransition(OrderServiceError):
    def __init__(self, current: str, new: str):
        super().__init__(f"An order cannot move from {current} to {new}")
        self.current, self.new = current, new


class PaymentNotVerified(OrderServiceError):
    """The order cannot be confirmed because payment has not been verified as SUCCESS."""


class NothingToRefund(OrderServiceError):
    """No payment was taken, so there is nothing to refund."""


class OrderNotFound(OrderServiceError):
    """The order does not exist, or belongs to someone else (the two are deliberately indistinguishable)."""


class InvalidOrder(OrderServiceError):
    """The data used to create an order is inconsistent."""


class OutOfStock(OrderServiceError):
    """Raised by the inventory status hook when there isn't enough stock. The whole change is rolled back."""


class NotCancellable(OrderServiceError):
    """The order has gone too far (packed or later) to be cancelled by the customer."""


# A hook is called as hook(db, order, previous_status, new_status) inside the status change, after the
# rules pass and before the caller commits. If a hook raises, the caller should roll back, so stock and
# status never get out of step. Inventory (deduct on CONFIRMED, restock on cancel/return) and
# notifications register themselves here instead of order_service importing their modules.
StatusHook = Callable[[Session, Order, str, str], None]
_hooks: List[StatusHook] = []


def register_status_hook(hook: StatusHook) -> None:
    if hook not in _hooks:
        _hooks.append(hook)


def clear_status_hooks() -> None:
    _hooks.clear()


def allowed_next_statuses(status: str) -> FrozenSet[str]:
    """Statuses an order in `status` may move to (used to decide which buttons to show)."""
    return ALLOWED_TRANSITIONS.get(status, frozenset())


def can_customer_cancel(order: Order) -> bool:
    return order.status in CUSTOMER_CANCELLABLE


# These steps belong to the returns workflow (return_service), which keeps the returns table in step with the
# order. The admin status route refuses them, and while a return is open it refuses every change.
RETURN_ONLY_STATUSES: FrozenSet[str] = frozenset(
    {S.RETURN_REQUESTED.value, S.RETURN_APPROVED.value, S.RETURNED.value})
IN_RETURN_FLOW: FrozenSet[str] = RETURN_ONLY_STATUSES | {S.REFUND_PENDING.value}


def admin_status_is_blocked(order: Order, new_status: str) -> bool:
    """True if the change must go through the returns workflow instead of the plain status route."""
    return new_status in RETURN_ONLY_STATUSES or bool(order.returns and order.status in IN_RETURN_FLOW)


def admin_next_statuses(order: Order) -> List[str]:
    """The statuses the admin status route will accept for this order right now, in lifecycle order.

    This is what the admin dropdown should offer. It applies the same rules as update_status(), so an
    unpaid online order does not offer CONFIRMED and an unpaid cancelled order does not offer a refund.
    """
    if order.returns and order.status in IN_RETURN_FLOW:
        return []
    options = []
    for candidate in OrderStatus:
        value = candidate.value
        if value not in allowed_next_statuses(order.status) or value in RETURN_ONLY_STATUSES:
            continue
        try:
            _check_rules(order, value)
        except OrderServiceError:
            continue
        options.append(value)
    return options


def _check_rules(order: Order, new_status: str) -> None:
    if new_status == S.CONFIRMED.value:
        is_cod = order.payment_method == PaymentMethod.COD.value
        if not is_cod and order.payment_status != PaymentStatus.SUCCESS.value:
            raise PaymentNotVerified(
                f"Order {order.order_number} cannot be confirmed: online payment is "
                f"{order.payment_status}, not SUCCESS"
            )
    if new_status == S.REFUND_PENDING.value and order.payment_status != PaymentStatus.SUCCESS.value:
        raise NothingToRefund(
            f"Order {order.order_number} has payment status {order.payment_status}; there is nothing to refund"
        )


def update_status(db: Session, order: Order, new_status: str, changed_by: int = None, remarks: str = None) -> Order:
    """Move `order` to `new_status`, or raise an OrderServiceError. Does not commit."""
    new_status = new_status.value if isinstance(new_status, OrderStatus) else new_status

    if new_status not in {s.value for s in OrderStatus}:
        raise UnknownStatus(new_status)

    previous = order.status

    if new_status not in allowed_next_statuses(previous):
        raise InvalidTransition(previous, new_status)

    _check_rules(order, new_status)

    order.status = new_status

    if new_status in _PAYMENT_FOLLOWS_ORDER:
        order.payment_status = _PAYMENT_FOLLOWS_ORDER[new_status]

    order.status_history.append(
        OrderStatusHistory(
            previous_status=previous,
            new_status=new_status,
            changed_by=changed_by,
            remarks=remarks,
        )
    )

    db.flush()

    try:
        for hook in list(_hooks):
            hook(db, order, previous, new_status)
    except Exception:
        order.status = previous
        raise

    return order


def stock_was_deducted(order: Order) -> bool:
    """Stock is deducted when an order is CONFIRMED, so it must be restored only if that ever happened."""
    return any(h.new_status == S.CONFIRMED.value for h in order.status_history)


# ---------------------------------------------------------------- creation (ORD-03)

@dataclass
class OrderItemInput:
    product_id: int
    quantity: int
    unit_price: Decimal
    variant_id: Optional[int] = None


@dataclass
class OrderInput:
    """What checkout hands over. Totals are checked here, but the checkout/pricing code is expected to have
    computed them server-side; they must never come straight from the browser."""
    user_id: int
    address_id: int
    shipping_method_id: int
    payment_method: str
    items: List[OrderItemInput]
    subtotal: Decimal
    total_amount: Decimal
    discount_amount: Decimal = Decimal("0")
    tax_amount: Decimal = Decimal("0")
    shipping_cost: Decimal = Decimal("0")
    coupon_id: Optional[int] = None
    payment_status: str = PaymentStatus.PENDING.value


def utcnow() -> datetime:
    """Current UTC time without timezone info, matching the timestamp columns."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


def generate_order_number() -> str:
    return f"ORD-{utcnow():%Y%m%d}-{secrets.token_hex(3).upper()}"


def _money(value) -> Decimal:
    return Decimal(value).quantize(Decimal("0.01"))


def _validate_order_input(data: OrderInput) -> None:
    if data.payment_method not in {m.value for m in PaymentMethod}:
        raise InvalidOrder(f"'{data.payment_method}' is not a valid payment method")
    if data.payment_status not in {p.value for p in PaymentStatus}:
        raise InvalidOrder(f"'{data.payment_status}' is not a valid payment status")
    if not data.items:
        raise InvalidOrder("An order needs at least one item")
    for item in data.items:
        if item.quantity <= 0:
            raise InvalidOrder("Item quantity must be greater than zero")
        if item.unit_price < 0:
            raise InvalidOrder("Item price cannot be negative")
    items_total = sum((_money(i.unit_price) * i.quantity for i in data.items), Decimal("0"))
    if _money(data.subtotal) != items_total:
        raise InvalidOrder(f"Subtotal {data.subtotal} does not match the items ({items_total})")
    expected = (_money(data.subtotal) - _money(data.discount_amount)
                + _money(data.tax_amount) + _money(data.shipping_cost))
    if _money(data.total_amount) != expected:
        raise InvalidOrder(f"Total {data.total_amount} does not match subtotal - discount + tax + shipping ({expected})")
    if expected < 0:
        raise InvalidOrder("The total cannot be negative")


def create_order(db: Session, data: OrderInput) -> Order:
    """Create a PLACED order with its items and first history row.

    A COD order is accepted straight away (moved to CONFIRMED, so stock hooks run). An online order stays
    PLACED until the verified payment arrives through apply_payment_result(). Does not commit.
    """
    _validate_order_input(data)

    # Revalidate stock at checkout/order creation.
    # This protects against stock changing after the item was added to cart.
    for item in data.items:
        try:
            validate_stock(
                db,
                item.product_id,
                item.quantity,
                item.variant_id
            )
        except InsufficientStockError as exc:
            raise InvalidOrder(str(exc)) from exc
    order_number = generate_order_number()
    while db.query(Order.id).filter(Order.order_number == order_number).first():
        order_number = generate_order_number()

    order = Order(
        order_number=order_number, user_id=data.user_id, address_id=data.address_id,
        shipping_method_id=data.shipping_method_id, coupon_id=data.coupon_id, status=S.PLACED.value,
        payment_method=data.payment_method, payment_status=data.payment_status,
        subtotal=_money(data.subtotal), discount_amount=_money(data.discount_amount),
        tax_amount=_money(data.tax_amount), shipping_cost=_money(data.shipping_cost),
        total_amount=_money(data.total_amount),
        items=[OrderItem(product_id=i.product_id, variant_id=i.variant_id, quantity=i.quantity,
                         unit_price=_money(i.unit_price)) for i in data.items],
        status_history=[OrderStatusHistory(previous_status=None, new_status=S.PLACED.value,
                                           changed_by=data.user_id, remarks="Order placed")],
    )
    db.add(order)
    db.flush()
    if order.payment_method == PaymentMethod.COD.value:
        update_status(db, order, S.CONFIRMED.value, changed_by=data.user_id, remarks="Cash on delivery accepted")
    return order


def apply_payment_result(db: Session, order: Order, payment_status: str, changed_by: int = None) -> Order:
    """Called by the payment module with the backend-verified result. SUCCESS confirms a PLACED online order;
    FAILED and CANCELLED leave it PLACED and unconfirmed. Does not commit."""
    if payment_status not in {p.value for p in PaymentStatus}:
        raise InvalidOrder(f"'{payment_status}' is not a valid payment status")
    order.payment_status = payment_status
    db.flush()
    if payment_status == PaymentStatus.SUCCESS.value and order.status == S.PLACED.value:
        update_status(db, order, S.CONFIRMED.value, changed_by=changed_by, remarks="Payment verified")
    return order


# ---------------------------------------------------------------- customer access (ORD-05)

def get_order_for_user(db: Session, order_id: int, user_id: int) -> Order:
    order = db.get(Order, order_id)
    if order is None or order.user_id != user_id:
        raise OrderNotFound(f"Order {order_id} not found")
    return order


def list_orders_for_user(db: Session, user_id: int, page: int = 1, page_size: int = 10) -> List[Order]:
    page, page_size = max(page, 1), min(max(page_size, 1), 100)
    return (db.query(Order).filter(Order.user_id == user_id)
            .order_by(Order.created_at.desc(), Order.id.desc())
            .offset((page - 1) * page_size).limit(page_size).all())


# ---------------------------------------------------------------- cancellation (ORD-06)

def cancel_order(db: Session, order: Order, user_id: int, reason: str = None) -> Order:
    """Customer cancellation. Allowed until the order is packed. A paid order moves on to REFUND_PENDING.
    Restocking is done by a status hook (see stock_was_deducted). Does not commit."""
    if order.user_id != user_id:
        raise OrderNotFound(f"Order {order.id} not found")
    if not can_customer_cancel(order):
        raise NotCancellable(f"Order {order.order_number} is {order.status} and can no longer be cancelled")
    update_status(db, order, S.CANCELLED.value, changed_by=user_id, remarks=reason or "Cancelled by customer")
    if order.payment_status == PaymentStatus.SUCCESS.value:
        update_status(db, order, S.REFUND_PENDING.value, changed_by=user_id,
                      remarks="Refund started after cancellation")
    return order



