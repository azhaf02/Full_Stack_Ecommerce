from sqlalchemy.orm import Session
from app.models.inventory import Inventory
from app.models.inventory_history import InventoryHistory

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


def _get_inventory(
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

    return query.first()


def _add_history(
    db: Session,
    inventory: Inventory,
    change_amount: int,
    changed_by: int,
    change_type: str,
    reason: str
):
    previous_quantity = inventory.quantity
    new_quantity = previous_quantity + change_amount

    if new_quantity < 0:
        raise ValueError("Inventory quantity cannot become negative.")

    inventory.quantity = new_quantity

    history = InventoryHistory(
        inventory_id=inventory.id,
        product_id=inventory.product_id,
        change_amount=change_amount,
        changed_by=changed_by,
        change_type=change_type,
        quantity_changed=abs(change_amount),
        previous_quantity=previous_quantity,
        new_quantity=new_quantity,
        reason=reason,
        location=inventory.location,
    )

    db.add(history)


def deduct_stock(db: Session, order):
    """
    Deduct stock for all items in a confirmed order.

    Does not commit. The order service controls the transaction.
    Raises order_service.OutOfStock when stock is insufficient.
    """

    # Import locally to avoid circular imports.
    from app.services import order_service

    for item in order.items:
        inventory = _get_inventory(
            db,
            item.product_id,
            item.variant_id
        )

        if inventory is None or inventory.quantity < item.quantity:
            available = inventory.quantity if inventory else 0

            raise order_service.OutOfStock(
                f"Insufficient stock for product {item.product_id}. "
                f"Available quantity: {available}, "
                f"requested quantity: {item.quantity}."
            )

    # Validate everything first.
    # Only after all items have enough stock do we change quantities.
    for item in order.items:
        inventory = _get_inventory(
            db,
            item.product_id,
            item.variant_id
        )

        _add_history(
            db=db,
            inventory=inventory,
            change_amount=-item.quantity,
            changed_by=order.user_id,
            change_type="DEDUCTION",
            reason=f"order:{order.id}",
        )

def restock(db: Session, order, items, reason: str = "cancel"):
    """
    Restore stock for cancelled orders or returned items.

    `items` may contain OrderItem objects or ReturnItem objects.

    Does not commit. The order service controls the transaction.
    """

    for item in items:
        if hasattr(item, "order_item_id"):
            # ReturnItem
            original_item = next(
                (
                    order_item
                    for order_item in order.items
                    if order_item.id == item.order_item_id
                ),
                None
            )

            if original_item is None:
                continue

            product_id = original_item.product_id
            variant_id = original_item.variant_id
            quantity = item.quantity

        else:
            # OrderItem
            product_id = item.product_id
            variant_id = item.variant_id
            quantity = item.quantity

        inventory = _get_inventory(
            db,
            product_id,
            variant_id
        )

        if inventory is None:
            raise ValueError(
                f"Inventory not found for product {product_id}."
            )

        _add_history(
            db=db,
            inventory=inventory,
            change_amount=quantity,
            changed_by=order.user_id,
            change_type="RESTOCK",
            reason=reason,
        )

def on_order_status_change(db, order, previous_status, new_status):
    from app.services import order_service

    if new_status == "CONFIRMED":
        deduct_stock(db, order)

    elif new_status == "CANCELLED":
     if order_service.stock_was_deducted(order):
        restock(db, order, order.items, reason="cancel")

    elif new_status == "RETURNED":
     if order.returns:
        returned_items = order.returns[-1].items
        restock(db, order, returned_items, reason="return")


