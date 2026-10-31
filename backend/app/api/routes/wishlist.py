
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.services import wishlist_service
from app.schemas.wishlist import WishlistItemCreate, WishlistResponse


router = APIRouter(
    prefix="/api/wishlist",
    tags=["Wishlist"]
)


@router.get("", response_model=WishlistResponse)
def get_wishlist(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return wishlist_service.get_or_create_wishlist(
        db,
        current_user.id
    )


@router.post("/items", response_model=WishlistResponse)
def add_to_wishlist(
    item: WishlistItemCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        return wishlist_service.add_item(
            db,
            current_user.id,
            item.product_id
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/items/{product_id}", response_model=WishlistResponse)
def remove_from_wishlist(
    product_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        return wishlist_service.remove_item(
            db,
            current_user.id,
            product_id
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
