from fastapi import APIRouter, Depends, HTTPException
<<<<<<< HEAD
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.product import ProductCreate, ProductResponse, ProductUpdate
from app.services import product_service

=======
from sqlalchemy.orm import Session, joinedload

from app.database.connection import get_db
from app.models.product import Product
>>>>>>> b0e1ca3 (feat: add product details page and API)

router = APIRouter(
    prefix="/api/products",
    tags=["Products"]
)


<<<<<<< HEAD
@router.post("/", response_model=ProductResponse)
def create_product(
    product: ProductCreate,
    db: Session = Depends(get_db)
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
=======
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
>>>>>>> b0e1ca3 (feat: add product details page and API)
    )

    if not product:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

<<<<<<< HEAD
    return product
=======
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
>>>>>>> b0e1ca3 (feat: add product details page and API)
