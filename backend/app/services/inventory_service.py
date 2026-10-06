from sqlalchemy.orm import Session
from app.models.inventory import Inventory


class InsufficientStockError(Exception):
    """Raised when requested quantity is greater than available stock."""
    pass


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


def validate_stock(
    db: Session,
    product_id: int,
    requested_quantity: int,
    variant_id: int | None = None
):
    """
    Validate whether the requested quantity is available.

    Parameters:
        db: SQLAlchemy database session
        product_id: Product being purchased
        requested_quantity: Quantity customer wants to purchase
        variant_id: Optional product variant

    Returns:
        Inventory object when sufficient stock is available.

    Raises:
        ValueError: If requested quantity is invalid.
        InsufficientStockError: If stock is unavailable or insufficient.
    """

    if requested_quantity <= 0:
        raise ValueError("Requested quantity must be greater than 0.")

    query = db.query(Inventory).filter(
        Inventory.product_id == product_id
    )

    if variant_id is not None:
        query = query.filter(
            Inventory.variant_id == variant_id
        )

    inventory = query.first()

    if inventory is None:
        raise InsufficientStockError(
            f"Insufficient stock for product {product_id}. "
            f"Available quantity: 0, requested quantity: {requested_quantity}."
        )

    if inventory.quantity < requested_quantity:
        raise InsufficientStockError(
            f"Insufficient stock for product {product_id}. "
            f"Available quantity: {inventory.quantity}, "
            f"requested quantity: {requested_quantity}."
        )

    return inventory

