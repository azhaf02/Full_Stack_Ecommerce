from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app.database.connection import get_db
from app.models.product import Product

router = APIRouter(
    prefix="/api/products",
    tags=["Products"]
)


@router.get("/{product_id}")
def get_product_detail(
    product_id: int,
    db: Session = Depends(get_db)
):
    product = (
        db.query(Product)
        .options(
            joinedload(Product.images),
            joinedload(Product.category)
        )
        .filter(Product.id == product_id)
        .first()
    )

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    related_products = (
        db.query(Product)
        .filter(
            Product.category_id == product.category_id,
            Product.id != product_id
        )
        .limit(4)
        .all()
    )

    return {
        "id": product.id,
        "name": product.name,
        "description": product.description,
        "price": product.price,
        "stock_quantity": product.stock_quantity,
        "status": product.status,
        "category_id": product.category_id,
        "category_name": product.category.name if product.category else None,
        "images": [
            {
                "id": image.id,
                "image_url": image.image_url,
                "is_primary": image.is_primary
            }
            for image in product.images
        ],
        "related_products": [
            {
                "id": item.id,
                "name": item.name,
                "price": item.price,
                "status": item.status
            }
            for item in related_products
        ]
    }