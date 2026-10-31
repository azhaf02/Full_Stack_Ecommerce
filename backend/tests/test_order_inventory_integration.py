from decimal import Decimal

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base
from app.models.inventory import Inventory
from app.models.inventory_history import InventoryHistory

from app.models.order import (
    Order,
    OrderItem,
    OrderStatusHistory,
    Return,
    ReturnItem,
)

from app.services import order_service
from app.services.inventory_service import on_order_status_change


ORDER_TABLES = [
    Order.__table__,
    OrderItem.__table__,
    OrderStatusHistory.__table__,
    Return.__table__,
    ReturnItem.__table__,
]

INVENTORY_TABLES = [
    Inventory.__table__,
    InventoryHistory.__table__,
]


@pytest.fixture()
def db():
    engine = create_engine("sqlite://")

    Base.metadata.create_all(
        engine,
        tables=ORDER_TABLES + INVENTORY_TABLES
    )

    session = sessionmaker(bind=engine)()

    order_service.clear_status_hooks()
    order_service.register_status_hook(on_order_status_change)

    yield session

    order_service.clear_status_hooks()
    session.close()
    engine.dispose()


def make_order(db, status="PLACED"):
    order = Order(
        order_number="ORD-INV-TEST",
        user_id=1,
        address_id=1,
        shipping_method_id=1,
        payment_method="COD",
        payment_status="PENDING",
        status=status,
        subtotal=Decimal("100"),
        total_amount=Decimal("100"),
    )

    db.add(order)
    db.flush()

    item = OrderItem(
        order_id=order.id,
        product_id=1,
        variant_id=None,
        quantity=5,
        unit_price=Decimal("20"),
    )

    db.add(item)
    db.flush()

    return order


def add_inventory(db, quantity):
    inventory = Inventory(
        product_id=1,
        variant_id=None,
        quantity=quantity,
        low_stock_threshold=2,
        status="IN_STOCK",
    )

    db.add(inventory)
    db.commit()

    return inventory


def test_confirmed_order_deducts_stock_and_creates_history(db):
    inventory = add_inventory(db, 10)
    order = make_order(db)

    order_service.update_status(
        db,
        order,
        "CONFIRMED",
        changed_by=1
    )

    assert inventory.quantity == 5

    history = db.query(InventoryHistory).one()

    assert history.change_amount == -5
    assert history.previous_quantity == 10
    assert history.new_quantity == 5
    assert history.change_type == "DEDUCTION"
    assert history.reason == "order"
    assert history.order_id == order.id

def test_confirmed_order_with_insufficient_stock_fails(db):
    inventory = add_inventory(db, 3)
    order = make_order(db)
    db.commit()

    with pytest.raises(order_service.OutOfStock):
        order_service.update_status(
            db,
            order,
            "CONFIRMED",
            changed_by=1
        )

    db.rollback()
    db.refresh(inventory)
    db.refresh(order)

    assert inventory.quantity == 3
    assert order.status == "PLACED"
    assert db.query(InventoryHistory).count() == 0


def test_cancelled_confirmed_order_restores_stock(db):
    inventory = add_inventory(db, 10)
    order = make_order(db)

    order_service.update_status(
        db,
        order,
        "CONFIRMED",
        changed_by=1
    )

    db.commit()

    order_service.update_status(
        db,
        order,
        "CANCELLED",
        changed_by=1
    )

    assert inventory.quantity == 10

    histories = (
        db.query(InventoryHistory)
        .order_by(InventoryHistory.id)
        .all()
    )

    assert len(histories) == 2
    assert histories[1].change_amount == 5
    assert histories[1].new_quantity == 10
    assert histories[1].reason == "cancel"

def test_legacy_confirmed_order_without_deduction_does_not_restock(db):
    inventory = add_inventory(db, 5)
    order = make_order(db, status="CONFIRMED")

    # This order was confirmed historically, but stock was never deducted.
    db.add(
        OrderStatusHistory(
            order_id=order.id,
            previous_status="PLACED",
            new_status="CONFIRMED",
            changed_by=1,
            remarks="Legacy order without inventory deduction",
        )
    )
    db.commit()

    order_service.update_status(
        db,
        order,
        "CANCELLED",
        changed_by=1,
    )

    # Cancelling must not increase stock because no deduction occurred.
    assert inventory.quantity == 5
    assert db.query(InventoryHistory).count() == 0


def test_confirmed_order_can_consume_last_available_stock(db):
    inventory = add_inventory(db, 5)
    order = make_order(db)

    order_service.update_status(
        db,
        order,
        "CONFIRMED",
        changed_by=1
    )

    assert inventory.quantity == 0

    history = db.query(InventoryHistory).one()
    assert history.change_amount == -5
    assert history.previous_quantity == 5
    assert history.new_quantity == 0
    assert history.reason == "order"
    assert history.order_id == order.id

def test_confirming_order_twice_does_not_deduct_stock_twice(db):
    inventory = add_inventory(db, 10)
    order = make_order(db)

    order_service.update_status(
        db, order, "CONFIRMED", changed_by=1
    )

    assert inventory.quantity == 5

    with pytest.raises(order_service.InvalidTransition):
        order_service.update_status(
            db, order, "CONFIRMED", changed_by=1
        )

    assert inventory.quantity == 5
    assert db.query(InventoryHistory).count() == 1

