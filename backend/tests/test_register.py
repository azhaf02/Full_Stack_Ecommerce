"""AUTH-03 registration tests (positive + negative).

Run from the backend folder:
    python -m pip install pytest httpx
    python -m pytest tests/test_register.py -v

Uses an in-memory SQLite database, so the shared Supabase DB is never touched.
"""
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import app.models  # noqa: F401  (registers all models)
from app.database import Base, get_db
from app.models.address import Address
from app.models.role import Role
from app.models.user import User
from app.routers import auth

engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
TestingSession = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base.metadata.create_all(engine, tables=[Role.__table__, User.__table__, Address.__table__])


def override_get_db():
    db = TestingSession()
    try:
        yield db
    finally:
        db.close()


test_app = FastAPI()
test_app.include_router(auth.router)
test_app.dependency_overrides[get_db] = override_get_db
client = TestClient(test_app)

VALID = {"name": "Test Customer", "email": "customer@example.com", "password": "secret123"}


def register(**overrides):
    return client.post("/api/auth/register", json={**VALID, **overrides})


# ---------- positive ----------
def test_register_success_creates_customer():
    res = register(email="new1@example.com")
    assert res.status_code == 201
    body = res.json()
    assert body["email"] == "new1@example.com"
    assert body["role"] == "customer"
    assert body["status"] == "active"
    assert "password" not in body and "password_hash" not in body


def test_password_is_hashed_not_plaintext():
    register(email="hash@example.com", password="mypass123")
    db = TestingSession()
    user = db.query(User).filter(User.email == "hash@example.com").one()
    db.close()
    assert user.password_hash != "mypass123"
    assert user.password_hash.startswith("$2")  # bcrypt hash


def test_registered_user_can_log_in():
    register(email="login@example.com", password="login1234")
    res = client.post("/api/auth/login", json={"email": "login@example.com", "password": "login1234"})
    assert res.status_code == 200
    assert res.json()["access_token"]


# ---------- negative ----------
def test_duplicate_email_returns_409():
    register(email="dup@example.com")
    res = register(email="dup@example.com")
    assert res.status_code == 409
    assert res.json()["detail"] == "Email already registered"


def test_duplicate_email_is_case_insensitive():
    register(email="case@example.com")
    assert register(email="CASE@Example.com").status_code == 409


def test_invalid_email_returns_422():
    assert register(email="not-an-email").status_code == 422


def test_short_password_returns_422():
    assert register(email="short@example.com", password="ab1").status_code == 422


def test_password_without_number_returns_422():
    assert register(email="nonum@example.com", password="onlyletters").status_code == 422


def test_missing_name_returns_422():
    res = client.post("/api/auth/register", json={"email": "noname@example.com", "password": "secret123"})
    assert res.status_code == 422


def test_short_name_returns_422():
    assert register(email="shortname@example.com", name="A").status_code == 422
