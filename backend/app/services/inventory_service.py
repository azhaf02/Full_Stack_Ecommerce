from sqlalchemy.orm import Session
from app.models.inventory import Inventory


def get_stock_status(quantity: int, low_stock_threshold: int) -> str:
    if quantity <= 0:
        return "out_of_stock"

    if quantity <= low_stock_threshold:
        return "low_stock"

    return "in_stock"


def get_inventory_stock_status(
    db: Session,
    product_id: int,
    variant_id: int | None = None
):
    query = db.query(Inventory).filter(
        Inventory.product_id == product_id
    )

    if variant_id is not None:
        query = query.filter(
            Inventory.variant_id == variant_id
        )

    inventory = query.first()

    if inventory is None:
        return {
            "stock_status": "out_of_stock",
            "quantity": 0,
            "low_stock_threshold": 0
        }

    stock_status = get_stock_status(
        inventory.quantity,
        inventory.low_stock_threshold
    )

    return {
        "stock_status": stock_status,
        "quantity": inventory.quantity,
        "low_stock_threshold": inventory.low_stock_threshold
    }
