import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum, CheckConstraint
from sqlalchemy.orm import declarative_base

Base = declarative_base()

class ReviewStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"

class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, index=True, nullable=False)
    user_id = Column(Integer, index=True, nullable=False)
    order_id = Column(Integer, index=True, nullable=False)
    rating = Column(Integer, nullable=False)
    title = Column(String(200), nullable=True)
    comment = Column(Text, nullable=False)
    status = Column(Enum(ReviewStatus), default=ReviewStatus.PENDING, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    __table_args__ = (
        CheckConstraint("rating >= 1 AND rating <= 5", name="check_rating_range"),
    )

    def __repr__(self):
        return f"<Review(id={self.id}, product_id={self.product_id}, user_id={self.user_id}, rating={self.rating}, status={self.status})>"