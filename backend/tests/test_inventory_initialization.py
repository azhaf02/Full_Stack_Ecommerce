from decimal import Decimal

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base
from app.models.category import Category
from app.models.inventory import Inventory
from app.models.product import Product
from app.models.product_variant import ProductVariant
from app.schemas.product import ProductCreate
from app.schemas.product_variant import ProductVariantCreate
from app.services.product_service import create_product
from app.services.product_variant_service import create_variant


TABLES = [
    Category.__table__,
    Product.__table__,
    ProductVariant.__table__,
    Inventory.__table__,
]


@pytest.fixture()
def db():
    engine = create_engine("sqlite://")
    Base.metadata.create_all(engine, tables=TABLES)
    session = sessionmaker(bind=engine)()

    yield session

    session.close()
    engine.dispose()


def make_category(db):
    category = Category(name="Test Electronics")
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


def test_create_product_initializes_inventory(db):
    category = make_category(db)

    product = create_product(
        db,
        ProductCreate(
            category_id=category.id,
            name="Test Wireless Mouse",
            description="Inventory initialization test",
            price=Decimal("500.00"),
            stock_quantity=12,
            status="ACTIVE",
        ),
    )

    inventory = db.query(Inventory).filter(
        Inventory.product_id == product.id,
        Inventory.variant_id.is_(None),
    ).one()

    assert inventory.quantity == 12
    assert inventory.status == "IN_STOCK"


def test_create_variant_initializes_separate_inventory(db):
    category = make_category(db)

    product = create_product(
        db,
        ProductCreate(
            category_id=category.id,
            name="Test Keyboard",
            price=Decimal("1000.00"),
            stock_quantity=20,
        ),
    )

    variant = create_variant(
        db,
        ProductVariantCreate(
            product_id=product.id,
            attribute_name="Color",
            attribute_value="Black",
            price_delta=Decimal("50.00"),
            stock=4,
        ),
    )

    inventory = db.query(Inventory).filter(
        Inventory.product_id == product.id,
        Inventory.variant_id == variant.id,
    ).one()

    assert inventory.quantity == 4
    assert inventory.status == "LOW_STOCK"

    default_inventory = db.query(Inventory).filter(
        Inventory.product_id == product.id,
        Inventory.variant_id.is_(None),
    ).one()

    assert default_inventory.quantity == 20
