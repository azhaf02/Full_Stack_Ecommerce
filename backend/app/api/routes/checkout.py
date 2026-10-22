
import logging
from datetime import datetime, timedelta, timezone
from decimal import Decimal, ROUND_HALF_UP
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from fastapi.encoders import jsonable_encoder
from pydantic import BaseModel, ConfigDict
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.security import require_role
from app.database import get_db
from app.models.checkout_session import CheckoutSession
from app.models.user import User


logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/checkout",
    tags=["Checkout"],
)

customer_only = require_role("customer")

CENT = Decimal("0.01")
ZERO = Decimal("0.00")


def _money(value) -> Decimal:
    """Convert monetary values to two decimal places."""
    return Decimal(str(value)).quantize(CENT, rounding=ROUND_HALF_UP)


def _as_utc(value: datetime) -> datetime:
    """Normalize database datetime values to UTC for comparison."""
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


class CheckoutReviewRequest(BaseModel):
    # Reject client-supplied totals, prices and other unexpected fields.
    model_config = ConfigDict(extra="forbid")

    address_id: int
    shipping_method_id: int
    coupon_code: str | None = None


@router.post("/review")
def checkout_review(
    data: CheckoutReviewRequest,
    user: User = Depends(customer_only),
    db: Session = Depends(get_db),
):
    # 1. Validate that the address belongs to this customer.
    address = db.execute(
        text("""
            SELECT
                id, full_name, phone, line1, line2, city,
                state, postal_code, country, address_type
            FROM addresses
            WHERE id = :address_id AND user_id = :user_id
        """),
        {"address_id": data.address_id, "user_id": user.id},
    ).mappings().first()

    if address is None:
        raise HTTPException(
            status_code=400,
            detail="Invalid address or address does not belong to the current customer",
        )

    # 2. Validate shipping method.
    shipping = db.execute(
        text("""
            SELECT id, name, cost, estimated_days, status
            FROM shipping_methods
            WHERE id = :shipping_method_id AND status = TRUE
        """),
        {"shipping_method_id": data.shipping_method_id},
    ).mappings().first()

    if shipping is None:
        raise HTTPException(
            status_code=400,
            detail="Invalid or inactive shipping method",
        )

    shipping_cost = _money(shipping["cost"])

    if shipping_cost < ZERO:
        raise HTTPException(
            status_code=409,
            detail="Invalid shipping price configuration",
        )

    # 3. Find this customer's cart.
    cart = db.execute(
        text("""
            SELECT id
            FROM carts
            WHERE user_id = :user_id
            ORDER BY id DESC
            LIMIT 1
        """),
        {"user_id": user.id},
    ).mappings().first()

    if cart is None:
        raise HTTPException(status_code=400, detail="Cart not found")

    # 4. Load cart items. Cart prices are not authoritative.
    cart_items = db.execute(
        text("""
            SELECT id, product_id, variant_id, quantity, unit_price
            FROM cart_items
            WHERE cart_id = :cart_id
            ORDER BY id
        """),
        {"cart_id": cart["id"]},
    ).mappings().all()

    if not cart_items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    # 5. Recalculate item prices from current database prices.
    review_items = []
    subtotal = ZERO

    for item in cart_items:
        product_id = item["product_id"]
        variant_id = item["variant_id"]

        try:
            quantity = int(item["quantity"])
        except (TypeError, ValueError):
            raise HTTPException(
                status_code=400,
                detail=f"Invalid quantity for product {product_id}",
            )

        if quantity <= 0:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid quantity for product {product_id}",
            )

        product = db.execute(
            text("""
                SELECT id, price, status
                FROM products
                WHERE id = :product_id
                LIMIT 1
            """),
            {"product_id": product_id},
        ).mappings().first()

        if product is None or str(product["status"]).upper() != "ACTIVE":
            raise HTTPException(
                status_code=409,
                detail=f"Product {product_id} is unavailable. Refresh your cart.",
            )

        base_price = _money(product["price"])

        if base_price < ZERO:
            raise HTTPException(
                status_code=409,
                detail=f"Invalid price configuration for product {product_id}",
            )

        if variant_id is not None:
            variant = db.execute(
                text("""
                    SELECT id, product_id, price_delta
                    FROM product_variants
                    WHERE id = :variant_id
                      AND product_id = :product_id
                    LIMIT 1
                """),
                {
                    "variant_id": variant_id,
                    "product_id": product_id,
                },
            ).mappings().first()

            if variant is None:
                raise HTTPException(
                    status_code=409,
                    detail=(
                        f"Invalid product variant for product {product_id}. "
                        "Refresh your cart."
                    ),
                )

            price_delta = _money(variant["price_delta"])
            current_unit_price = _money(base_price + price_delta)

        else:
            # Products with variants require a selected valid variant.
            variant_exists = db.execute(
                text("""
                    SELECT id
                    FROM product_variants
                    WHERE product_id = :product_id
                    LIMIT 1
                """),
                {"product_id": product_id},
            ).mappings().first()

            if variant_exists is not None:
                raise HTTPException(
                    status_code=409,
                    detail=(
                        f"Select a valid variant for product {product_id}. "
                        "Refresh your cart."
                    ),
                )

            current_unit_price = base_price

        if current_unit_price < ZERO:
            raise HTTPException(
                status_code=409,
                detail=f"Invalid calculated price for product {product_id}",
            )

        # Reject stale/tampered saved cart prices.
        saved_unit_price = _money(item["unit_price"])

        if saved_unit_price != current_unit_price:
            raise HTTPException(
                status_code=409,
                detail=(
                    f"Price changed for product {product_id}. "
                    "Refresh your cart before checkout."
                ),
            )

        # Check inventory for the exact product/variant.
        if variant_id is None:
            inventory = db.execute(
                text("""
                    SELECT quantity
                    FROM inventory
                    WHERE product_id = :product_id
                      AND variant_id IS NULL
                    LIMIT 1
                """),
                {"product_id": product_id},
            ).mappings().first()
        else:
            inventory = db.execute(
                text("""
                    SELECT quantity
                    FROM inventory
                    WHERE product_id = :product_id
                      AND variant_id = :variant_id
                    LIMIT 1
                """),
                {
                    "product_id": product_id,
                    "variant_id": variant_id,
                },
            ).mappings().first()

        available_quantity = (
            int(inventory["quantity"]) if inventory is not None else 0
        )

        if available_quantity < quantity:
            raise HTTPException(
                status_code=409,
                detail=(
                    f"Insufficient stock for product {product_id}. "
                    f"Requested: {quantity}, Available: {available_quantity}"
                ),
            )

        line_total = _money(current_unit_price * quantity)
        subtotal = _money(subtotal + line_total)

        review_items.append({
            "cart_item_id": item["id"],
            "product_id": product_id,
            "variant_id": variant_id,
            "quantity": quantity,
            "unit_price": current_unit_price,
            "line_total": line_total,
            "available_stock": available_quantity,
        })

    # 6. Validate coupon and calculate discount on the server.
    discount = ZERO
    coupon_details = None

    if data.coupon_code:
        normalized_code = data.coupon_code.strip().upper()

        if not normalized_code:
            raise HTTPException(
                status_code=400,
                detail="Invalid coupon code",
            )

        coupon = db.execute(
            text("""
                SELECT
                    id,
                    code,
                    discount_type,
                    discount_value,
                    min_order_value,
                    max_discount,
                    start_date,
                    expiry_date,
                    usage_limit,
                    per_user_limit,
                    status
                FROM coupons
                WHERE code = :coupon_code
                LIMIT 1
            """),
            {"coupon_code": normalized_code},
        ).mappings().first()

        if coupon is None:
            raise HTTPException(
                status_code=400,
                detail="Invalid coupon code",
            )

        if not coupon["status"]:
            raise HTTPException(
                status_code=400,
                detail="Coupon is inactive",
            )

        now = datetime.now(timezone.utc)
        start_date = coupon["start_date"]
        expiry_date = coupon["expiry_date"]

        if start_date is not None and now < _as_utc(start_date):
            raise HTTPException(
                status_code=400,
                detail="Coupon is not active yet",
            )

        if expiry_date is not None and now > _as_utc(expiry_date):
            raise HTTPException(
                status_code=400,
                detail="Coupon has expired",
            )

        if (
            coupon["min_order_value"] is not None
            and subtotal < _money(coupon["min_order_value"])
        ):
            raise HTTPException(
                status_code=400,
                detail="Minimum order value not met",
            )

        # Count successful/non-cancelled orders using this coupon.
        usage_counts = db.execute(
            text("""
                SELECT
                    COUNT(*) AS total_usage,
                    COUNT(*) FILTER (
                        WHERE user_id = :user_id
                    ) AS user_usage
                FROM orders
                WHERE coupon_id = :coupon_id
                  AND status != 'CANCELLED'
            """),
            {
                "coupon_id": coupon["id"],
                "user_id": user.id,
            },
        ).mappings().first()

        if usage_counts is None:
            raise HTTPException(
                status_code=500,
                detail="Could not validate coupon usage",
            )

        total_usage = int(usage_counts["total_usage"] or 0)
        user_usage = int(usage_counts["user_usage"] or 0)

        if (
            coupon["usage_limit"] is not None
            and total_usage >= int(coupon["usage_limit"])
        ):
            raise HTTPException(
                status_code=400,
                detail="Coupon usage limit exceeded",
            )

        if (
            coupon["per_user_limit"] is not None
            and user_usage >= int(coupon["per_user_limit"])
        ):
            raise HTTPException(
                status_code=400,
                detail="Per-user coupon usage limit exceeded",
            )

        discount_value = _money(coupon["discount_value"])
        discount_type = str(coupon["discount_type"]).lower()

        if discount_value < ZERO:
            raise HTTPException(
                status_code=400,
                detail="Invalid coupon discount configuration",
            )

        if discount_type == "percentage":
            discount = _money(
                subtotal * discount_value / Decimal("100")
            )

            if coupon["max_discount"] is not None:
                max_discount = _money(coupon["max_discount"])

                if max_discount < ZERO:
                    raise HTTPException(
                        status_code=400,
                        detail="Invalid coupon discount configuration",
                    )

                discount = min(discount, max_discount)

        elif discount_type == "fixed":
            discount = discount_value

        else:
            raise HTTPException(
                status_code=400,
                detail="Invalid coupon discount type",
            )

        # Never allow the discount to exceed the subtotal.
        discount = min(max(discount, ZERO), subtotal)

        coupon_details = {
            "id": coupon["id"],
            "code": coupon["code"],
            "discount_type": coupon["discount_type"],
            "discount_value": discount_value,
            "discount_amount": discount,
        }

    # 7. Compute totals using trusted server-side values.
    discounted_subtotal = max(ZERO, _money(subtotal - discount))
    total = _money(discounted_subtotal + shipping_cost)

    # 8. Return the validated checkout review.
    return {
        "message": "Checkout review is valid",
        "validation": {
            "address": True,
            "shipping": True,
            "stock": True,
            "coupon": True,
            "server_pricing": True,
        },
        "address": dict(address),
        "shipping": {
            "id": shipping["id"],
            "name": shipping["name"],
            "cost": shipping_cost,
            "estimated_days": shipping["estimated_days"],
        },
        "items": review_items,
        "coupon": coupon_details,
        "summary": {
            "subtotal": subtotal,
            "discount": discount,
            "shipping": shipping_cost,
            "total": total,
        },
        "ready_for_payment": True,
    }


# CHK-06: Preserve checkout-session handoff.
@router.post("/session", status_code=201)
def create_checkout_session(
    data: CheckoutReviewRequest,
    user: User = Depends(customer_only),
    db: Session = Depends(get_db),
):
    # Always revalidate address, shipping, stock and current prices.
    review = checkout_review(data, user, db)

    if review.get("ready_for_payment") is not True:
        raise HTTPException(
            status_code=400,
            detail="Checkout is not ready for payment.",
        )

    now = datetime.now(timezone.utc)

    session = CheckoutSession(
        session_id=str(uuid4()),
        customer_id=str(user.id),
        status="active",
        checkout_snapshot=jsonable_encoder(review),
        created_at=now,
        expires_at=now + timedelta(minutes=30),
    )

    try:
        db.add(session)
        db.commit()
        db.refresh(session)
    except Exception:
        db.rollback()
        logger.exception("Failed to create checkout session")
        raise HTTPException(
            status_code=500,
            detail="Could not create checkout session. Check backend logs.",
        )

    return {
        "checkout_reference_id": session.session_id,
        "session_id": session.session_id,
        "status": session.status,
        "expires_at": session.expires_at,
        "checkout": review,
    }
