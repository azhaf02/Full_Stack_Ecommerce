from datetime import datetime, timedelta, timezone
from types import SimpleNamespace
from uuid import uuid4

from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.models.checkout_session import CheckoutSession
from app.routers import checkout_sessions as session_routes


def make_env():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine, autoflush=False, autocommit=False)

    app = FastAPI()
    app.include_router(session_routes.router)

    def override_db():
        db = Session()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_db

    return app, Session, engine


def customer(user_id):
    return SimpleNamespace(
        id=user_id,
        role=SimpleNamespace(name="customer"),
    )


def test_legacy_create_session_requires_login():
    app, _, engine = make_env()
    try:
        response = TestClient(app).post(
            "/api/checkout/sessions",
            json={},
        )
        assert response.status_code == 401
    finally:
        app.dependency_overrides.clear()
        engine.dispose()


def test_legacy_get_session_requires_login():
    app, _, engine = make_env()
    try:
        response = TestClient(app).get(
            f"/api/checkout/sessions/{uuid4()}",
        )
        assert response.status_code == 401
    finally:
        app.dependency_overrides.clear()
        engine.dispose()


def test_legacy_create_session_uses_authenticated_customer():
    app, Session, engine = make_env()
    app.dependency_overrides[session_routes.customer_only] = lambda: customer(1)

    try:
        # A client-supplied customer_id must not be accepted.
        response = TestClient(app).post(
            "/api/checkout/sessions",
            json={"customer_id": "999"},
        )
        assert response.status_code == 422

        # Session ownership is derived from the authenticated customer.
        response = TestClient(app).post(
            "/api/checkout/sessions",
            json={},
        )
        assert response.status_code == 201
        assert response.json()["customer_id"] == "1"

        db = Session()
        try:
            saved = db.query(CheckoutSession).filter_by(
                session_id=response.json()["session_id"]
            ).one()
            assert saved.customer_id == "1"
        finally:
            db.close()
    finally:
        app.dependency_overrides.clear()
        engine.dispose()


def test_legacy_customer_cannot_read_another_customers_session():
    app, Session, engine = make_env()
    app.dependency_overrides[session_routes.customer_only] = lambda: customer(2)

    try:
        session_id = str(uuid4())
        db = Session()
        try:
            db.add(
                CheckoutSession(
                    session_id=session_id,
                    customer_id="1",
                    status="active",
                    expires_at=datetime.now(timezone.utc) + timedelta(hours=1),
                )
            )
            db.commit()
        finally:
            db.close()

        response = TestClient(app).get(
            f"/api/checkout/sessions/{session_id}",
        )
        assert response.status_code == 404
    finally:
        app.dependency_overrides.clear()
        engine.dispose()
