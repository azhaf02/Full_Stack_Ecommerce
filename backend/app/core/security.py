"""Shared auth helpers. Other modules import get_current_user / require_role from here."""
import hashlib
import os
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User

SECRET_KEY = os.getenv("SECRET_KEY", "change-me-in-env")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
bearer_scheme = HTTPBearer(auto_error=False)


def _normalize_password_for_bcrypt(password: str) -> str:
    """
    Bcrypt has a 72-byte limit. For long passwords (>72 bytes), pre-hash using
    SHA-256 to avoid truncation collisions. Normal passwords remain unchanged
    to guarantee 100% backward compatibility with existing bcrypt hashes.
    """
    if len(password.encode("utf-8")) > 72:
        return hashlib.sha256(password.encode("utf-8")).hexdigest()
    return password


# --------- passwords ---------
def hash_password(password: str) -> str:
    normalized = _normalize_password_for_bcrypt(password)
    return pwd_context.hash(normalized)


def get_password_hash(password: str) -> str:
    """Alias for backwards compatibility across modules."""
    return hash_password(password)


def verify_password(plain: str, hashed: str) -> bool:
    if not plain or not hashed:
        return False
    # 1. Direct backward-compatible verification for existing hashes
    try:
        if pwd_context.verify(plain, hashed):
            return True
    except Exception:
        pass

    # 2. Pre-hashed verification for long passwords (>72 bytes)
    try:
        normalized = _normalize_password_for_bcrypt(plain)
        if normalized != plain and pwd_context.verify(normalized, hashed):
            return True
    except Exception:
        pass

    # 3. Legacy truncation fallback for existing hashes created with [:72]
    try:
        if pwd_context.verify(plain[:72], hashed):
            return True
    except Exception:
        pass

    return False


# ---------- JWT ----------
def create_access_token(user: User) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": str(user.id), "role": user.role.name, "exp": expire}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def _unauthorized(detail: str = "Not authenticated") -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
        headers={"WWW-Authenticate": "Bearer"},
    )


# ---------- shared dependencies (other modules use these) ----------
def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    if credentials is None:
        raise _unauthorized()
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload["sub"])
    except (jwt.PyJWTError, KeyError, ValueError):
        raise _unauthorized("Invalid or expired token")

    user = db.get(User, user_id)
    if user is None or user.status != "active":
        raise _unauthorized("User not found or inactive")
    return user


def require_role(*roles: str):
    """Usage: current_user: User = Depends(require_role("admin"))"""
    def checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role.name not in roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions")
        return current_user
    return checker