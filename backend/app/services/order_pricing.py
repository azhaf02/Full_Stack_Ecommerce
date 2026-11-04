
"""Server-side pricing and checkout-session validation for orders."""

from dataclasses import dataclass
from datetime import datetime, timezone
from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, List, Optional, Tuple

from sqlalchemy import (
    JSON,
    Boolean,
    DateTime,
    Integer,
    Numeric,
    String,
    column,
    delete,
    select,
    table,
    update,
)
from sqlalchemy.orm import Session

from app.core.pricing_config import get_tax_rate_percent
from app.models.coupon import Coupon
from app.models.order import Order
from app.services.coupon_service import validate_coupon
from app.services.order_service import (
    InvalidOrder,
    OrderInput,
    OrderItemInput,
)
from app.services.pricing_engine import calculate_pricing


# Database table definitions

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

_sessions = table(
    "checkout_sessions",
    column("session_id", String),
    column("customer_id", String),
    column("status", String),
    column("checkout_snapshot", JSON),
    column("expires_at", DateTime),
)

_carts = table(
    "carts",
    column("id", Integer),
    column("user_id", Integer),
)

_cart_items = table(
    "cart_items",
    column("id", Integer),
    column("cart_id", Integer),
)


ACTIVE = "ACTIVE"
MAX_QUANTITY_PER_LINE = 100
CENT = Decimal("0.01")
ZERO = Decimal("0.00")


def _money(value) -> Decimal:
    """Convert a value to a two-decimal monetary amount."""
    return Decimal(str(value)).quantize(
        CENT,
        rounding=ROUND_HALF_UP,
    )


def _aware(value: datetime) -> datetime:
    """Convert a datetime to timezone-aware UTC."""
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)

    return value.astimezone(timezone.utc)


def _tax_on(amount: Decimal) -> Decimal:
    """Calculate tax on an amount after discounts."""
    return _money(
        max(amount, ZERO)
        * get_tax_rate_percent()
        / Decimal("100")
    )


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


def _merge_lines(lines: List[OrderLine]) -> List[OrderLine]:
    """Merge duplicate product and variant lines."""
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
    """Validate a coupon and calculate its discount."""

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

    if discount_value < ZERO:
        raise InvalidOrder(
            "Invalid coupon discount configuration"
        )

    discount_type = str(coupon.discount_type).strip().lower()

    if discount_type == "percentage":
        discount = (
            subtotal * discount_value / Decimal("100")
        )

    elif discount_type == "fixed":
        discount = discount_value

    else:
        raise InvalidOrder(
            f"Unsupported coupon type: {coupon.discount_type}"
        )

    if coupon.max_discount is not None:
        max_discount = _money(coupon.max_discount)

        if max_discount < ZERO:
            raise InvalidOrder(
                "Invalid coupon discount configuration"
            )

        discount = min(discount, max_discount)

    discount = min(
        max(discount, ZERO),
        subtotal,
    )

    return _money(discount)


def price_order(
    db: Session,
    user_id: int,
    request: OrderRequest,
) -> OrderInput:
    """Build an order using trusted server-side prices."""

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
                    f"Variant {line.variant_id} does not belong to "
                    f"product {line.product_id}"
                )

            unit_price = _money(
                unit_price + variant.price_delta
            )

        elif line.product_id in products_with_variants:
            raise InvalidOrder(
                f"Choose a variant for '{product.name}'"
            )

        if unit_price < ZERO:
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

    initial_pricing = calculate_pricing(
        items,
        tax_rate=None,
        discount=ZERO,
    )

    subtotal = _money(
        initial_pricing["subtotal"]
    )

    # SERVER-SIDE COUPON

    discount = ZERO
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

    total_before_shipping = _money(
        pricing["total"]
    )

    total = _money(
        total_before_shipping + shipping_cost
    )

    # ORDER INPUT

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


