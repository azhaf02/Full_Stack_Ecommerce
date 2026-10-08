from sqlalchemy.orm import Session

from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate


def create_product(db: Session, product: ProductCreate):
    db_product = Product(**product.model_dump())

    db.add(db_product)
    db.commit()
    db.refresh(db_product)

    return db_product


def get_products(
    db: Session,
    page: int = 1,
    page_size: int = 10,
    category_id: int | None = None,
):
    query = (
        db.query(Product)
        .filter(Product.status == "ACTIVE")
    )

    if category_id is not None:
        query = query.filter(Product.category_id == category_id)

    products = (
        query
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    result = []

    for product in products:
        image = product.images[0] if product.images else None

        result.append({
            "id": product.id,
            "category_id": product.category_id,
            "category_name": product.category.name if product.category else None,
            "name": product.name,
            "description": product.description,
            "price": product.price,
            "stock_quantity": product.stock_quantity,
            "stock_status": (
    "OUT_OF_STOCK" if product.stock_quantity <= 0 else "IN_STOCK"
),
            "status": product.status,
            "image_url": image.image_url if image else None,
        })

    return result

def get_product(db: Session, product_id: int):
    return (
        db.query(Product)
        .filter(Product.id == product_id)
        .first()
    )


def update_product(
    db: Session,
    product_id: int,
    product: ProductUpdate
):
    db_product = get_product(db, product_id)

    if not db_product:
        return None

    update_data = product.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(db_product, field, value)

    db.commit()
    db.refresh(db_product)

    return db_product


def deactivate_product(db: Session, product_id: int):
    db_product = get_product(db, product_id)

    if not db_product:
        return None

    db_product.status = "INACTIVE"

    db.commit()
    db.refresh(db_product)

    return db_product