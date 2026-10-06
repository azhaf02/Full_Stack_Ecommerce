import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import Column, DateTime, String
from app.database import Base


class CheckoutSession(Base):
    __tablename__ = "checkout_sessions"

    session_id = Column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
    )
    customer_id = Column(String(100), nullable=False, index=True)
    status = Column(String(20), nullable=False, default="active")
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    expires_at = Column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc) + timedelta(minutes=30),
    )
