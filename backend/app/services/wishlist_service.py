from sqlalchemy.orm import Session

from app.models.wishlist import Wishlist, WishlistItem


def get_or_create_wishlist(db: Session, user_id: int):
    wishlist = (
        db.query(Wishlist)
        .filter(Wishlist.user_id == user_id)
        .first()
    )

    if not wishlist:
        wishlist = Wishlist(user_id=user_id)
        db.add(wishlist)
        db.commit()
        db.refresh(wishlist)

    return wishlist


def add_item(db: Session, user_id: int, product_id: int):
    wishlist = get_or_create_wishlist(db, user_id)

    existing_item = (
        db.query(WishlistItem)
        .filter(
            WishlistItem.wishlist_id == wishlist.id,
            WishlistItem.product_id == product_id
        )
        .first()
    )

    if existing_item:
        raise ValueError("Product already exists in wishlist")

    item = WishlistItem(
        wishlist_id=wishlist.id,
        product_id=product_id
    )

    db.add(item)
    db.commit()
    db.refresh(wishlist)

    return wishlist


def remove_item(db: Session, user_id: int, product_id: int):
    wishlist = get_or_create_wishlist(db, user_id)

    item = (
        db.query(WishlistItem)
        .filter(
            WishlistItem.wishlist_id == wishlist.id,
            WishlistItem.product_id == product_id
        )
        .first()
    )

    if not item:
        raise ValueError("Product not found in wishlist")

    db.delete(item)
    db.commit()
    db.refresh(wishlist)

    return wishlist