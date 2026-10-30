from datetime import datetime

from sqlalchemy import (
    Column,
    Integer,
    String,
    Numeric,
    DateTime,
    ForeignKey,
)
from sqlalchemy.orm import relationship

from app.database import Base


class Invoice(Base):
    __tablename__ = "invoices"

    # Primary Key
    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    # Foreign Key:
    # invoices.order_id -> orders.id
    order_id = Column(
        Integer,
        ForeignKey("orders.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # Unique invoice number
    invoice_number = Column(
        String(100),
        unique=True,
        nullable=False,
        index=True
    )

    # Invoice amount
    amount = Column(
        Numeric(10, 2),
        nullable=False
    )

    # Tax amount
    tax = Column(
        Numeric(10, 2),
        nullable=False,
        default=0
    )

    # Date and time when invoice was issued
    issued_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    # SQLAlchemy relationship with Rukhsar's Order model
    order = relationship("Order")

    def __repr__(self):
        return (
            f"<Invoice("
            f"id={self.id}, "
            f"invoice_number={self.invoice_number}, "
            f"order_id={self.order_id}, "
            f"amount={self.amount}, "
            f"tax={self.tax}"
            f")>"
        )