
import logging
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from fastapi.encoders import jsonable_encoder
from pydantic import BaseModel
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


class CheckoutReviewRequest(BaseModel):
    address_id: int
    shipping_method_id: int
    coupon_code: str | None = None


def _as_utc(value: datetime) -> datetime:
    """Normalize database datetime values to UTC for comparison."""
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


@router.post("/review")
def checkout_review(
    data: CheckoutReviewRequest,
    user: User = Depends(customer_only),
    db: Session = Depends(get_db),
):
    # 1. Validate customer address.
    address = db.execute(
        text("""
            SELECT
                id,
                full_name,
                phone,
                line1,
                line2,
                city,
                state,
                postal_code,
                country,
                address_type
            FROM addresses
            WHERE id = :address_id
              AND user_id = :user_id
        """),
        {
            "address_id": data.address_id,
            "user_id": user.id,
        },
    ).mappings().first()

    if address is None:
        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid address or address does not belong "
                "to the current customer"
            ),
        )

    # 2. Validate shipping method.
    shipping = db.execute(
        text("""
            SELECT
                id,
                name,
                cost,
                estimated_days,
                status
            FROM shipping_methods
            WHERE id = :shipping_method_id
              AND status = TRUE
        """),
        {
            "shipping_method_id": data.shipping_method_id,
        },
    ).mappings().first()

    if shipping is None:
        raise HTTPException(
            status_code=400,
            detail="Invalid or inactive shipping method",
        )

    # 3. Get the customer's cart.
    cart = db.execute(
        text("""
            SELECT id
            FROM carts
            WHERE user_id = :user_id
            ORDER BY id DESC
            LIMIT 1
        """),
        {
            "user_id": user.id,
        },
    ).mappings().first()

    if cart is None:
        raise HTTPException(
            status_code=400,
            detail="Cart not found",
        )

    # 4. Get cart items.
    cart_items = db.execute(
        text("""
            SELECT
                id,
                product_id,
                variant_id,
                quantity,
                unit_price
            FROM cart_items
            WHERE cart_id = :cart_id
            ORDER BY id
        """),
        {
            "cart_id": cart["id"],
        },
    ).mappings().all()

    if not cart_items:
        raise HTTPException(
            status_code=400,
            detail="Cart is empty",
        )

    # 5. Validate quantities and available inventory.
    review_items = []
    subtotal = Decimal("0.00")

    for item in cart_items:
        quantity = int(item["quantity"])

        if quantity <= 0:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Invalid quantity for product "
                    f"{item['product_id']}"
                ),
            )

        if item["variant_id"] is None:
            inventory = db.execute(
                text("""
                    SELECT quantity
                    FROM inventory
                    WHERE product_id = :product_id
                      AND variant_id IS NULL
                    LIMIT 1
                """),
                {
                    "product_id": item["product_id"],
                },
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
                    "product_id": item["product_id"],
                    "variant_id": item["variant_id"],
                },
            ).mappings().first()

        available_quantity = (
            int(inventory["quantity"])
            if inventory is not None
            else 0
        )

        if available_quantity < quantity:
            raise HTTPException(
                status_code=409,
                detail=(
                    f"Insufficient stock for product "
                    f"{item['product_id']}. "
                    f"Requested: {quantity}, "
                    f"Available: {available_quantity}"
                ),
            )

        unit_price = Decimal(str(item["unit_price"]))
        line_total = unit_price * quantity
        subtotal += line_total

        review_items.append({
            "cart_item_id": item["id"],
            "product_id": item["product_id"],
            "variant_id": item["variant_id"],
            "quantity": quantity,
            "unit_price": unit_price,
            "line_total": line_total,
            "available_stock": available_quantity,
        })

    # 6. Validate coupon, if supplied.
    discount = Decimal("0.00")
    coupon_details = None

    if data.coupon_code:
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
                    status
                FROM coupons
                WHERE code = :coupon_code
                LIMIT 1
            """),
            {
                "coupon_code": data.coupon_code.strip().upper(),
            },
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
            and subtotal < Decimal(str(coupon["min_order_value"]))
        ):
            raise HTTPException(
                status_code=400,
                detail="Minimum order value not met",
            )

        if (
            coupon["usage_limit"] is not None
            and coupon["usage_limit"] <= 0
        ):
            raise HTTPException(
                status_code=400,
                detail="Coupon usage limit exceeded",
            )

        discount_value = Decimal(str(coupon["discount_value"]))

        if coupon["discount_type"].lower() == "percentage":
            discount = subtotal * discount_value / Decimal("100")

            if coupon["max_discount"] is not None:
                discount = min(
                    discount,
                    Decimal(str(coupon["max_discount"])),
                )

        elif coupon["discount_type"].lower() == "fixed":
            discount = discount_value

        else:
            raise HTTPException(
                status_code=400,
                detail="Invalid coupon discount type",
            )

        discount = min(discount, subtotal)
        discount = max(Decimal("0.00"), discount)

        coupon_details = {
            "code": coupon["code"],
            "discount_type": coupon["discount_type"],
            "discount_value": coupon["discount_value"],
            "discount_amount": discount,
        }

    # 7. Calculate the checkout total.
    shipping_cost = Decimal(str(shipping["cost"]))

    discounted_subtotal = max(
        Decimal("0.00"),
        subtotal - discount,
    )

    total = discounted_subtotal + shipping_cost

    # 8. Return the validated checkout review.
    return {
        "message": "Checkout review is valid",
        "validation": {
            "address": True,
            "shipping": True,
            "stock": True,
            "coupon": True,
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


# CHK-06: Create a checkout session for downstream handoff.
@router.post("/session", status_code=201)
def create_checkout_session(
    data: CheckoutReviewRequest,
    user: User = Depends(customer_only),
    db: Session = Depends(get_db),
):
    # Revalidate checkout on the server before creating the session.
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

        # Print the real database/model error in the backend terminal.
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
