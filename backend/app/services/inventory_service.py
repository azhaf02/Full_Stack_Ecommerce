from collections import defaultdict
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
    else:
        query = query.filter(
            Inventory.variant_id.is_(None)
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
    else:
        query = query.filter(
            Inventory.variant_id.is_(None)
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
    variant_id: int | None = None,
    *,
    for_update: bool = False
):
    query = db.query(Inventory).filter(
        Inventory.product_id == product_id
    )

    if variant_id is not None:
        query = query.filter(
            Inventory.variant_id == variant_id
        )
    else:
        query = query.filter(
            Inventory.variant_id.is_(None)
        )

    if for_update:
        query = query.with_for_update()

    return query.first()


def _add_history(
    db: Session,
    inventory: Inventory,
    change_amount: int,
    changed_by: int,
    change_type: str,
    reason: str,
    order_id: int = None,
):
    previous_quantity = inventory.quantity
    new_quantity = previous_quantity + change_amount

    if new_quantity < 0:
        raise ValueError("Inventory quantity cannot become negative.")

    inventory.quantity = new_quantity

    history = InventoryHistory(
        inventory_id=inventory.id,
        product_id=inventory.product_id,
        order_id=order_id,
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

    Locks inventory rows, validates aggregated quantities, and then
    records deductions. Does not commit; the order service controls
    the transaction.
    """
    from app.services import order_service

    # Combine duplicate order lines for the same product and variant.
    totals = defaultdict(int)

    for item in order.items:
        key = (item.product_id, item.variant_id)
        totals[key] += item.quantity

    locked_inventory = {}

    # Lock rows in a consistent order to reduce deadlock risk.
    for product_id, variant_id in sorted(
        totals,
        key=lambda key: (
            key[0],
            key[1] is not None,
            key[1] or 0
        )
    ):
        requested_quantity = totals[(product_id, variant_id)]

        inventory = _get_inventory(
            db,
            product_id,
            variant_id,
            for_update=True
        )

        if inventory is None or inventory.quantity < requested_quantity:
            available = inventory.quantity if inventory else 0

            raise order_service.OutOfStock(
                f"Insufficient stock for product {product_id}. "
                f"Available quantity: {available}, "
                f"requested quantity: {requested_quantity}."
            )

        locked_inventory[(product_id, variant_id)] = inventory

    # All stock has been validated and locked. Now record deductions.
    for key, requested_quantity in totals.items():
        inventory = locked_inventory[key]

        _add_history(
            db=db,
            inventory=inventory,
            change_amount=-requested_quantity,
            changed_by=order.user_id,
            change_type="DEDUCTION",
            reason="order",
            order_id=order.id,
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
            order_id=order.id,
        )


def _has_order_deduction(db: Session, order_id: int) -> bool:
    """Return True only when this order has an actual stock deduction."""
    return (
        db.query(InventoryHistory.id)
        .filter(
            InventoryHistory.order_id == order_id,
            InventoryHistory.change_type == "DEDUCTION",
        )
        .first()
        is not None
    )


def on_order_status_change(db, order, previous_status, new_status):
    if new_status == "CONFIRMED":
        deduct_stock(db, order)

    elif new_status == "CANCELLED":
        if _has_order_deduction(db, order.id):
            restock(db, order, order.items, reason="cancel")

    elif new_status == "RETURNED":
        if order.returns and _has_order_deduction(db, order.id):
            returned_items = order.returns[-1].items
            restock(db, order, returned_items, reason="return")