def price_checkout_session(
    db: Session,
    user_id: int,
    reference_id: str,
    payment_method: str,
    address_id: Optional[int] = None,
    shipping_method_id: Optional[int] = None,
) -> OrderInput:
    """Revalidate checkout session, prices and coupon before ordering."""

    row = db.execute(
        select(
            _sessions.c.customer_id,
            _sessions.c.status,
            _sessions.c.checkout_snapshot,
            _sessions.c.expires_at,
        ).where(
            _sessions.c.session_id == reference_id
        )
    ).first()

    if row is None or row.customer_id != str(user_id):
        raise InvalidOrder("Checkout session not found")

    if row.status != "active":
        raise InvalidOrder(
            "This checkout session has already been used or cancelled"
        )

    if (
        row.expires_at is None
        or _aware(row.expires_at) <= datetime.now(timezone.utc)
    ):
        raise InvalidOrder(
            "This checkout session has expired. Please review checkout again"
        )

    snapshot = row.checkout_snapshot

    try:
        snap_address = int(snapshot["address"]["id"])
        snap_shipping = int(snapshot["shipping"]["id"])
        snap_subtotal = _money(
            snapshot["summary"]["subtotal"]
        )

        lines = [
            OrderLine(
                product_id=int(item["product_id"]),
                variant_id=(
                    None
                    if item.get("variant_id") is None
                    else int(item["variant_id"])
                ),
                quantity=int(item["quantity"]),
            )
            for item in snapshot["items"]
        ]

        coupon_snapshot = snapshot.get("coupon")

    except (TypeError, KeyError, ValueError, AttributeError):
        raise InvalidOrder(
            "Checkout session data is incomplete. Please review checkout again"
        )

    if (
        (address_id is not None and address_id != snap_address)
        or (
            shipping_method_id is not None
            and shipping_method_id != snap_shipping
        )
    ):
        raise InvalidOrder(
            "Address or shipping method does not match the checkout session"
        )

    priced = price_order(
        db,
        user_id,
        OrderRequest(
            address_id=snap_address,
            shipping_method_id=snap_shipping,
            payment_method=payment_method,
            items=lines,
        ),
    )

    if priced.subtotal != snap_subtotal:
        raise InvalidOrder(
            "Prices changed since checkout. Please review checkout again"
        )

    # Recalculate coupon from the current database record.

    priced.coupon_id = None
    priced.discount_amount = ZERO

    if coupon_snapshot is not None:
        try:
            coupon_id = int(coupon_snapshot["id"])
            snapshot_code = (
                str(coupon_snapshot["code"])
                .strip()
                .upper()
            )

        except (TypeError, KeyError, ValueError, AttributeError):
            raise InvalidOrder(
                "Coupon information is invalid. Please review checkout again"
            )

        coupon = (
            db.query(Coupon)
            .filter(Coupon.id == coupon_id)
            .first()
        )

        if (
            coupon is None
            or not coupon.code
            or coupon.code.strip().upper() != snapshot_code
        ):
            raise InvalidOrder(
                "Coupon is no longer available. Please review checkout again"
            )

        if not coupon.status:
            raise InvalidOrder("Coupon is inactive")

        now = datetime.now(timezone.utc)

        if (
            coupon.start_date is not None
            and now < _aware(coupon.start_date)
        ):
            raise InvalidOrder("Coupon is not active yet")

        if (
            coupon.expiry_date is not None
            and now > _aware(coupon.expiry_date)
        ):
            raise InvalidOrder("Coupon has expired")

        if (
            coupon.min_order_value is not None
            and priced.subtotal < _money(coupon.min_order_value)
        ):
            raise InvalidOrder(
                "Minimum order value for this coupon is not met"
            )

        usage_query = db.query(Order).filter(
            Order.coupon_id == coupon.id,
            Order.status != "CANCELLED",
        )

        if (
            coupon.usage_limit is not None
            and usage_query.count() >= coupon.usage_limit
        ):
            raise InvalidOrder("Coupon usage limit exceeded")

        if (
            coupon.per_user_limit is not None
            and usage_query.filter(
                Order.user_id == user_id
            ).count() >= coupon.per_user_limit
        ):
            raise InvalidOrder(
                "Per-user coupon usage limit exceeded"
            )

        discount_value = _money(coupon.discount_value)

        if discount_value < ZERO:
            raise InvalidOrder(
                "Invalid coupon discount configuration"
            )

        discount_type = (
            str(coupon.discount_type).strip().lower()
        )

        if discount_type == "percentage":
            discount = _money(
                priced.subtotal
                * discount_value
                / Decimal("100")
            )

            if coupon.max_discount is not None:
                max_discount = _money(coupon.max_discount)

                if max_discount < ZERO:
                    raise InvalidOrder(
                        "Invalid coupon discount configuration"
                    )

                discount = min(discount, max_discount)

        elif discount_type == "fixed":
            discount = discount_value

        else:
            raise InvalidOrder("Invalid coupon discount type")

        priced.coupon_id = coupon.id

        priced.discount_amount = min(
            max(discount, ZERO),
            priced.subtotal,
        )

    # Recalculate tax and final total after discount.

    priced.tax_amount = _tax_on(
        priced.subtotal - priced.discount_amount
    )

    priced.total_amount = _money(
        priced.subtotal
        - priced.discount_amount
        + priced.tax_amount
        + priced.shipping_cost
    )

    return priced


def consume_checkout_session(
    db: Session,
    user_id: int,
    reference_id: str,
) -> None:
    """Consume an active checkout session within the order transaction."""

    result = db.execute(
        update(_sessions)
        .where(
            _sessions.c.session_id == reference_id,
            _sessions.c.customer_id == str(user_id),
            _sessions.c.status == "active",
        )
        .values(status="completed")
    )

    if result.rowcount != 1:
        raise InvalidOrder(
            "This checkout session has already been used or cancelled"
        )


def clear_user_cart(
    db: Session,
    user_id: int,
) -> None:
    """Clear cart items after a successful checkout."""

    db.execute(
        delete(_cart_items).where(
            _cart_items.c.cart_id.in_(
                select(_carts.c.id).where(
                    _carts.c.user_id == user_id
                )
            )
        )
    )
