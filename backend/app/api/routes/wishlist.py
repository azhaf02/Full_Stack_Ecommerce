from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session, joinedload

from app.database.connection import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.product import Product
from app.models.wishlist import Wishlist, WishlistItem

router = APIRouter(prefix="/api/wishlist", tags=["Wishlist"])


class WishlistAddRequest(BaseModel):
    product_id: int = Field(..., gt=0)


@router.post("/")
def add_to_wishlist(
    payload: WishlistAddRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    product = db.query(Product).filter(
        Product.id == payload.product_id
    ).first()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    wishlist = db.query(Wishlist).filter(
        Wishlist.user_id == current_user.id
    ).first()

    if not wishlist:
        wishlist = Wishlist(user_id=current_user.id)
        db.add(wishlist)
        db.flush()

    existing = db.query(WishlistItem).filter(
        WishlistItem.wishlist_id == wishlist.id,
        WishlistItem.product_id == payload.product_id,
    ).first()

    if existing:
        return {"message": "Product already in wishlist"}

    item = WishlistItem(
        wishlist_id=wishlist.id,
        product_id=payload.product_id,
    )
    db.add(item)
    db.commit()

    return {"message": "Product added to wishlist"}


@router.get("/")
def get_wishlist(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    wishlist = db.query(Wishlist).options(
        joinedload(Wishlist.items).joinedload(WishlistItem.product)
    ).filter(
        Wishlist.user_id == current_user.id
    ).first()

    if not wishlist:
        return []

    return [
        {
            "id": item.product.id,
            "name": item.product.name,
            "price": item.product.price,
            "stock_quantity": item.product.stock_quantity,
            "wishlist_item_id": item.id,
        }
        for item in wishlist.items
        if item.product is not None
    ]


@router.delete("/")
def remove_from_wishlist(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    wishlist = db.query(Wishlist).filter(
        Wishlist.user_id == current_user.id
    ).first()

    if not wishlist:
        raise HTTPException(status_code=404, detail="Wishlist not found")

    item = db.query(WishlistItem).filter(
        WishlistItem.wishlist_id == wishlist.id,
        WishlistItem.product_id == product_id,
    ).first()

    if not item:
        raise HTTPException(status_code=404, detail="Product not in wishlist")

    db.delete(item)
    db.commit()

    return {"message": "Product removed from wishlist"}