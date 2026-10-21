import enum
from datetime import datetime

from sqlalchemy import (
    Column,
    Integer,
    String,
    Numeric,
    DateTime,
    Enum,
    ForeignKey,
)
from sqlalchemy.orm import relationship

from app.database import Base


# Payment status values
# These are the same values used by the Order module.
class PaymentStatus(str, enum.Enum):
    PENDING = "PENDING"
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"
    REFUND_PENDING = "REFUND_PENDING"
    REFUNDED = "REFUNDED"


# Payment method values
# These match Rukhsar's Order module.
class PaymentMethod(str, enum.Enum):
    ONLINE = "ONLINE"
    COD = "COD"


class Payment(Base):
    __tablename__ = "payments"

    # Primary Key
    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    # Foreign Key:
    # payments.order_id -> orders.id
    order_id = Column(
        Integer,
        ForeignKey("orders.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # ONLINE or COD
    method = Column(
        Enum(PaymentMethod),
        nullable=False
    )

    # PENDING, SUCCESS, FAILED, CANCELLED,
    # REFUND_PENDING or REFUNDED
    status = Column(
        Enum(PaymentStatus),
        default=PaymentStatus.PENDING,
        nullable=False
    )

    # Transaction reference.
    # Can be empty initially, especially for COD.
    transaction_id = Column(
        String(100),
        unique=True,
        nullable=True,
        index=True
    )

    # Payment amount
    amount = Column(
        Numeric(10, 2),
        nullable=False
    )

    # Record creation time
    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    # Last update time
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )

    # SQLAlchemy relationship with Rukhsar's Order model
    order = relationship("Order")

    def __repr__(self):
        return (
            f"<Payment("
            f"id={self.id}, "
            f"order_id={self.order_id}, "
            f"method={self.method}, "
            f"status={self.status}, "
            f"amount={self.amount}"
            f")>"
        )