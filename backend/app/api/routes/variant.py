from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.product import Product
from app.models.product_variant import ProductVariant

router = APIRouter(
    prefix="/api/products",
    tags=["Product Variants"]
)


@router.get("/{product_id}/variants")
def get_product_variants(
    product_id: int,
    db: Session = Depends(get_db)
):
    # Check whether the product exists
    product = (
        db.query(Product)
        .filter(Product.id == product_id)
        .first()
    )

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    variants = (
        db.query(ProductVariant)
        .filter(ProductVariant.product_id == product_id)
        .all()
    )

    result = []

    for variant in variants:
        # Read variant stock from Rehan's inventory table.
        # Inventory.quantity is the stock source of truth.
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
                "variant_id": variant.id
            }
        ).fetchone()

        stock = inventory[0] if inventory else 0

        result.append({
            "id": variant.id,
            "product_id": variant.product_id,
            "attribute_name": variant.attribute_name,
            "attribute_value": variant.attribute_value,
            "price_delta": float(variant.price_delta),
            "stock": stock
        })

    return result