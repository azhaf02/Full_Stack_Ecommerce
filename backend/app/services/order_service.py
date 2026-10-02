"""Order lifecycle rules.

update_status() is the only way an order's status should change. It enforces the allow-list of
transitions, the payment rules from the Payment-Order-Inventory integration guide, writes the
order_status_history row, and keeps orders.payment_status consistent for refunds.

It flushes but does not commit: the caller (route or service) commits, so everything that happens
in a status change, including hooks such as stock deduction, lands in one transaction.
"""
from typing import Callable, Dict, FrozenSet, List
from sqlalchemy.orm import Session
from app.models.order import Order, OrderStatusHistory, OrderStatus, PaymentStatus, PaymentMethod

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
    order.status_history.append(OrderStatusHistory(
        previous_status=previous, new_status=new_status, changed_by=changed_by, remarks=remarks,
    ))
    db.flush()

    for hook in list(_hooks):
        hook(db, order, previous, new_status)
    return order
