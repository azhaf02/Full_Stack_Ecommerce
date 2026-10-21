from datetime import datetime
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.security import require_role
from app.models.user import User


router = APIRouter(
    prefix="/api/checkout",
    tags=["Checkout"]
)

customer_only = require_role("customer")


class CheckoutReviewRequest(BaseModel):
    address_id: int
    shipping_method_id: int
    coupon_code: str | None = None


@router.post("/review")
def checkout_review(
    data: CheckoutReviewRequest,
    user: User = Depends(customer_only),
    db: Session = Depends(get_db),
):
    # ---------------------------------------------------------
    # 1. Validate address
    # ---------------------------------------------------------
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
            detail="Invalid address or address does not belong to the current customer"
        )

    # ---------------------------------------------------------
    # 2. Validate shipping method
    # ---------------------------------------------------------
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
            detail="Invalid or inactive shipping method"
        )

    # ---------------------------------------------------------
    # 3. Get current customer's cart
    # ---------------------------------------------------------
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
            detail="Cart not found"
        )

    # ---------------------------------------------------------
    # 4. Get cart items
    # ---------------------------------------------------------
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
            detail="Cart is empty"
        )

    # ---------------------------------------------------------
    # 5. Re-validate stock
    # ---------------------------------------------------------
    review_items = []
    subtotal = Decimal("0.00")

    for item in cart_items:
        quantity = int(item["quantity"])

        if quantity <= 0:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid quantity for product {item['product_id']}"
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
                    f"Insufficient stock for product {item['product_id']}. "
                    f"Requested: {quantity}, Available: {available_quantity}"
                )
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

    # ---------------------------------------------------------
    # 6. Re-validate coupon
    # ---------------------------------------------------------
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
                detail="Invalid coupon code"
            )

        now = datetime.utcnow()

        if not coupon["status"]:
            raise HTTPException(
                status_code=400,
                detail="Coupon is inactive"
            )

        if now < coupon["start_date"]:
            raise HTTPException(
                status_code=400,
                detail="Coupon is not active yet"
            )

        if now > coupon["expiry_date"]:
            raise HTTPException(
                status_code=400,
                detail="Coupon has expired"
            )

        if (
            coupon["min_order_value"] is not None
            and subtotal < Decimal(str(coupon["min_order_value"]))
        ):
            raise HTTPException(
                status_code=400,
                detail="Minimum order value not met"
            )

        if (
            coupon["usage_limit"] is not None
            and coupon["usage_limit"] <= 0
        ):
            raise HTTPException(
                status_code=400,
                detail="Coupon usage limit exceeded"
            )

        discount_value = Decimal(str(coupon["discount_value"]))

        if coupon["discount_type"].lower() == "percentage":
            discount = subtotal * discount_value / Decimal("100")

            if coupon["max_discount"] is not None:
                discount = min(
                    discount,
                    Decimal(str(coupon["max_discount"]))
                )

        elif coupon["discount_type"].lower() == "fixed":
            discount = discount_value

        else:
            raise HTTPException(
                status_code=400,
                detail="Invalid coupon discount type"
            )

        discount = min(discount, subtotal)
        discount = max(Decimal("0.00"), discount)

        coupon_details = {
            "code": coupon["code"],
            "discount_type": coupon["discount_type"],
            "discount_value": coupon["discount_value"],
            "discount_amount": discount,
        }

    # ---------------------------------------------------------
    # 7. Calculate final review total
    # ---------------------------------------------------------
    shipping_cost = Decimal(str(shipping["cost"]))
    discounted_subtotal = max(
        Decimal("0.00"),
        subtotal - discount
    )

    total = discounted_subtotal + shipping_cost

    # ---------------------------------------------------------
    # 8. Return complete checkout review
    # ---------------------------------------------------------
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