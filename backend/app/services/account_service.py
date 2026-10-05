"""Address CRUD. Safiya's checkout can reuse list_addresses() and get_owned_address()."""
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.address import Address
from app.models.user import User
from app.schemas.account import AddressCreate, AddressUpdate


def list_addresses(db: Session, user: User) -> list[Address]:
    return (
        db.query(Address)
        .filter(Address.user_id == user.id)
        .order_by(Address.is_default.desc(), Address.id)
        .all()
    )


def get_owned_address(db: Session, user: User, address_id: int) -> Address:
    """Returns the address only if it belongs to this user (404 otherwise)."""
    address = db.query(Address).filter(Address.id == address_id, Address.user_id == user.id).first()
    if address is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Address not found")
    return address


def _clear_default(db: Session, user: User) -> None:
    db.query(Address).filter(Address.user_id == user.id, Address.is_default.is_(True)).update(
        {Address.is_default: False}
    )


def create_address(db: Session, user: User, data: AddressCreate) -> Address:
    is_first = db.query(Address).filter(Address.user_id == user.id).count() == 0
    make_default = data.is_default or is_first
    if make_default:
        _clear_default(db, user)

    address = Address(**data.model_dump(exclude={"is_default"}), user_id=user.id, is_default=make_default)
    db.add(address)
    db.commit()
    db.refresh(address)
    return address


def update_address(db: Session, user: User, address_id: int, data: AddressUpdate) -> Address:
    address = get_owned_address(db, user, address_id)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(address, field, value)
    db.commit()
    db.refresh(address)
    return address


def delete_address(db: Session, user: User, address_id: int) -> None:
    address = get_owned_address(db, user, address_id)
    was_default = address.is_default
    db.delete(address)
    db.flush()
    if was_default:  # promote another address to default
        next_address = db.query(Address).filter(Address.user_id == user.id).first()
        if next_address:
            next_address.is_default = True
    db.commit()


def set_default_address(db: Session, user: User, address_id: int) -> Address:
    address = get_owned_address(db, user, address_id)
    _clear_default(db, user)
    address.is_default = True
    db.commit()
    db.refresh(address)
    return address