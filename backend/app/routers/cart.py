from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.cart import Cart, CartItem
from app.models.coupon import Coupon
from app.services.pricing_engine import calculate_pricing
from app.services.coupon_service import validate_coupon

from datetime import datetime
from pydantic import BaseModel, Field
from app.core.security import require_role
from app.models.user import User
router = APIRouter(
    prefix="/api/cart",
    tags=["Cart"]
)


# ============================================================
# REQUEST MODELS
# ============================================================

class AddCartItemRequest(BaseModel):
    product_id: int
    quantity: int
    variant_id: int | None = None


class UpdateCartItemRequest(BaseModel):
    quantity: int


class CouponRequest(BaseModel):
    code: str
class CouponCreateRequest(BaseModel):
    code: str
    discount_type: str
    discount_value: Decimal = Field(gt=0)
    min_order_value: Decimal | None = Field(default=None, ge=0)
    max_discount: Decimal | None = Field(default=None, gt=0)
    start_date: datetime
    expiry_date: datetime
    usage_limit: int | None = Field(default=None, gt=0)
    per_user_limit: int | None = Field(default=None, gt=0)
    status: bool = True


class CouponUpdateRequest(BaseModel):
    code: str | None = None
    discount_type: str | None = None
    discount_value: Decimal | None = Field(default=None, gt=0)
    min_order_value: Decimal | None = Field(default=None, ge=0)
    max_discount: Decimal | None = Field(default=None, gt=0)
    start_date: datetime | None = None
    expiry_date: datetime | None = None
    usage_limit: int | None = Field(default=None, gt=0)
    per_user_limit: int | None = Field(default=None, gt=0)
    status: bool | None = None

# ============================================================
# HELPER - GET CURRENT CART
# ============================================================

def get_current_cart(db: Session):
    """
    Temporary cart selection until authentication / guest-cart
    handling is connected with the Auth module.
    """
    cart = db.query(Cart).first()

    if not cart:
        cart = Cart()
        db.add(cart)
        db.commit()
        db.refresh(cart)

    return cart


# ============================================================
# CART-03 - ADD ITEM TO CART
# ============================================================

@router.post("/items")
def add_to_cart(
    request: AddCartItemRequest,
    db: Session = Depends(get_db)
):
    if request.quantity <= 0:
        raise HTTPException(
            status_code=400,
            detail="Quantity must be greater than 0"
        )

    # Get product from the confirmed Product table.
    product = db.execute(
        text("""
            SELECT id, price, stock_quantity, status
            FROM products
            WHERE id = :product_id
        """),
        {"product_id": request.product_id}
    ).mappings().first()

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    if product["status"] != "ACTIVE":
        raise HTTPException(
            status_code=400,
            detail="Product is not available"
        )

    # Default product price and stock
    unit_price = Decimal(str(product["price"]))
    available_stock = product["stock_quantity"]

    # If a variant is selected, use variant stock and price delta.
    if request.variant_id is not None:
        variant = db.execute(
            text("""
                SELECT id, product_id, price_delta, stock
                FROM product_variants
                WHERE id = :variant_id
            """),
            {"variant_id": request.variant_id}
        ).mappings().first()

        if not variant:
            raise HTTPException(
                status_code=404,
                detail="Product variant not found"
            )

        if variant["product_id"] != request.product_id:
            raise HTTPException(
                status_code=400,
                detail="Variant does not belong to this product"
            )

        unit_price += Decimal(str(variant["price_delta"]))
        available_stock = variant["stock"]

    # Find current cart.
    cart = get_current_cart(db)

    # Check whether same product + variant already exists.
    item = (
        db.query(CartItem)
        .filter(
            CartItem.cart_id == cart.id,
            CartItem.product_id == request.product_id,
            CartItem.variant_id == request.variant_id
        )
        .first()
    )

    new_quantity = request.quantity

    if item:
        new_quantity = item.quantity + request.quantity

    # Stock validation.
    if available_stock is not None and new_quantity > available_stock:
        raise HTTPException(
            status_code=400,
            detail=f"Only {available_stock} item(s) available in stock"
        )

    if item:
        item.quantity = new_quantity
        item.unit_price = unit_price
    else:
        item = CartItem(
            cart_id=cart.id,
            product_id=request.product_id,
            variant_id=request.variant_id,
            quantity=request.quantity,
            unit_price=unit_price
        )
        db.add(item)

    db.commit()
    db.refresh(item)

    return {
        "message": "Item added to cart",
        "cart_item_id": item.id,
        "product_id": item.product_id,
        "variant_id": item.variant_id,
        "quantity": item.quantity,
        "unit_price": item.unit_price
    }


