from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, CheckConstraint, func
from sqlalchemy.orm import relationship
from enum import Enum
from app.database import Base

class ReviewModerationStatus(str, Enum):
    APPROVED = "Approved"
    HIDDEN = "Hidden"

class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    rating = Column(Integer, nullable=False)
    title = Column(String(150), nullable=True)
    comment = Column(Text, nullable=False)
    status = Column(String(20), default=ReviewModerationStatus.APPROVED.value, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    __table_args__ = (
        CheckConstraint("rating >= 1 AND rating <= 5", name="check_rating_range_1_to_5"),
    )

    product = relationship("Product", back_populates="reviews")
    user = relationship("User", back_populates="reviews")
    order = relationship("Order", back_populates="reviews")