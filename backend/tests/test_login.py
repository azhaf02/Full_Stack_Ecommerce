"""AUTH-04 login / logout / JWT tests (positive + negative).
 
Run from the backend folder:
    python -m pytest tests/test_login.py -v
 
Uses an in-memory SQLite database, so the shared Supabase DB is never touched.
"""
import jwt
from fastapi import Depends, FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
 
import app.models  # noqa: F401  (registers all models)
from app.core.security import ALGORITHM, SECRET_KEY, get_current_user, hash_password, require_role
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
 
 
# Example protected routes, the way other modules use the shared dependencies
@test_app.get("/protected/customer")
def customer_route(user: User = Depends(require_role("customer"))):
    return {"ok": True, "user_id": user.id}
 
 
@test_app.get("/protected/any")
def any_route(user: User = Depends(get_current_user)):
    return {"ok": True, "email": user.email}
 
 
client = TestClient(test_app)
PASSWORD = "secret123"
 
 
def make_user(email: str, role: str = "customer", status: str = "active") -> None:
    db = TestingSession()
    role_obj = db.query(Role).filter(Role.name == role).first() or Role(name=role)
    db.add(User(name="Test User", email=email, password_hash=hash_password(PASSWORD), role=role_obj, status=status))
    db.commit()
    db.close()
 
 
def login(email: str, password: str = PASSWORD, admin: bool = False):
    path = "/api/auth/admin/login" if admin else "/api/auth/login"
    return client.post(path, json={"email": email, "password": password})
 
 
def bearer(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}
 
 
# ---------- positive ----------
def test_login_success_returns_jwt_and_user():
    make_user("ok@example.com")
    res = login("ok@example.com")
    assert res.status_code == 200
    body = res.json()
    assert body["token_type"] == "bearer"
    assert body["user"]["email"] == "ok@example.com"
    assert body["user"]["role"] == "customer"
    assert "password_hash" not in body["user"]
 
 
def test_jwt_contains_user_id_role_and_expiry():
    make_user("claims@example.com")
    body = login("claims@example.com").json()
    payload = jwt.decode(body["access_token"], SECRET_KEY, algorithms=[ALGORITHM])
    assert payload["sub"] == str(body["user"]["id"])
    assert payload["role"] == "customer"
    assert "exp" in payload
 
 
def test_login_email_is_case_insensitive():
    make_user("mixed@example.com")
    assert login("MIXED@Example.com").status_code == 200
 
 
def test_me_works_with_valid_token():
    make_user("me@example.com")
    token = login("me@example.com").json()["access_token"]
    res = client.get("/api/auth/me", headers=bearer(token))
    assert res.status_code == 200
    assert res.json()["email"] == "me@example.com"
 
 
def test_get_current_user_is_reusable_by_other_routes():
    make_user("reuse@example.com")
    token = login("reuse@example.com").json()["access_token"]
    assert client.get("/protected/any", headers=bearer(token)).status_code == 200
    assert client.get("/protected/customer", headers=bearer(token)).status_code == 200
 
 
def test_logout_with_valid_token():
    make_user("logout@example.com")
    token = login("logout@example.com").json()["access_token"]
    res = client.post("/api/auth/logout", headers=bearer(token))
    assert res.status_code == 200
 
 
def test_admin_login_success_for_admin():
    make_user("admin1@example.com", role="admin")
    res = login("admin1@example.com", admin=True)
    assert res.status_code == 200
    assert res.json()["user"]["role"] == "admin"
 
 
# ---------- negative ----------
def test_wrong_password_returns_generic_401():
    make_user("wrongpw@example.com")
    res = login("wrongpw@example.com", password="nope12345")
    assert res.status_code == 401
    assert res.json()["detail"] == "Invalid email or password"
 
 
def test_unknown_email_returns_same_generic_401():
    res = login("ghost@example.com")
    assert res.status_code == 401
    assert res.json()["detail"] == "Invalid email or password"
 
 
def test_missing_fields_return_422():
    assert client.post("/api/auth/login", json={"email": "x@example.com"}).status_code == 422
 
 
def test_protected_route_without_token_returns_401():
    assert client.get("/api/auth/me").status_code == 401
 
 
def test_invalid_token_returns_401():
    assert client.get("/api/auth/me", headers=bearer("not-a-real-token")).status_code == 401
 
 
def test_expired_token_returns_401():
    make_user("expired@example.com")
    user_id = login("expired@example.com").json()["user"]["id"]
    expired = jwt.encode({"sub": str(user_id), "role": "customer", "exp": 1}, SECRET_KEY, algorithm=ALGORITHM)
    assert client.get("/api/auth/me", headers=bearer(expired)).status_code == 401
 
 
def test_customer_cannot_use_admin_login():
    make_user("notadmin@example.com")
    assert login("notadmin@example.com", admin=True).status_code == 401
 
 
def test_admin_blocked_from_customer_only_route():
    make_user("admin2@example.com", role="admin")
    token = login("admin2@example.com", admin=True).json()["access_token"]
    assert client.get("/protected/customer", headers=bearer(token)).status_code == 403
 
 
def test_deactivated_account_cannot_log_in():
    make_user("inactive@example.com", status="inactive")
    assert login("inactive@example.com").status_code == 403
 
 
def test_lockout_after_five_failed_attempts():
    make_user("lock@example.com")
    for _ in range(5):
        assert login("lock@example.com", password="wrong1234").status_code == 401
    # even the correct password is blocked now
    assert login("lock@example.com").status_code == 429
 