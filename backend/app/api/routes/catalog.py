from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from sqlalchemy.orm import Session
from app.core.security import require_role
from app.database.connection import get_db
from app.models.product import Product
from app.models.product_image import ProductImage
from app.schemas.product import ProductCreate, ProductResponse, ProductUpdate
from app.schemas.product_image import ProductImageResponse


router = APIRouter(
    prefix="/api/admin/products",
    tags=["Admin Products"],
    dependencies=[Depends(require_role("admin"))],
)


# Upload configuration
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_IMAGE_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}

MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB


@router.get("/", response_model=list[ProductResponse])
def get_admin_products(
    search: str | None = Query(default=None),
    category_id: int | None = Query(default=None),
    status: str | None = Query(default=None),
    db: Session = Depends(get_db),
):
    query = db.query(Product)

    if search:
        query = query.filter(Product.name.ilike(f"%{search}%"))

    if category_id is not None:
        query = query.filter(Product.category_id == category_id)

    if status:
        status = status.upper()

        if status not in {"ACTIVE", "INACTIVE"}:
            raise HTTPException(
                status_code=400,
                detail="Status must be ACTIVE or INACTIVE"
            )

        query = query.filter(Product.status == status)

    return query.order_by(Product.id.desc()).all()


@router.post("/", response_model=ProductResponse)
def create_admin_product(
    product: ProductCreate,
    db: Session = Depends(get_db),
):
    db_product = Product(**product.model_dump())

    db.add(db_product)
    db.commit()
    db.refresh(db_product)

    return db_product


@router.get("/{product_id}", response_model=ProductResponse)
def get_admin_product(
    product_id: int,
    db: Session = Depends(get_db),
):
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

    return product


@router.put("/{product_id}", response_model=ProductResponse)
def update_admin_product(
    product_id: int,
    product: ProductUpdate,
    db: Session = Depends(get_db),
):
    db_product = (
        db.query(Product)
        .filter(Product.id == product_id)
        .first()
    )

    if not db_product:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    update_data = product.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(db_product, field, value)

    db.commit()
    db.refresh(db_product)

    return db_product


@router.delete("/{product_id}", response_model=ProductResponse)
def deactivate_admin_product(
    product_id: int,
    db: Session = Depends(get_db),
):
    db_product = (
        db.query(Product)
        .filter(Product.id == product_id)
        .first()
    )

    if not db_product:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    # Soft delete/deactivation instead of physical deletion.
    db_product.status = "INACTIVE"

    db.commit()
    db.refresh(db_product)

    return db_product


@router.post(
    "/{product_id}/images",
    response_model=ProductImageResponse,
)
async def upload_product_image(
    product_id: int,
    file: UploadFile = File(...),
    is_primary: bool = False,
    db: Session = Depends(get_db),
):
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

    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Only JPG, PNG and WEBP images are allowed"
        )

    file_content = await file.read()

    if len(file_content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail="Image size must not exceed 5 MB"
        )

    extension = ALLOWED_IMAGE_TYPES[file.content_type]
    filename = f"{uuid4().hex}{extension}"
    file_path = UPLOAD_DIR / filename

    file_path.write_bytes(file_content)

    # If this image is primary, remove primary status
    # from all other images of this product.
    if is_primary:
        db.query(ProductImage).filter(
            ProductImage.product_id == product_id
        ).update(
            {"is_primary": False},
            synchronize_session=False,
        )

    image = ProductImage(
        product_id=product_id,
        image_url=f"/uploads/{filename}",
        is_primary=is_primary,
    )

    db.add(image)
    db.commit()
    db.refresh(image)

    return image