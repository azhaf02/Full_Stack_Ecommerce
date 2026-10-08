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
from app.services.inventory_service import validate_stock, InsufficientStockError


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

    # Shared inventory validation.
    try:
        validate_stock(
            db,
            request.product_id,
            new_quantity,
            request.variant_id
        )
    except InsufficientStockError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc)
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

    # Shared inventory validation.
    try:
        validate_stock(
            db,
            item.product_id,
            request.quantity,
            item.variant_id
        )
    except InsufficientStockError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc)
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
