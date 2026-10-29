"""Server-side pricing for a new order.

The customer says WHAT they want (product, variant, quantity), WHERE it goes (their address) and HOW it
ships and is paid. Everything with a price on it is read from the database here. The browser never sends a
price, total or shipping cost, so it can't change them.

The catalog tables belong to other modules (products: Chandani, product_variants: Gazala, shipping_methods:
Safiya, addresses: Madeeha). They're read with lightweight table definitions that are NOT registered in the
shared SQLAlchemy metadata, so they can't clash with those modules' own models when their branches merge.
Once Safiya's checkout session and Zubiya's pricing engine are merged, price_order() is the one function
to replace; create_order() and everything after it stay as they are.

Tax, discount and coupon are zero for now (Zubiya's pricing engine isn't merged yet).
"""
from dataclasses import dataclass
from decimal import Decimal
from typing import Dict, List, Optional, Tuple
from sqlalchemy import Boolean, Integer, Numeric, String, column, select, table
from sqlalchemy.orm import Session

from app.services.order_service import InvalidOrder, OrderInput, OrderItemInput

_products = table("products", column("id", Integer), column("name", String), column("price", Numeric),
                  column("status", String))
_variants = table("product_variants", column("id", Integer), column("product_id", Integer),
                  column("price_delta", Numeric))
_shipping = table("shipping_methods", column("id", Integer), column("cost", Numeric), column("status", Boolean))
_addresses = table("addresses", column("id", Integer), column("user_id", Integer))

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


def _money(value) -> Decimal:
    return Decimal(value).quantize(Decimal("0.01"))


def _merge_lines(lines: List[OrderLine]) -> List[OrderLine]:
    """The same product and variant listed twice becomes one line with the quantities added up."""
    merged: Dict[Tuple[int, Optional[int]], int] = {}
    for line in lines:
        key = (line.product_id, line.variant_id)
        merged[key] = merged.get(key, 0) + line.quantity
    return [OrderLine(product_id=p, variant_id=v, quantity=q) for (p, v), q in merged.items()]


def price_order(db: Session, user_id: int, request: OrderRequest) -> OrderInput:
    """Turn a customer's request into a fully priced OrderInput, or raise InvalidOrder."""
    if not request.items:
        raise InvalidOrder("An order needs at least one item")

    address_owner = db.execute(select(_addresses.c.user_id).where(_addresses.c.id == request.address_id)).scalar()
    if address_owner is None or address_owner != user_id:
        # Same message whether it doesn't exist or belongs to someone else.
        raise InvalidOrder(f"Address {request.address_id} was not found in your account")

    shipping_cost = db.execute(select(_shipping.c.cost).where(
        _shipping.c.id == request.shipping_method_id, _shipping.c.status.is_(True))).scalar()
    if shipping_cost is None:
        raise InvalidOrder(f"Shipping method {request.shipping_method_id} is not available")

    lines = _merge_lines(request.items)
    for line in lines:
        if line.quantity <= 0 or line.quantity > MAX_QUANTITY_PER_LINE:
            raise InvalidOrder(f"Quantity must be between 1 and {MAX_QUANTITY_PER_LINE}")

    product_ids = sorted({line.product_id for line in lines})
    products = {row.id: row for row in db.execute(
        select(_products.c.id, _products.c.name, _products.c.price, _products.c.status)
        .where(_products.c.id.in_(product_ids)))}
    variants = {row.id: row for row in db.execute(
        select(_variants.c.id, _variants.c.product_id, _variants.c.price_delta)
        .where(_variants.c.product_id.in_(product_ids)))}
    products_with_variants = {v.product_id for v in variants.values()}

    items: List[OrderItemInput] = []
    for line in lines:
        product = products.get(line.product_id)
        if product is None or str(product.status).upper() != ACTIVE:
            raise InvalidOrder(f"Product {line.product_id} is not available")
        unit_price = _money(product.price)
        if line.variant_id is not None:
            variant = variants.get(line.variant_id)
            if variant is None or variant.product_id != line.product_id:
                raise InvalidOrder(f"Variant {line.variant_id} does not belong to product {line.product_id}")
            unit_price = _money(unit_price + variant.price_delta)
        elif line.product_id in products_with_variants:
            raise InvalidOrder(f"Choose a variant for '{product.name}'")
        if unit_price < 0:
            raise InvalidOrder(f"Product {line.product_id} has an invalid price")
        items.append(OrderItemInput(product_id=line.product_id, variant_id=line.variant_id,
                                    quantity=line.quantity, unit_price=unit_price))

    subtotal = sum((i.unit_price * i.quantity for i in items), Decimal("0"))
    shipping_cost = _money(shipping_cost)
    return OrderInput(
        user_id=user_id, address_id=request.address_id, shipping_method_id=request.shipping_method_id,
        payment_method=request.payment_method, items=items, subtotal=subtotal, discount_amount=Decimal("0"),
        tax_amount=Decimal("0"), shipping_cost=shipping_cost, total_amount=subtotal + shipping_cost,
    )
