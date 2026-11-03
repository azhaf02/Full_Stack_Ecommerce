import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base
from app.models.inventory import Inventory
from app.services.inventory_service import (
    validate_stock,
    InsufficientStockError,
    ensure_inventory_record,
)


@pytest.fixture()
def db():
    engine = create_engine("sqlite://")
    Base.metadata.create_all(engine, tables=[Inventory.__table__])
    session = sessionmaker(bind=engine)()

    yield session

    session.close()


def add_inventory(db, product_id, quantity, variant_id=None):
    inventory = Inventory(
        product_id=product_id,
        variant_id=variant_id,
        quantity=quantity,
        low_stock_threshold=2,
        status="IN_STOCK",
    )
    db.add(inventory)
    db.commit()
    return inventory


def test_quantity_within_stock_is_allowed(db):
    add_inventory(db, product_id=1, quantity=10)

    inventory = validate_stock(
        db,
        product_id=1,
        requested_quantity=5
    )

    assert inventory.quantity == 10


def test_quantity_equal_to_stock_is_allowed(db):
    add_inventory(db, product_id=2, quantity=10)

    inventory = validate_stock(
        db,
        product_id=2,
        requested_quantity=10
    )

    assert inventory.quantity == 10


def test_quantity_greater_than_stock_is_rejected(db):
    add_inventory(db, product_id=3, quantity=3)

    with pytest.raises(InsufficientStockError, match="Insufficient stock"):
        validate_stock(
            db,
            product_id=3,
            requested_quantity=5
        )


def test_zero_stock_is_rejected(db):
    add_inventory(db, product_id=4, quantity=0)

    with pytest.raises(InsufficientStockError, match="Insufficient stock"):
        validate_stock(
            db,
            product_id=4,
            requested_quantity=1
        )


def test_missing_inventory_is_rejected(db):
    with pytest.raises(InsufficientStockError, match="Insufficient stock"):
        validate_stock(
            db,
            product_id=999,
            requested_quantity=1
        )


def test_variant_stock_is_validated_separately(db):
    add_inventory(db, product_id=5, variant_id=1, quantity=5)
    add_inventory(db, product_id=5, variant_id=2, quantity=10)

    inventory = validate_stock(
        db,
        product_id=5,
        requested_quantity=8,
        variant_id=2
    )

    assert inventory.variant_id == 2
    assert inventory.quantity == 10


def test_stock_change_between_cart_and_checkout_is_rejected(db):
    add_inventory(db, product_id=6, quantity=10)

    # Cart stage: quantity 5 is available.
    validate_stock(
        db,
        product_id=6,
        requested_quantity=5
    )

    # Stock changes before checkout.
    inventory = db.query(Inventory).filter(
        Inventory.product_id == 6
    ).first()
    inventory.quantity = 3
    db.commit()

    # Checkout stage: the same quantity is now rejected.
    with pytest.raises(InsufficientStockError, match="Available quantity: 3"):
        validate_stock(
            db,
            product_id=6,
            requested_quantity=5
        )


def test_ensure_inventory_record_creates_missing_default_inventory(db):
    inventory = ensure_inventory_record(
        db,
        product_id=20,
        quantity=8,
    )
    db.commit()

    assert inventory.product_id == 20
    assert inventory.variant_id is None
    assert inventory.quantity == 8
    assert inventory.status == "LOW_STOCK"


def test_ensure_inventory_record_preserves_existing_quantity(db):
    existing = add_inventory(db, product_id=21, quantity=6)

    result = ensure_inventory_record(
        db,
        product_id=21,
        quantity=99,
    )

    assert result.id == existing.id
    assert result.quantity == 6
    assert db.query(Inventory).filter(
        Inventory.product_id == 21
    ).count() == 1


def test_ensure_inventory_record_creates_variant_inventory_separately(db):
    default_inventory = ensure_inventory_record(
        db,
        product_id=22,
        quantity=10,
    )
    variant_inventory = ensure_inventory_record(
        db,
        product_id=22,
        variant_id=5,
        quantity=4,
    )
    db.commit()

    assert default_inventory.variant_id is None
    assert default_inventory.quantity == 10
    assert variant_inventory.variant_id == 5
    assert variant_inventory.quantity == 4


def test_ensure_inventory_record_rejects_negative_quantity(db):
    with pytest.raises(ValueError, match="cannot be negative"):
        ensure_inventory_record(
            db,
            product_id=23,
            quantity=-1,
        )
