"""Server-side pricing for checkout orders."""

from dataclasses import dataclass
from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, List, Optional, Tuple

from sqlalchemy import Boolean, Integer, Numeric, String, column, select, table
from sqlalchemy.orm import Session

from app.models.coupon import Coupon
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
    coupon: Coupon,
    subtotal: Decimal,
) -> Decimal:

    valid, message = validate_coupon(
        coupon,
        subtotal,
    )

    if not valid:
        raise InvalidOrder(message)

    discount_value = _money(coupon.discount_value)

    if coupon.discount_type == "PERCENTAGE":
        discount = (
            subtotal * discount_value / Decimal("100")
        )

    elif coupon.discount_type == "FIXED":
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

    # -------------------------
    # ADDRESS VALIDATION
    # -------------------------

    address_owner = db.execute(
        select(_addresses.c.user_id).where(
            _addresses.c.id == request.address_id
        )
    ).scalar()

    if (
        address_owner is None
        or address_owner != user_id
    ):
        raise InvalidOrder(
            f"Address {request.address_id} was not found in your account"
        )

    # -------------------------
    # SHIPPING VALIDATION
    # -------------------------

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

    # -------------------------
    # QUANTITY VALIDATION
    # -------------------------

    lines = _merge_lines(request.items)

    for line in lines:
        if (
            line.quantity <= 0
            or line.quantity > MAX_QUANTITY_PER_LINE
        ):
            raise InvalidOrder(
                f"Quantity must be between 1 and {MAX_QUANTITY_PER_LINE}"
            )

    # -------------------------
    # LOAD PRODUCTS
    # -------------------------

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

    # -------------------------
    # BUILD ORDER ITEMS
    # -------------------------

    items: List[OrderItemInput] = []

    for line in lines:

        product = products.get(
            line.product_id
        )

        if (
            product is None
            or str(product.status).upper() != ACTIVE
        ):
            raise InvalidOrder(
                f"Product {line.product_id} is not available"
            )

        unit_price = _money(
            product.price
        )

        if line.variant_id is not None:

            variant = variants.get(
                line.variant_id
            )

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

    # -------------------------
    # CENTRAL PRICING ENGINE
    # -------------------------

    pricing = calculate_pricing(
        items,
        tax_rate=Decimal("0.00"),
        discount=Decimal("0.00"),
    )

    subtotal = _money(
        pricing["subtotal"]
    )

    # -------------------------
    # SERVER-SIDE COUPON
    # -------------------------

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
            raise InvalidOrder(
                "Invalid coupon code"
            )

        discount = _coupon_discount(
            coupon,
            subtotal,
        )

        coupon_id = coupon.id

    # -------------------------
    # FINAL CENTRAL PRICING
    # -------------------------

    pricing = calculate_pricing(
        items,
        tax_rate=Decimal("0.00"),
        discount=discount,
    )

    subtotal = _money(
        pricing["subtotal"]
    )

    discount = _money(
        pricing["discount"]
    )

    tax = _money(
        pricing["tax"]
    )

    total_before_shipping = _money(
        pricing["total"]
    )

    total = _money(
        total_before_shipping + shipping_cost
    )

    # -------------------------
    # ORDER INPUT
    # -------------------------

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
