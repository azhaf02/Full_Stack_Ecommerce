from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.core.security import get_current_user, require_role
from app.database import get_db
from app.models.user import User
from app.schemas.account import AddressCreate, AddressOut, AddressUpdate, PasswordChange, ProfileUpdate
from app.schemas.auth import UserOut
from app.services import account_service, auth_service

router = APIRouter(prefix="/api/account", tags=["Account"])

customer_only = require_role("customer")


# ---------- profile (any logged-in user) ----------
@router.get("/profile", response_model=UserOut)
def get_profile(user: User = Depends(get_current_user)):
    return auth_service.to_user_out(user)


@router.put("/profile", response_model=UserOut)
def update_profile(data: ProfileUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    user = account_service.update_profile(db, user, data)
    return auth_service.to_user_out(user)


@router.put("/password")
def change_password(data: PasswordChange, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    account_service.change_password(db, user, data)
    return {"message": "Password updated successfully"}


# ---------- addresses (customers only) ----------


@router.get("/addresses", response_model=list[AddressOut])
def list_addresses(user: User = Depends(customer_only), db: Session = Depends(get_db)):
    return account_service.list_addresses(db, user)


@router.post("/addresses", response_model=AddressOut, status_code=status.HTTP_201_CREATED)
def create_address(data: AddressCreate, user: User = Depends(customer_only), db: Session = Depends(get_db)):
    return account_service.create_address(db, user, data)


@router.get("/addresses/{address_id}", response_model=AddressOut)
def get_address(address_id: int, user: User = Depends(customer_only), db: Session = Depends(get_db)):
    return account_service.get_owned_address(db, user, address_id)


@router.put("/addresses/{address_id}", response_model=AddressOut)
def update_address(
    address_id: int, data: AddressUpdate,
    user: User = Depends(customer_only), db: Session = Depends(get_db),
):
    return account_service.update_address(db, user, address_id, data)


@router.delete("/addresses/{address_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_address(address_id: int, user: User = Depends(customer_only), db: Session = Depends(get_db)):
    account_service.delete_address(db, user, address_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.put("/addresses/{address_id}/default", response_model=AddressOut)
def set_default_address(address_id: int, user: User = Depends(customer_only), db: Session = Depends(get_db)):
    return account_service.set_default_address(db, user, address_id)