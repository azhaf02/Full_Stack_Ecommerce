
from sqlalchemy.orm import Session

from app.models.inventory import Inventory
from app.models.product_variant import ProductVariant
from app.schemas.product_variant import ProductVariantCreate


def create_variant(db: Session, variant: ProductVariantCreate):
    db_variant = ProductVariant(**variant.model_dump())

    db.add(db_variant)
    db.commit()
    db.refresh(db_variant)

    return db_variant


def get_variants_by_product(db: Session, product_id: int):
    variants = (
        db.query(ProductVariant)
        .filter(ProductVariant.product_id == product_id)
        .all()
    )

    results = []

    for variant in variants:
        inventory = (
            db.query(Inventory)
            .filter(
                Inventory.product_id == product_id,
                Inventory.variant_id == variant.id,
            )
            .first()
        )

        results.append({
            "id": variant.id,
            "product_id": variant.product_id,
            "attribute_name": variant.attribute_name,
            "attribute_value": variant.attribute_value,
            "price_delta": variant.price_delta,
            "stock": inventory.quantity if inventory else 0,
        })

    return results


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