# ============================================================
# CART-04 - VIEW CART
# ============================================================

@router.get("")
def get_cart(db: Session = Depends(get_db)):
    cart = db.query(Cart).first()

    if not cart:
        return {
            "cart_id": None,
            "items": [],
            "item_count": 0
        }

    items = []

    for item in cart.items:
        items.append({
            "id": item.id,
            "product_id": item.product_id,
            "variant_id": item.variant_id,
            "quantity": item.quantity,
            "unit_price": item.unit_price,
            "line_total": (
                Decimal(str(item.unit_price)) * item.quantity
            )
        })

    return {
        "cart_id": cart.id,
        "items": items,
        "item_count": sum(item.quantity for item in cart.items)
    }


# ============================================================
# CART-04 - UPDATE QUANTITY
# ============================================================

@router.put("/items/{item_id}")
def update_cart_item(
    item_id: int,
    request: UpdateCartItemRequest,
    db: Session = Depends(get_db)
):
    if request.quantity <= 0:
        raise HTTPException(
            status_code=400,
            detail="Quantity must be greater than 0"
        )

    item = db.query(CartItem).filter(
        CartItem.id == item_id
    ).first()

    if not item:
        raise HTTPException(
            status_code=404,
            detail="Cart item not found"
        )

    # Check product stock.
    if item.variant_id is not None:
        variant = db.execute(
            text("""
                SELECT stock
                FROM product_variants
                WHERE id = :variant_id
            """),
            {"variant_id": item.variant_id}
        ).mappings().first()

        if variant and request.quantity > variant["stock"]:
            raise HTTPException(
                status_code=400,
                detail=f"Only {variant['stock']} item(s) available in stock"
            )

    else:
        product = db.execute(
            text("""
                SELECT stock_quantity
                FROM products
                WHERE id = :product_id
            """),
            {"product_id": item.product_id}
        ).mappings().first()

        if product and request.quantity > product["stock_quantity"]:
            raise HTTPException(
                status_code=400,
                detail=f"Only {product['stock_quantity']} item(s) available in stock"
            )

    item.quantity = request.quantity

    db.commit()
    db.refresh(item)

    return {
        "message": "Cart quantity updated",
        "cart_item_id": item.id,
        "quantity": item.quantity
    }


# ============================================================
# CART-04 - REMOVE ITEM
# ============================================================

@router.delete("/items/{item_id}")
def remove_cart_item(
    item_id: int,
    db: Session = Depends(get_db)
):
    item = db.query(CartItem).filter(
        CartItem.id == item_id
    ).first()

    if not item:
        raise HTTPException(
            status_code=404,
            detail="Cart item not found"
        )

    db.delete(item)
    db.commit()

    return {
        "message": "Item removed from cart"
    }


# ============================================================
# CART-05 - PRICING SUMMARY
# ============================================================

@router.get("/summary")
def get_cart_summary(db: Session = Depends(get_db)):
    cart = db.query(Cart).first()

    if not cart:
        return {
            "subtotal": Decimal("0.00"),
            "discount": Decimal("0.00"),
            "tax": Decimal("0.00"),
            "total": Decimal("0.00")
        }

    pricing = calculate_pricing(cart.items)

    return {
        "subtotal": pricing["subtotal"],
        "discount": pricing["discount"],
        "tax": pricing["tax"],
        "total": pricing["total"]
    }


# ============================================================
# CART-06 - APPLY COUPON
# ============================================================

@router.post("/coupon")
def apply_coupon(
    request: CouponRequest,
    db: Session = Depends(get_db)
):
    coupon = (
        db.query(Coupon)
        .filter(Coupon.code == request.code.upper())
        .first()
    )

    if not coupon:
        raise HTTPException(
            status_code=404,
            detail="Invalid coupon code"
        )

    cart = db.query(Cart).first()

    order_value = Decimal("0.00")

    if cart:
        for item in cart.items:
            order_value += (
                Decimal(str(item.unit_price)) * item.quantity
            )

    valid, message = validate_coupon(
        coupon,
        order_value
    )

    if not valid:
        raise HTTPException(
            status_code=400,
            detail=message
        )

    return {
        "message": "Coupon applied successfully",
        "code": coupon.code,
        "discount_type": coupon.discount_type,
        "discount_value": coupon.discount_value
    }
# ============================================================
# CART-07 - ADMIN COUPON MANAGEMENT
# ============================================================

