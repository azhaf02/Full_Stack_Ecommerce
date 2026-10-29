from sqlalchemy.orm import Session

from app.models.inventory import Inventory
from app.models.product_variant import ProductVariant


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
