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
)
from app.services import order_service
from app.services.inventory_service import on_order_status_change


ORDER_TABLES = [
    Order.__table__,
    OrderItem.__table__,
    OrderStatusHistory.__table__,
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
    assert history.reason == "order:1"


def test_confirmed_order_with_insufficient_stock_fails(db):
    inventory = add_inventory(db, 3)
    order = make_order(db)

    with pytest.raises(order_service.OutOfStock):
        order_service.update_status(
            db,
            order,
            "CONFIRMED",
            changed_by=1
        )

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