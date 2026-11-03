"""AUTH-05 customer account tests: profile, password change, address CRUD.

Run from the backend folder:
    python -m pytest tests/test_account.py -v

Uses an in-memory SQLite database, so the shared Supabase DB is never touched.
"""
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import app.models  # noqa: F401  (registers all models)
from app.core.security import hash_password
from app.database import Base, get_db
from app.models.address import Address
from app.models.role import Role
from app.models.user import User
from app.routers import account, auth

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
test_app.include_router(account.router)
test_app.dependency_overrides[get_db] = override_get_db

client = TestClient(test_app)
PASSWORD = "secret123"

VALID_ADDRESS = {
    "full_name": "Madeeha Peerzade",
    "phone": "9876543210",
    "line1": "12 MG Road",
    "line2": "Near City Mall",
    "city": "Pune",
    "state": "Maharashtra",
    "postal_code": "411001",
    "country": "India",
    "address_type": "both",
}


# ---------- helpers ----------
def make_user(email: str, role: str = "customer") -> None:
    db = TestingSession()
    role_obj = db.query(Role).filter(Role.name == role).first() or Role(name=role)
    db.add(User(name="Test User", email=email, password_hash=hash_password(PASSWORD), role=role_obj, status="active"))
    db.commit()
    db.close()


def token_for(email: str, role: str = "customer") -> str:
    make_user(email, role)
    path = "/api/auth/admin/login" if role == "admin" else "/api/auth/login"
    res = client.post(path, json={"email": email, "password": PASSWORD})
    assert res.status_code == 200, res.text
    return res.json()["access_token"]


