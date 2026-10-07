from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field, field_validator
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.product import Product


router = APIRouter(
    prefix="/api/products",
    tags=["Product Search"]
)


class ProductSearchQuery(BaseModel):
    q: str = Field(..., min_length=1, max_length=100)

    @field_validator("q")
    @classmethod
    def validate_query(cls, value: str) -> str:
        value = value.strip()

        if not value:
            raise ValueError("Search query cannot be empty")

        return value


@router.get("/search")
def search_products(
    params: ProductSearchQuery = Depends(),
    db: Session = Depends(get_db)
):
    search_term = f"%{params.q}%"

    products = (
        db.query(Product)
        .filter(
            or_(
                Product.name.ilike(search_term),
                Product.description.ilike(search_term)
            )
        )
        .all()
    )

    return [
        {
            "id": product.id,
            "name": product.name,
            "description": product.description,
            "price": product.price,
            "stock_quantity": product.stock_quantity,
            "status": product.status
        }
        for product in products
    ]