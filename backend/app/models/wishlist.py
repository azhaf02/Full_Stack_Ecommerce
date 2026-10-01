from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import relationship

from .base import Base


class Wishlist(Base):
    __tablename__ = "wishlists"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        
        nullable=False,
        index=True
    )

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )

    items = relationship(
        "WishlistItem",
        back_populates="wishlist",
        cascade="all, delete-orphan"
    )


class WishlistItem(Base):
    __tablename__ = "wishlist_items"

    id = Column(Integer, primary_key=True, index=True)

    wishlist_id = Column(
        Integer,
        ForeignKey("wishlists.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    product_id = Column(
        Integer,
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    wishlist = relationship(
        "Wishlist",
        back_populates="items"
    )

    product = relationship("Product")

    __table_args__ = (
        UniqueConstraint(
            "wishlist_id",
            "product_id",
            name="uq_wishlist_product"
        ),
    )