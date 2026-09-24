import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.orm import declarative_base

Base = declarative_base()

class NotificationType(str, enum.Enum):
    ORDER_STATUS = "ORDER_STATUS"
    PAYMENT = "PAYMENT"
    RETURN_REFUND = "RETURN_REFUND"
    SUPPORT = "SUPPORT"
    GENERAL = "GENERAL"

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True, nullable=False)
    type = Column(Enum(NotificationType), default=NotificationType.GENERAL, nullable=False)
    title = Column(String(150), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<Notification(id={self.id}, user_id={self.user_id}, type={self.type}, is_read={self.is_read})>"