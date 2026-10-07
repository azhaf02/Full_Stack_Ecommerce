from enum import Enum
from sqlalchemy import Column, Integer, String, Text, DateTime, CheckConstraint, UniqueConstraint, func
from app.database import Base

class ReviewModerationStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    HIDDEN = "hidden"

class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    product_id = Column(Integer, nullable=False, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    order_id = Column(Integer, nullable=False, index=True)
    rating = Column(Integer, nullable=False)
    title = Column(String(150), nullable=True)
    comment = Column(Text, nullable=False)
    status = Column(String(20), default=ReviewModerationStatus.PENDING.value, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)

    __table_args__ = (
        CheckConstraint("rating >= 1 AND rating <= 5", name="check_rating_range_1_to_5"),
        UniqueConstraint("user_id", "product_id", "order_id", name="uq_user_product_order_review"),
    )