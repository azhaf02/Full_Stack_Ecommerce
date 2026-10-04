from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.database import get_db
from app.models.user import User
from app.schemas.auth import TokenOut, UserCreate, UserLogin, UserOut
from app.services import auth_service

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(data: UserCreate, db: Session = Depends(get_db)):
    user = auth_service.register_customer(db, data)
    return auth_service.to_user_out(user)


@router.post("/login", response_model=TokenOut)
def login(data: UserLogin, db: Session = Depends(get_db)):
    token, user = auth_service.login(db, data)
    return TokenOut(access_token=token, user=auth_service.to_user_out(user))


@router.post("/admin/login", response_model=TokenOut)
def admin_login(data: UserLogin, db: Session = Depends(get_db)):
    # Separate admin entry point (used by Rishi's AdminLoginPage)
    token, user = auth_service.login(db, data, admin_only=True)
    return TokenOut(access_token=token, user=auth_service.to_user_out(user))


@router.post("/logout")
def logout(current_user: User = Depends(get_current_user)):
    # JWT is stateless: the frontend just deletes the stored token.
    return {"message": "Logged out successfully"}


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return auth_service.to_user_out(current_user)