@router.get("/admin/coupons")
def get_admin_coupons(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    coupons = (
        db.query(Coupon)
        .order_by(Coupon.id.desc())
        .all()
    )

    return [
        {
            "id": coupon.id,
            "code": coupon.code,
            "discount_type": coupon.discount_type,
            "discount_value": coupon.discount_value,
            "min_order_value": coupon.min_order_value,
            "max_discount": coupon.max_discount,
            "start_date": coupon.start_date,
            "expiry_date": coupon.expiry_date,
            "usage_limit": coupon.usage_limit,
            "per_user_limit": coupon.per_user_limit,
            "status": coupon.status,
        }
        for coupon in coupons
    ]


@router.post("/admin/coupons", status_code=201)
def create_admin_coupon(
    request: CouponCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    code = request.code.strip().upper()

    if request.start_date >= request.expiry_date:
        raise HTTPException(
            status_code=400,
            detail="Expiry date must be after start date"
        )

    if request.discount_type not in ["PERCENTAGE", "FIXED"]:
        raise HTTPException(
            status_code=400,
            detail="Discount type must be PERCENTAGE or FIXED"
        )

    if request.discount_type == "PERCENTAGE" and request.discount_value > 100:
        raise HTTPException(
            status_code=400,
            detail="Percentage discount cannot exceed 100"
        )

    existing = (
        db.query(Coupon)
        .filter(Coupon.code == code)
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Coupon code already exists"
        )

    coupon = Coupon(
        code=code,
        discount_type=request.discount_type,
        discount_value=request.discount_value,
        min_order_value=request.min_order_value,
        max_discount=request.max_discount,
        start_date=request.start_date,
        expiry_date=request.expiry_date,
        usage_limit=request.usage_limit,
        per_user_limit=request.per_user_limit,
        status=request.status,
    )

    db.add(coupon)
    db.commit()
    db.refresh(coupon)

    return {
        "message": "Coupon created successfully",
        "coupon": {
            "id": coupon.id,
            "code": coupon.code,
            "discount_type": coupon.discount_type,
            "discount_value": coupon.discount_value,
            "status": coupon.status,
        }
    }


@router.put("/admin/coupons/{coupon_id}")
def update_admin_coupon(
    coupon_id: int,
    request: CouponUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    coupon = db.query(Coupon).filter(
        Coupon.id == coupon_id
    ).first()

    if not coupon:
        raise HTTPException(
            status_code=404,
            detail="Coupon not found"
        )

    if request.code is not None:
        new_code = request.code.strip().upper()

        duplicate = (
            db.query(Coupon)
            .filter(
                Coupon.code == new_code,
                Coupon.id != coupon_id
            )
            .first()
        )

        if duplicate:
            raise HTTPException(
                status_code=400,
                detail="Coupon code already exists"
            )

        coupon.code = new_code

    if request.discount_type is not None:
        if request.discount_type not in ["PERCENTAGE", "FIXED"]:
            raise HTTPException(
                status_code=400,
                detail="Discount type must be PERCENTAGE or FIXED"
            )

        coupon.discount_type = request.discount_type

    if request.discount_value is not None:
        coupon.discount_value = request.discount_value

    if request.min_order_value is not None:
        coupon.min_order_value = request.min_order_value

    if request.max_discount is not None:
        coupon.max_discount = request.max_discount

    if request.start_date is not None:
        coupon.start_date = request.start_date

    if request.expiry_date is not None:
        coupon.expiry_date = request.expiry_date

    if coupon.start_date >= coupon.expiry_date:
        raise HTTPException(
            status_code=400,
            detail="Expiry date must be after start date"
        )

    if coupon.discount_type == "PERCENTAGE" and coupon.discount_value > 100:
        raise HTTPException(
            status_code=400,
            detail="Percentage discount cannot exceed 100"
        )

    if request.usage_limit is not None:
        coupon.usage_limit = request.usage_limit

    if request.per_user_limit is not None:
        coupon.per_user_limit = request.per_user_limit

    if request.status is not None:
        coupon.status = request.status

    db.commit()
    db.refresh(coupon)

    return {
        "message": "Coupon updated successfully",
        "coupon": {
            "id": coupon.id,
            "code": coupon.code,
            "discount_type": coupon.discount_type,
            "discount_value": coupon.discount_value,
            "status": coupon.status,
        }
    }


@router.patch("/admin/coupons/{coupon_id}/deactivate")
def deactivate_admin_coupon(
    coupon_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    coupon = db.query(Coupon).filter(
        Coupon.id == coupon_id
    ).first()

    if not coupon:
        raise HTTPException(
            status_code=404,
            detail="Coupon not found"
        )

    coupon.status = False

    db.commit()
    db.refresh(coupon)

    return {
        "message": "Coupon deactivated successfully",
        "coupon_id": coupon.id,
        "status": coupon.status
    }