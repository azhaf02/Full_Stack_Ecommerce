from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.product import ProductCreate, ProductResponse, ProductUpdate
from app.services import product_service
from app.schemas.product_variant import ProductVariantResponse
from app.services import product_variant_service

router = APIRouter(
    prefix="/api/products",
    tags=["Products"]
)


@router.post("/", response_model=ProductResponse)
def create_product(
    product: ProductCreate,
    db: Session = Depends(get_db)
):
    return product_service.create_product(db, product)


@router.get("/", response_model=list[ProductResponse])
def get_products(
    db: Session = Depends(get_db)
):
    return product_service.get_products(db)

@router.get("/{product_id}/variants", response_model=list[ProductVariantResponse])
def get_product_variants(
    product_id: int,
    db: Session = Depends(get_db)
):
    product = product_service.get_product_detail(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    return product_variant_service.get_variants_by_product(db, product_id)


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(
    product_id: int,
    db: Session = Depends(get_db)
):
    product = product_service.get_product_detail(db, product_id)

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    return product


@router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    product: ProductUpdate,
    db: Session = Depends(get_db)
):
    updated = product_service.update_product(
        db,
        product_id,
        product
    )

    if not updated:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    return updated


@router.delete("/{product_id}", response_model=ProductResponse)
def deactivate_product(
    product_id: int,
    db: Session = Depends(get_db)
):
    product = product_service.deactivate_product(
        db,
        product_id
    )

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    return product