def test_multi_item_confirmation_with_insufficient_stock_changes_nothing(db):
    # First line has sufficient stock; the second line does not.
    first_inventory = add_inventory(db, 10)
    second_inventory = Inventory(
        product_id=2,
        variant_id=None,
        quantity=3,
        low_stock_threshold=2,
        status="IN_STOCK",
    )
    db.add(second_inventory)
    db.commit()

    order = make_order(db)  # Product 1, quantity 5.
    db.add(
        OrderItem(
            order_id=order.id,
            product_id=2,
            variant_id=None,
            quantity=4,
            unit_price=Decimal("10"),
        )
    )
    db.commit()

    with pytest.raises(order_service.OutOfStock):
        order_service.update_status(
            db,
            order,
            "CONFIRMED",
            changed_by=1,
        )

    db.rollback()
    db.refresh(first_inventory)
    db.refresh(second_inventory)
    db.refresh(order)


    assert first_inventory.quantity == 10
    assert second_inventory.quantity == 3
    assert order.status == "PLACED"
    assert db.query(InventoryHistory).count() == 0

def test_duplicate_order_lines_check_combined_stock_quantity(db):
    inventory = add_inventory(db, 5)
    order = make_order(db)  # First line requests 5 items.

    # Add another line for the same product and variant.
    db.add(
        OrderItem(
            order_id=order.id,
            product_id=1,
            variant_id=None,
            quantity=1,
            unit_price=Decimal("20"),
        )
    )
    db.commit()

    # Combined requested quantity is 6, but only 5 are available.
    with pytest.raises(order_service.OutOfStock):
        order_service.update_status(
            db,
            order,
            "CONFIRMED",
            changed_by=1,
        )

    db.rollback()
    db.refresh(inventory)
    db.refresh(order)

    assert inventory.quantity == 5
    assert order.status == "PLACED"
    assert db.query(InventoryHistory).count() == 0

def test_returned_order_restores_stock_and_creates_history(db):
    inventory = add_inventory(db, 5)
    order = make_order(db, status="RETURN_APPROVED")

    # Simulate stock already deducted when the order was confirmed.
    inventory.quantity = 0

    db.add(
        InventoryHistory(
            inventory_id=inventory.id,
            product_id=inventory.product_id,
            order_id=order.id,
            change_amount=-5,
            changed_by=1,
            change_type="DEDUCTION",
            quantity_changed=5,
            previous_quantity=5,
            new_quantity=0,
            reason="order",
            location=inventory.location,
        )
    )
    db.flush()

    order_item = order.items[0]

    return_request = Return(
        order_id=order.id,
        user_id=1,
        reason="Test return",
        status="APPROVED",
    )
    db.add(return_request)
    db.flush()

    returned_item = ReturnItem(
        return_id=return_request.id,
        order_item_id=order_item.id,
        quantity=5,
    )
    db.add(returned_item)
    db.commit()

    order_service.update_status(
        db,
        order,
        "RETURNED",
        changed_by=1,
    )

    assert inventory.quantity == 5

    history = (
        db.query(InventoryHistory)
        .filter(InventoryHistory.reason == "return")
        .one()
    )
    assert history.change_type == "RESTOCK"
    assert history.change_amount == 5
    assert history.previous_quantity == 0
    assert history.new_quantity == 5

def test_returned_item_restocks_only_returned_quantity(db):
    from datetime import datetime, timedelta

    from app.services import return_service

    inventory = add_inventory(db, 10)
    order = make_order(db)
    order.items[0].quantity = 5
    db.flush()

    order_service.update_status(db, order, "CONFIRMED", changed_by=1)
    db.commit()
    assert inventory.quantity == 5

    delivered_time = datetime.utcnow()
    order_service.update_status(db, order, "PROCESSING", changed_by=1)
    order_service.update_status(db, order, "PACKED", changed_by=1)
    order_service.update_status(db, order, "SHIPPED", changed_by=1)
    order_service.update_status(db, order, "OUT_FOR_DELIVERY", changed_by=1)
    order_service.update_status(db, order, "DELIVERED", changed_by=1)
    db.flush()
    order.status_history[-1].changed_at = delivered_time
    db.flush()

    ret = return_service.request_return(
        db,
        order,
        user_id=order.user_id,
        reason="Inventory restock integration test",
        items=[(order.items[0].id, 2)],
        now=delivered_time + timedelta(hours=1),
    )
    return_service.review_return(db, ret, admin_id=1, approve=True)
    return_service.mark_returned(db, ret, admin_id=1)
    db.commit()

    db.refresh(inventory)
    histories = db.query(InventoryHistory).order_by(InventoryHistory.id).all()

    assert inventory.quantity == 7
    assert len(histories) == 2
    assert histories[0].change_amount == -5
    assert histories[1].change_amount == 2
    assert histories[1].change_type == "RESTOCK"
    assert histories[1].reason == "return"
