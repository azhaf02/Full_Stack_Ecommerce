from decimal import Decimal

from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from types import SimpleNamespace

from app.database import Base, get_db
from app.models.invoice import Invoice
from app.models.order import Order
from app.models.order import OrderItem
from app.models.user import User
from app.core.security import get_current_user
from app.routers import invoice as invoice_router


def test_invoice_generated_for_own_order():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    db = Session()

    user = SimpleNamespace(
        id=1,
        name="Test Customer",
        email="customer@example.com",
        role=SimpleNamespace(name="customer"),
    )

    order = Order(
        order_number="TEST-INV-001",
        user_id=1,
        address_id=1,
        shipping_method_id=1,
        status="PLACED",
        payment_method="COD",
        payment_status="PENDING",
        subtotal=Decimal("1000.00"),
        discount_amount=Decimal("0.00"),
        tax_amount=Decimal("0.00"),
        shipping_cost=Decimal("50.00"),
        total_amount=Decimal("1050.00"),
    )
    db.add(order)
    db.commit()
    db.refresh(order)

    app = FastAPI()
    app.include_router(invoice_router.router)

    def override_db():
        yield db

    app.dependency_overrides[get_db] = override_db
    app.dependency_overrides[
        invoice_router.customer_only
    ] = lambda: user

    try:
        with TestClient(app) as client:
            response = client.get(
                f"/api/orders/{order.id}/invoice"
            )

        assert response.status_code == 200, response.text
        data = response.json()

        assert data["invoice_number"] == f"INV-{order.id:08d}"
        assert data["order_id"] == order.id
        assert data["customer_email"] == "customer@example.com"
        assert Decimal(str(data["total_amount"])) == Decimal("1050.00")

        invoice = db.query(Invoice).filter(
            Invoice.order_id == order.id
        ).first()
        assert invoice is not None
        assert invoice.invoice_number == data["invoice_number"]

    finally:
        db.close()
        Base.metadata.drop_all(engine)
        engine.dispose()
def test_customer_cannot_access_another_customers_order():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    db = Session()

    customer = SimpleNamespace(
        id=2,
        name="Another Customer",
        email="another@example.com",
        role=SimpleNamespace(name="customer"),
    )

    order = Order(
        order_number="TEST-INV-002",
        user_id=1,
        address_id=1,
        shipping_method_id=1,
        status="PLACED",
        payment_method="COD",
        payment_status="PENDING",
        subtotal=Decimal("500.00"),
        discount_amount=Decimal("0.00"),
        tax_amount=Decimal("0.00"),
        shipping_cost=Decimal("50.00"),
        total_amount=Decimal("550.00"),
    )
    db.add(order)
    db.commit()
    db.refresh(order)

    app = FastAPI()
    app.include_router(invoice_router.router)

    def override_db():
        yield db

    app.dependency_overrides[get_db] = override_db
    app.dependency_overrides[invoice_router.customer_only] = lambda: customer

    try:
        with TestClient(app) as client:
            response = client.get(f"/api/orders/{order.id}/invoice")

        assert response.status_code == 404, response.text
    finally:
        db.close()
        Base.metadata.drop_all(engine)
        engine.dispose()
def test_invoice_generated_for_successful_online_order():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    db = Session()

    customer = SimpleNamespace(
        id=1,
        name="Online Customer",
        email="online@example.com",
        role=SimpleNamespace(name="customer"),
    )

    order = Order(
        order_number="TEST-INV-003",
        user_id=1,
        address_id=1,
        shipping_method_id=1,
        status="PLACED",
        payment_method="ONLINE",
        payment_status="SUCCESS",
        subtotal=Decimal("1200.00"),
        discount_amount=Decimal("100.00"),
        tax_amount=Decimal("0.00"),
        shipping_cost=Decimal("50.00"),
        total_amount=Decimal("1150.00"),
    )
    db.add(order)
    db.commit()
    db.refresh(order)

    app = FastAPI()
    app.include_router(invoice_router.router)

    def override_db():
        yield db

    app.dependency_overrides[get_db] = override_db
    app.dependency_overrides[invoice_router.customer_only] = lambda: customer

    try:
        with TestClient(app) as client:
            response = client.get(f"/api/orders/{order.id}/invoice")

        assert response.status_code == 200, response.text
        data = response.json()

        assert data["payment_method"] == "ONLINE"
        assert data["payment_status"] == "SUCCESS"
        assert data["order_id"] == order.id
        assert data["invoice_number"] == f"INV-{order.id:08d}"
        assert Decimal(str(data["total_amount"])) == Decimal("1150.00")

        invoice = db.query(Invoice).filter(
            Invoice.order_id == order.id
        ).first()
        assert invoice is not None

    finally:
        db.close()
        Base.metadata.drop_all(engine)
        engine.dispose()