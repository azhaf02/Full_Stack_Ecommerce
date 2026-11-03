from decimal import Decimal
from types import SimpleNamespace

import pytest
from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base
from app.models.cart import Cart, CartItem
from app.models.inventory import Inventory
from app.models.product import Product
from app.models.product_variant import ProductVariant
from app.routers.cart import (
    AddCartItemRequest,
    UpdateCartItemRequest,
    add_to_cart,
    update_cart_item,
)


TABLES = [
    Product.__table__,
    ProductVariant.__table__,
    Inventory.__table__,
    Cart.__table__,
    CartItem.__table__,
]


@pytest.fixture()
def db():
    engine = create_engine("sqlite://")
    Base.metadata.create_all(engine, tables=TABLES)
    session = sessionmaker(bind=engine)()

    yield session

    session.close()
    engine.dispose()


@pytest.fixture()
def user():
    return SimpleNamespace(id=1)


def make_product(db, stock_quantity=10):
    product = Product(
        category_id=1,
        name="Wireless Mouse",
        description="Test product",
        price=Decimal("500.00"),
        stock_quantity=stock_quantity,
        status="ACTIVE",
    )
    db.add(product)
    db.flush()
    return product


def add_inventory(db, product_id, quantity, variant_id=None):
    inventory = Inventory(
        product_id=product_id,
        variant_id=variant_id,
        quantity=quantity,
        low_stock_threshold=2,
        status="IN_STOCK",
    )
    db.add(inventory)
    db.flush()
    return inventory


def test_add_to_cart_uses_inventory_quantity(db, user):
    product = make_product(db, stock_quantity=0)
    add_inventory(db, product.id, quantity=5)
    db.commit()

    result = add_to_cart(
        AddCartItemRequest(product_id=product.id, quantity=2),
        db,
        user,
    )

    assert result["quantity"] == 2
    assert result["product_id"] == product.id


def test_add_to_cart_rejects_missing_inventory(db, user):
    product = make_product(db, stock_quantity=10)
    db.commit()

    with pytest.raises(HTTPException) as exc:
        add_to_cart(
            AddCartItemRequest(product_id=product.id, quantity=1),
            db,
            user,
        )

    assert exc.value.status_code == 400
    assert "Available quantity: 0" in exc.value.detail


def test_add_variant_to_cart_uses_inventory_quantity(db, user):
    product = make_product(db, stock_quantity=0)

    variant = ProductVariant(
        product_id=product.id,
        attribute_name="Color",
        attribute_value="Black",
        price_delta=Decimal("50.00"),
        stock=0,
    )
    db.add(variant)
    db.flush()

    add_inventory(db, product.id, quantity=4, variant_id=variant.id)
    db.commit()

    result = add_to_cart(
        AddCartItemRequest(
            product_id=product.id,
            variant_id=variant.id,
            quantity=2,
        ),
        db,
        user,
    )

    assert result["quantity"] == 2
    assert result["variant_id"] == variant.id


def test_update_cart_uses_inventory_quantity(db, user):
    product = make_product(db, stock_quantity=0)
    inventory = add_inventory(db, product.id, quantity=5)

    cart = Cart(user_id=user.id)
    db.add(cart)
    db.flush()

    item = CartItem(
        cart_id=cart.id,
        product_id=product.id,
        variant_id=None,
        quantity=1,
        unit_price=Decimal("500.00"),
    )
    db.add(item)
    db.commit()

    update_cart_item(
        item.id,
        UpdateCartItemRequest(quantity=3),
        db,
        user,
    )

    db.refresh(item)
    assert item.quantity == 3
    assert inventory.quantity == 5


def test_update_cart_rejects_quantity_above_inventory(db, user):
    product = make_product(db, stock_quantity=10)
    add_inventory(db, product.id, quantity=2)

    cart = Cart(user_id=user.id)
    db.add(cart)
    db.flush()

    item = CartItem(
        cart_id=cart.id,
        product_id=product.id,
        variant_id=None,
        quantity=1,
        unit_price=Decimal("500.00"),
    )
    db.add(item)
    db.commit()

    with pytest.raises(HTTPException) as exc:
        update_cart_item(
            item.id,
            UpdateCartItemRequest(quantity=3),
            db,
            user,
        )

    assert exc.value.status_code == 400
    assert "Available quantity: 2" in exc.value.detail
    db.refresh(item)
    assert item.quantity == 1
