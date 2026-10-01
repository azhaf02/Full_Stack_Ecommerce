from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import create_access_token, hash_password, verify_password
from app.models.role import Role
from app.models.user import User
from app.schemas.auth import UserCreate, UserLogin, UserOut


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


def login(db: Session, data: UserLogin, admin_only: bool = False) -> tuple[str, User]:
    user = db.query(User).filter(User.email == data.email.lower()).first()
    # Same message for wrong email, wrong password, or non-admin on admin login
    if (
        user is None
        or not verify_password(data.password, user.password_hash)
        or (admin_only and user.role.name != "admin")
    ):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    # Rishi's admin panel sets status = "inactive" to deactivate a customer
    if user.status != "active":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is deactivated")
    return create_access_token(user), user