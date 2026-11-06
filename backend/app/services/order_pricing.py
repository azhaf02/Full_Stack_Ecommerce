

from dataclasses import dataclass
from datetime import datetime, timezone
from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, List, Optional, Tuple
from uuid import UUID

from sqlalchemy import Boolean, Integer, Numeric, String, column, select, table
from sqlalchemy.orm import Session

from app.models.coupon import Coupon
from app.models.order import Order
from app.models.checkout_session import CheckoutSession
from app.models.cart import Cart
from app.services.order_service import InvalidOrder, OrderInput, OrderItemInput
from app.services.pricing_engine import calculate_pricing
from app.services.coupon_service import validate_coupon


_products = table(
    "products",
    column("id", Integer),
    column("name", String),
    column("price", Numeric),
    column("status", String),
)

_variants = table(
    "product_variants",
    column("id", Integer),
    column("product_id", Integer),
    column("price_delta", Numeric),
)

_shipping = table(
    "shipping_methods",
    column("id", Integer),
    column("cost", Numeric),
    column("status", Boolean),
)

_addresses = table(
    "addresses",
    column("id", Integer),
    column("user_id", Integer),
)

ACTIVE = "ACTIVE"
MAX_QUANTITY_PER_LINE = 100


@dataclass
class OrderLine:
    product_id: int
    quantity: int
    variant_id: Optional[int] = None


@dataclass
class OrderRequest:
    address_id: int
    shipping_method_id: int
    payment_method: str
    items: List[OrderLine]
    coupon_code: Optional[str] = None


def _money(value) -> Decimal:
    return Decimal(str(value)).quantize(
        Decimal("0.01"),
        rounding=ROUND_HALF_UP,
    )


def _merge_lines(
    lines: List[OrderLine],
) -> List[OrderLine]:
    merged: Dict[Tuple[int, Optional[int]], int] = {}

    for line in lines:
        key = (line.product_id, line.variant_id)
        merged[key] = merged.get(key, 0) + line.quantity

    return [
        OrderLine(
            product_id=product_id,
            variant_id=variant_id,
            quantity=quantity,
        )
        for (product_id, variant_id), quantity in merged.items()
    ]


def _coupon_discount(
    db: Session,
    user_id: int,
    coupon: Coupon,
    subtotal: Decimal,
) -> Decimal:
    total_usage_count = (
        db.query(Order)
        .filter(
            Order.coupon_id == coupon.id,
            Order.status != "CANCELLED",
        )
        .count()
    )

    user_usage_count = (
        db.query(Order)
        .filter(
            Order.coupon_id == coupon.id,
            Order.user_id == user_id,
            Order.status != "CANCELLED",
        )
        .count()
    )

    valid, message = validate_coupon(
        coupon,
        subtotal,
        user_usage_count=user_usage_count,
        total_usage_count=total_usage_count,
    )

    if not valid:
        raise InvalidOrder(message)

    discount_value = _money(coupon.discount_value)
    discount_type = str(coupon.discount_type).strip().lower()

    if discount_type == "percentage":
        discount = subtotal * discount_value / Decimal("100")

    elif discount_type == "fixed":
        discount = discount_value

    else:
        raise InvalidOrder(
            f"Unsupported coupon type: {coupon.discount_type}"
        )

    if coupon.max_discount is not None:
        discount = min(
            discount,
            _money(coupon.max_discount),
        )

    discount = min(
        max(discount, Decimal("0.00")),
        subtotal,
    )

    return _money(discount)


