from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.product import Product
from app.schemas.product import ProductCreate, ProductResponse, ProductUpdate
from app.services import product_service

router = APIRouter(
    prefix="/api/products",
    tags=["Products"],
)


@router.post("/", response_model=ProductResponse)
def create_product(
    product: ProductCreate,
    db: Session = Depends(get_db),
):
    return product_service.create_product(db, product)


@router.get("/", response_model=list[ProductResponse])
def get_products(
    page: int = 1,
    page_size: int = 10,
    category_id: int | None = None,
    db: Session = Depends(get_db),
):
    return product_service.get_products(
        db,
        page=page,
        page_size=page_size,
        category_id=category_id,
    )

@router.get("/search")
def search_products(
    q: str = Query(..., min_length=1, max_length=100),
    db: Session = Depends(get_db),
):
    q = q.strip()

    if not q:
        raise HTTPException(
            status_code=422,
            detail="Search query cannot be empty",
        )

    search_term = f"%{q}%"

    products = (
        db.query(Product)
        .filter(
            or_(
                Product.name.ilike(search_term),
                Product.description.ilike(search_term),
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
            "status": product.status,
        }
        for product in products
    ]
@router.get("/{product_id}", response_model=ProductResponse)
def get_product(
    product_id: int,
    db: Session = Depends(get_db),
):
    product = product_service.get_product_detail(db, product_id)

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found",
        )

    return product


@router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    product: ProductUpdate,
    db: Session = Depends(get_db),
):
    updated = product_service.update_product(
        db,
        product_id,
        product,
    )

    if not updated:
        raise HTTPException(
            status_code=404,
            detail="Product not found",
        )

    return updated


@router.delete("/{product_id}", response_model=ProductResponse)
def deactivate_product(
    product_id: int,
    db: Session = Depends(get_db),
):
    product = product_service.deactivate_product(db, product_id)

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found",
        )

    return product
