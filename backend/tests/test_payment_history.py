
from decimal import Decimal
from types import SimpleNamespace

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.security import get_current_user
from app.database import Base, get_db
from app.models.order import Order
from app.models.payment import Payment, PaymentMethod, PaymentStatus
from app.routers import account as account_router
from app.routers import admin as admin_router


@pytest.fixture
def history_api():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    Base.metadata.create_all(engine)

    SessionLocal = sessionmaker(
        bind=engine,
        autoflush=False,
        autocommit=False,
    )

    db = SessionLocal()

    current_user = SimpleNamespace(
        id=1,
        role=SimpleNamespace(name="customer"),
    )

    app = FastAPI()
    app.include_router(account_router.router)
    app.include_router(admin_router.router)

    def override_db():
        yield db

    app.dependency_overrides[get_db] = override_db
    app.dependency_overrides[get_current_user] = lambda: current_user

    try:
        with TestClient(app) as client:
            yield SimpleNamespace(
                client=client,
                db=db,
                current_user=current_user,
            )
    finally:
        app.dependency_overrides.clear()
        db.close()
        Base.metadata.drop_all(engine)
        engine.dispose()


def add_history_record(db, order_number, user_id, status):
    order = Order(
        order_number=order_number,
        user_id=user_id,
        address_id=1,
        shipping_method_id=1,
        status="PLACED",
        payment_method="ONLINE",
        payment_status=status,
        subtotal=Decimal("100.00"),
        discount_amount=Decimal("0.00"),
        tax_amount=Decimal("0.00"),
        shipping_cost=Decimal("0.00"),
        total_amount=Decimal("100.00"),
    )

    db.add(order)
    db.flush()

    payment = Payment(
        order_id=order.id,
        method=PaymentMethod.ONLINE,
        status=PaymentStatus(status),
        amount=Decimal("100.00"),
    )

    db.add(payment)
    db.commit()
    db.refresh(payment)

    return payment


def test_customer_history_only_returns_own_payments(history_api):
    own_payment = add_history_record(
        history_api.db,
        "HISTORY-OWN",
        1,
        "SUCCESS",
    )

    add_history_record(
        history_api.db,
        "HISTORY-OTHER",
        2,
        "FAILED",
    )

    response = history_api.client.get("/api/account/payments")

    assert response.status_code == 200

    data = response.json()

    assert [item["payment_id"] for item in data] == [
        own_payment.id
    ]


def test_customer_cannot_access_admin_payment_history(history_api):
    response = history_api.client.get("/api/admin/payments")

    assert response.status_code == 403


def test_admin_can_view_all_payment_history(history_api):
    add_history_record(
        history_api.db,
        "HISTORY-ADMIN-1",
        1,
        "SUCCESS",
    )

    add_history_record(
        history_api.db,
        "HISTORY-ADMIN-2",
        2,
        "FAILED",
    )

    history_api.current_user.role.name = "admin"

    response = history_api.client.get("/api/admin/payments")

    assert response.status_code == 200
    assert len(response.json()) == 2


def test_admin_can_filter_payment_history_by_status(history_api):
    add_history_record(
        history_api.db,
        "HISTORY-FILTER-1",
        1,
        "SUCCESS",
    )

    add_history_record(
        history_api.db,
        "HISTORY-FILTER-2",
        2,
        "FAILED",
    )

    history_api.current_user.role.name = "admin"

    response = history_api.client.get(
        "/api/admin/payments",
        params={"status": "FAILED"},
    )

    assert response.status_code == 200

    data = response.json()

    assert len(data) == 1
    assert data[0]["status"] == "FAILED"


def test_admin_rejects_invalid_payment_status_filter(history_api):
    history_api.current_user.role.name = "admin"

    response = history_api.client.get(
        "/api/admin/payments",
        params={"status": "NOT_A_STATUS"},
    )

    assert response.status_code == 400
