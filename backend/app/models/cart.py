from sqlalchemy import Column, Integer, ForeignKey, Numeric, String
from sqlalchemy.orm import relationship
from app.database import Base

# Register related models with SQLAlchemy metadata


class Cart(Base):
    __tablename__ = "carts"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    guest_token = Column(String(64), nullable=True, unique=True, index=True)

    items = relationship(
        "CartItem",
        back_populates="cart",
        cascade="all, delete-orphan"
    )


class CartItem(Base):
    __tablename__ = "cart_items"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
        autoincrement=True
    )

    cart_id = Column(
        Integer,
        ForeignKey("carts.id", ondelete="CASCADE"),
        nullable=False
    )

    product_id = Column(Integer, nullable=False)
    variant_id = Column(Integer, nullable=True)

    quantity = Column(Integer, nullable=False)

    unit_price = Column(
        Numeric(10, 2),
        nullable=False
    )

    cart = relationship(
        "Cart",
        back_populates="items"
    )