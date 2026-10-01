from sqlalchemy.orm import Session

from app.models.product_variant import ProductVariant
from app.schemas.product_variant import ProductVariantCreate


def create_variant(db: Session, variant: ProductVariantCreate):
    db_variant = ProductVariant(**variant.model_dump())

    db.add(db_variant)
    db.commit()
    db.refresh(db_variant)

    return db_variant


def get_variants_by_product(db: Session, product_id: int):
    return (
        db.query(ProductVariant)
        .filter(ProductVariant.product_id == product_id)
        .all()
    )


def get_variant(db: Session, variant_id: int):
    return (
        db.query(ProductVariant)
        .filter(ProductVariant.id == variant_id)
        .first()
    )


def delete_variant(db: Session, variant_id: int):
    variant = get_variant(db, variant_id)

    if not variant:
        return None

    db.delete(variant)
    db.commit()

    return variant