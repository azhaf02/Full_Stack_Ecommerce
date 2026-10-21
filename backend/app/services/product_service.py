from sqlalchemy.orm import Session, joinedload

from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate
from app.services.inventory_service import get_inventory_stock_status


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

        stock_data = get_inventory_stock_status(
            db,
            product.id
        )

        result.append({
            "id": product.id,
            "category_id": product.category_id,
            "category_name": product.category.name if product.category else None,
            "name": product.name,
            "description": product.description,
            "price": product.price,
            "stock_quantity": product.stock_quantity,
            "stock_status": stock_data["stock_status"],
            "status": product.status,
            "image_url": image.image_url if image else None,
        })

    return result


def get_product_detail(db: Session, product_id: int):
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
        return None

    stock_data = get_inventory_stock_status(
        db,
        product.id
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
        "stock_status": stock_data["stock_status"],
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