def bearer(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def add_address(token: str, **overrides) -> dict:
    res = client.post("/api/account/addresses", json={**VALID_ADDRESS, **overrides}, headers=bearer(token))
    assert res.status_code == 201, res.text
    return res.json()


# ---------- profile ----------
def test_view_profile_returns_name_and_email():
    token = token_for("view@example.com")
    res = client.get("/api/account/profile", headers=bearer(token))
    assert res.status_code == 200
    body = res.json()
    assert body["email"] == "view@example.com"
    assert body["name"] == "Test User"
    assert "password_hash" not in body


def test_update_name():
    token = token_for("rename@example.com")
    res = client.put("/api/account/profile", json={"name": "  Madeeha  "}, headers=bearer(token))
    assert res.status_code == 200
    assert res.json()["name"] == "Madeeha"
    assert client.get("/api/account/profile", headers=bearer(token)).json()["name"] == "Madeeha"


def test_update_name_too_short_returns_422():
    token = token_for("shortname@example.com")
    assert client.put("/api/account/profile", json={"name": "A"}, headers=bearer(token)).status_code == 422


# ---------- password ----------
def test_change_password_success_then_login_with_new_password():
    token = token_for("pwok@example.com")
    res = client.put(
        "/api/account/password",
        json={"current_password": PASSWORD, "new_password": "newpass456"},
        headers=bearer(token),
    )
    assert res.status_code == 200
    login_old = client.post("/api/auth/login", json={"email": "pwok@example.com", "password": PASSWORD})
    login_new = client.post("/api/auth/login", json={"email": "pwok@example.com", "password": "newpass456"})
    assert login_old.status_code == 401
    assert login_new.status_code == 200


def test_change_password_wrong_current_returns_400():
    token = token_for("pwwrong@example.com")
    res = client.put(
        "/api/account/password",
        json={"current_password": "notmypass1", "new_password": "newpass456"},
        headers=bearer(token),
    )
    assert res.status_code == 400
    assert res.json()["detail"] == "Current password is incorrect"


def test_change_password_same_as_current_returns_400():
    token = token_for("pwsame@example.com")
    res = client.put(
        "/api/account/password",
        json={"current_password": PASSWORD, "new_password": PASSWORD},
        headers=bearer(token),
    )
    assert res.status_code == 400


def test_change_password_weak_new_password_returns_422():
    token = token_for("pwweak@example.com")
    res = client.put(
        "/api/account/password",
        json={"current_password": PASSWORD, "new_password": "onlyletters"},
        headers=bearer(token),
    )
    assert res.status_code == 422


# ---------- addresses ----------
def test_first_address_becomes_default():
    token = token_for("addr1@example.com")
    first = add_address(token)
    assert first["is_default"] is True
    second = add_address(token, line1="45 FC Road")
    assert second["is_default"] is False


def test_list_addresses_shows_default_first():
    token = token_for("addrlist@example.com")
    add_address(token)
    second = add_address(token, line1="45 FC Road", is_default=True)
    res = client.get("/api/account/addresses", headers=bearer(token))
    assert res.status_code == 200
    items = res.json()
    assert len(items) == 2
    assert items[0]["id"] == second["id"]
    assert sum(1 for a in items if a["is_default"]) == 1


def test_edit_address_partial_update():
    token = token_for("addredit@example.com")
    created = add_address(token)
    res = client.put(f"/api/account/addresses/{created['id']}", json={"city": "Mumbai"}, headers=bearer(token))
    assert res.status_code == 200
    assert res.json()["city"] == "Mumbai"
    assert res.json()["line1"] == VALID_ADDRESS["line1"]


def test_set_default_address_switches_default():
    token = token_for("addrdefault@example.com")
    first = add_address(token)
    second = add_address(token, line1="45 FC Road")
    res = client.put(f"/api/account/addresses/{second['id']}/default", headers=bearer(token))
    assert res.status_code == 200
    assert res.json()["is_default"] is True
    old = client.get(f"/api/account/addresses/{first['id']}", headers=bearer(token)).json()
    assert old["is_default"] is False


def test_delete_default_address_promotes_another():
    token = token_for("addrdelete@example.com")
    first = add_address(token)
    second = add_address(token, line1="45 FC Road")
    res = client.delete(f"/api/account/addresses/{first['id']}", headers=bearer(token))
    assert res.status_code == 204
    remaining = client.get("/api/account/addresses", headers=bearer(token)).json()
    assert [a["id"] for a in remaining] == [second["id"]]
    assert remaining[0]["is_default"] is True


def test_cannot_access_another_customers_address():
    owner = token_for("owner@example.com")
    other = token_for("intruder@example.com")
    address_id = add_address(owner)["id"]
    assert client.get(f"/api/account/addresses/{address_id}", headers=bearer(other)).status_code == 404
    assert client.put(
        f"/api/account/addresses/{address_id}", json={"city": "Delhi"}, headers=bearer(other)
    ).status_code == 404
    assert client.delete(f"/api/account/addresses/{address_id}", headers=bearer(other)).status_code == 404
    # owner's address is unchanged
    assert client.get(f"/api/account/addresses/{address_id}", headers=bearer(owner)).json()["city"] == "Pune"


def test_invalid_address_returns_422():
    token = token_for("addrinvalid@example.com")
    bad_phone = {**VALID_ADDRESS, "phone": "abc"}
    bad_type = {**VALID_ADDRESS, "address_type": "home"}
    missing_city = {k: v for k, v in VALID_ADDRESS.items() if k != "city"}
    for payload in (bad_phone, bad_type, missing_city):
        res = client.post("/api/account/addresses", json=payload, headers=bearer(token))
        assert res.status_code == 422, payload


# ---------- access control ----------
def test_unauthenticated_requests_return_401():
    assert client.get("/api/account/profile").status_code == 401
    assert client.put("/api/account/profile", json={"name": "Someone"}).status_code == 401
    assert client.put(
        "/api/account/password", json={"current_password": "x", "new_password": "newpass456"}
    ).status_code == 401
    assert client.get("/api/account/addresses").status_code == 401
    assert client.post("/api/account/addresses", json=VALID_ADDRESS).status_code == 401


def test_admin_cannot_use_customer_address_endpoints():
    token = token_for("adminaddr@example.com", role="admin")
    assert client.get("/api/account/addresses", headers=bearer(token)).status_code == 403
