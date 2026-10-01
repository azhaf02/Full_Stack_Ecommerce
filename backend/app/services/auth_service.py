import time

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import create_access_token, hash_password, verify_password
from app.models.role import Role
from app.models.user import User
from app.schemas.auth import UserCreate, UserLogin, UserOut

# ---------- failed-login lockout (AUTH-07) ----------
# Basic in-memory version: resets when the server restarts.
MAX_FAILED_ATTEMPTS = 5
LOCKOUT_SECONDS = 15 * 60
_failed_logins: dict[str, list[float]] = {}


def _check_lockout(email: str) -> None:
    now = time.time()
    recent = [t for t in _failed_logins.get(email, []) if now - t < LOCKOUT_SECONDS]
    _failed_logins[email] = recent
    if len(recent) >= MAX_FAILED_ATTEMPTS:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many failed login attempts. Please try again in 15 minutes.",
        )


def _record_failure(email: str) -> None:
    _failed_logins.setdefault(email, []).append(time.time())


def _clear_failures(email: str) -> None:
    _failed_logins.pop(email, None)


# ---------- helpers ----------
def _get_or_create_role(db: Session, name: str) -> Role:
    role = db.query(Role).filter(Role.name == name).first()
    if role is None:
        role = Role(name=name)
        db.add(role)
        db.flush()
    return role


def to_user_out(user: User) -> UserOut:
    return UserOut(
        id=user.id, name=user.name, email=user.email,
        role=user.role.name, status=user.status, created_at=user.created_at,
    )


# ---------- register ----------
def register_customer(db: Session, data: UserCreate) -> User:
    email = data.email.lower()
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    user = User(
        name=data.name.strip(),
        email=email,
        password_hash=hash_password(data.password),
        role=_get_or_create_role(db, "customer"),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


# ---------- login ----------
def login(db: Session, data: UserLogin, admin_only: bool = False) -> tuple[str, User]:
    email = data.email.lower()
    _check_lockout(email)

    user = db.query(User).filter(User.email == email).first()
    # Same message for wrong email, wrong password, or non-admin on admin login
    if (
        user is None
        or not verify_password(data.password, user.password_hash)
        or (admin_only and user.role.name != "admin")
    ):
        _record_failure(email)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    # Rishi's admin panel sets status = "inactive" to deactivate a customer
    if user.status != "active":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is deactivated")

    _clear_failures(email)
    return create_access_token(user), user