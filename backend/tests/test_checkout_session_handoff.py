
from types import SimpleNamespace

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.api.routes import checkout as checkout_route
from app.database import Base, get_db
from app.models.checkout_session import CheckoutSession


@pytest.fixture()
def env(monkeypatch):
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)

    Session = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    user = SimpleNamespace(id=1, role=SimpleNamespace(name="customer"))

    reviewed_checkout = {
        "ready_for_payment": True,
        "summary": {
            "subtotal": 2000,
            "discount": 0,
            "shipping": 99,
            "total": 2099,
        },
    }

    monkeypatch.setattr(
        checkout_route,
        "checkout_review",
        lambda data, current_user, db: reviewed_checkout,
    )

    app = FastAPI()
    app.include_router(checkout_route.router)

    def override_db():
        db = Session()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_db
    app.dependency_overrides[checkout_route.customer_only] = lambda: user

    yield SimpleNamespace(client=TestClient(app), Session=Session)

    app.dependency_overrides.clear()
    engine.dispose()


def test_checkout_session_requires_login():
    app = FastAPI()
    app.include_router(checkout_route.router)
    client = TestClient(app)

    response = client.post(
        "/api/checkout/session",
        json={"address_id": 1, "shipping_method_id": 1},
    )

    assert response.status_code == 401


def test_checkout_session_persists_review_snapshot(env):
    response = env.client.post(
        "/api/checkout/session",
        json={"address_id": 1, "shipping_method_id": 1},
    )

    assert response.status_code == 201
    body = response.json()

    assert body["checkout_reference_id"]
    assert body["session_id"] == body["checkout_reference_id"]
    assert body["status"] == "active"
    assert body["checkout"]["summary"]["total"] == 2099

    db = env.Session()
    try:
        saved = db.query(CheckoutSession).filter_by(
            session_id=body["checkout_reference_id"]
        ).one()

        assert saved.customer_id == "1"
        assert saved.status == "active"
        assert saved.checkout_snapshot["summary"]["total"] == 2099
        assert saved.expires_at is not None
    finally:
        db.close()


def test_checkout_session_rejects_not_ready_checkout(env, monkeypatch):
    monkeypatch.setattr(
        checkout_route,
        "checkout_review",
        lambda data, current_user, db: {"ready_for_payment": False},
    )

    response = env.client.post(
        "/api/checkout/session",
        json={"address_id": 1, "shipping_method_id": 1},
    )

    assert response.status_code == 400