def price_order(
    db: Session,
    user_id: int,
    request: OrderRequest,
) -> OrderInput:

    if not request.items:
        raise InvalidOrder(
            "An order needs at least one item"
        )

    # ADDRESS VALIDATION

    address_owner = db.execute(
        select(_addresses.c.user_id).where(
            _addresses.c.id == request.address_id
        )
    ).scalar()

    if address_owner is None or address_owner != user_id:
        raise InvalidOrder(
            f"Address {request.address_id} was not found in your account"
        )

    # SHIPPING VALIDATION

    shipping_cost = db.execute(
        select(_shipping.c.cost).where(
            _shipping.c.id == request.shipping_method_id,
            _shipping.c.status.is_(True),
        )
    ).scalar()

    if shipping_cost is None:
        raise InvalidOrder(
            f"Shipping method {request.shipping_method_id} is not available"
        )

    shipping_cost = _money(shipping_cost)

    # QUANTITY VALIDATION

    lines = _merge_lines(request.items)

    for line in lines:
        if (
            line.quantity <= 0
            or line.quantity > MAX_QUANTITY_PER_LINE
        ):
            raise InvalidOrder(
                f"Quantity must be between 1 and {MAX_QUANTITY_PER_LINE}"
            )

    # LOAD PRODUCTS

    product_ids = sorted(
        {line.product_id for line in lines}
    )

    products = {
        row.id: row
        for row in db.execute(
            select(
                _products.c.id,
                _products.c.name,
                _products.c.price,
                _products.c.status,
            ).where(
                _products.c.id.in_(product_ids)
            )
        )
    }

    variants = {
        row.id: row
        for row in db.execute(
            select(
                _variants.c.id,
                _variants.c.product_id,
                _variants.c.price_delta,
            ).where(
                _variants.c.product_id.in_(product_ids)
            )
        )
    }

    products_with_variants = {
        variant.product_id
        for variant in variants.values()
    }

    # BUILD ORDER ITEMS

    items: List[OrderItemInput] = []

    for line in lines:
        product = products.get(line.product_id)

        if (
            product is None
            or str(product.status).upper() != ACTIVE
        ):
            raise InvalidOrder(
                f"Product {line.product_id} is not available"
            )

        unit_price = _money(product.price)

        if line.variant_id is not None:
            variant = variants.get(line.variant_id)

            if (
                variant is None
                or variant.product_id != line.product_id
            ):
                raise InvalidOrder(
                    f"Variant {line.variant_id} does not belong to product {line.product_id}"
                )

            unit_price = _money(
                unit_price + variant.price_delta
            )

        elif line.product_id in products_with_variants:
            raise InvalidOrder(
                f"Choose a variant for '{product.name}'"
            )

        if unit_price < 0:
            raise InvalidOrder(
                f"Product {line.product_id} has an invalid price"
            )

        items.append(
            OrderItemInput(
                product_id=line.product_id,
                variant_id=line.variant_id,
                quantity=line.quantity,
                unit_price=unit_price,
            )
        )

    # CENTRAL PRICING ENGINE

    pricing = calculate_pricing(
        items,
        tax_rate=None,
        discount=Decimal("0.00"),
    )

    subtotal = _money(pricing["subtotal"])

    # SERVER-SIDE COUPON

    discount = Decimal("0.00")
    coupon_id = None

    if request.coupon_code:
        code = request.coupon_code.strip().upper()

        coupon = (
            db.query(Coupon)
            .filter(Coupon.code == code)
            .first()
        )

        if coupon is None:
            raise InvalidOrder("Invalid coupon code")

        discount = _coupon_discount(
            db,
            user_id,
            coupon,
            subtotal,
        )

        coupon_id = coupon.id

    # FINAL CENTRAL PRICING

    pricing = calculate_pricing(
        items,
        tax_rate=None,
        discount=discount,
    )

    subtotal = _money(pricing["subtotal"])
    discount = _money(pricing["discount"])
    tax = _money(pricing["tax"])

    total_before_shipping = _money(pricing["total"])
    total = _money(total_before_shipping + shipping_cost)

    return OrderInput(
        user_id=user_id,
        address_id=request.address_id,
        shipping_method_id=request.shipping_method_id,
        payment_method=request.payment_method,
        items=items,
        subtotal=subtotal,
        discount_amount=discount,
        tax_amount=tax,
        shipping_cost=shipping_cost,
        total_amount=total,
        coupon_id=coupon_id,
    )


# ----------------------------------------------------------------
# CHECKOUT SESSION PRICING
# ----------------------------------------------------------------

def price_checkout_session(
    db: Session,
    user_id: int,
    checkout_reference_id: UUID,
    payment_method: str,
    *,
    address_id: int,
    shipping_method_id: int,
) -> OrderInput:
    """Validate an active checkout session and calculate its order."""

    session = db.get(
        CheckoutSession,
        str(checkout_reference_id),
    )

    if session is None:
        raise InvalidOrder("Checkout session was not found.")

    if str(session.customer_id) != str(user_id):
        raise InvalidOrder(
            "This checkout session does not belong to your account."
        )

    if session.status != "active":
        raise InvalidOrder(
            "This checkout session is no longer active."
        )

    now = datetime.now(timezone.utc)
    expires_at = session.expires_at

    # Handle database timestamps returned without timezone information.
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if expires_at <= now:
        raise InvalidOrder(
            "Checkout session has expired. Please review checkout again."
        )

    snapshot = session.checkout_snapshot

    if not isinstance(snapshot, dict):
        raise InvalidOrder(
            "Checkout session does not contain valid checkout details."
        )

    if snapshot.get("ready_for_payment") is not True:
        raise InvalidOrder(
            "Checkout is not ready for payment."
        )

    address = snapshot.get("address") or {}
    shipping = snapshot.get("shipping") or {}
    snapshot_items = snapshot.get("items") or []
    coupon = snapshot.get("coupon")

    if not isinstance(address, dict) or not isinstance(shipping, dict):
        raise InvalidOrder(
            "Checkout address or shipping details are invalid."
        )

    if address.get("id") != address_id:
        raise InvalidOrder(
            "The selected address does not match the checkout session."
        )

    if shipping.get("id") != shipping_method_id:
        raise InvalidOrder(
            "The selected shipping method does not match the checkout session."
        )

    if not isinstance(snapshot_items, list) or not snapshot_items:
        raise InvalidOrder(
            "Checkout session has no order items."
        )

    lines = []

    for item in snapshot_items:
        if not isinstance(item, dict):
            raise InvalidOrder(
                "Checkout session contains an invalid item."
            )

        try:
            lines.append(
                OrderLine(
                    product_id=int(item["product_id"]),
                    variant_id=(
                        int(item["variant_id"])
                        if item.get("variant_id") is not None
                        else None
                    ),
                    quantity=int(item["quantity"]),
                )
            )
        except (KeyError, TypeError, ValueError):
            raise InvalidOrder(
                "Checkout session contains incomplete item details."
            )

    coupon_code = (
        coupon.get("code")
        if isinstance(coupon, dict)
        else None
    )

    request = OrderRequest(
        address_id=address_id,
        shipping_method_id=shipping_method_id,
        payment_method=payment_method,
        items=lines,
        coupon_code=coupon_code,
    )

    # Recalculate current prices, coupon and shipping on the server.
    return price_order(
        db,
        user_id,
        request,
    )


# ----------------------------------------------------------------
# CART CLEARING
# ----------------------------------------------------------------

def clear_user_cart(
    db: Session,
    user_id: int,
) -> None:
    """Delete the customer's cart using ORM relationship cascades."""

    carts = (
        db.query(Cart)
        .filter(Cart.user_id == user_id)
        .all()
    )

    for cart in carts:
        db.delete(cart)

    # The caller owns the transaction and commits once.
    db.flush()

