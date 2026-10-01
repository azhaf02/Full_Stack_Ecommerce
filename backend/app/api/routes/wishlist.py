from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.services import wishlist_service
from app.schemas.wishlist import WishlistItemCreate, WishlistResponse


router = APIRouter(
    prefix="/api/wishlist",
    tags=["Wishlist"]
)


@router.get("/{user_id}", response_model=WishlistResponse)
def get_wishlist(
    user_id: int,
    db: Session = Depends(get_db)
):
    wishlist = wishlist_service.get_or_create_wishlist(db, user_id)

    return wishlist


@router.post("/{user_id}/items", response_model=WishlistResponse)
def add_to_wishlist(
    user_id: int,
    item: WishlistItemCreate,
    db: Session = Depends(get_db)
):
    try:
        return wishlist_service.add_item(
            db,
            user_id,
            item.product_id
        )
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )


@router.delete("/{user_id}/items/{product_id}", response_model=WishlistResponse)
def remove_from_wishlist(
    user_id: int,
    product_id: int,
    db: Session = Depends(get_db)
):
    try:
        return wishlist_service.remove_item(
            db,
            user_id,
            product_id
        )
    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail=str(e)
        )