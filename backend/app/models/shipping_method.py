
from datetime import datetime

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Column,
    DateTime,
    Integer,
    Numeric,
    String,
)

from app.database import Base


class ShippingMethod(Base):
    __tablename__ = "shipping_methods"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)

    name = Column(String(100), nullable=False, unique=True)

    cost = Column(Numeric(10, 2), nullable=False, default=0)

    estimated_days = Column(Integer, nullable=False)

    status = Column(Boolean, nullable=False, default=True)

    created_at = Column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
    )

    __table_args__ = (
        CheckConstraint(
            "cost >= 0",
            name="check_shipping_cost_nonnegative",
        ),
        CheckConstraint(
            "estimated_days >= 0",
            name="check_shipping_estimated_days_nonnegative",
        ),
    )

    def __repr__(self):
        return (
            f"<ShippingMethod("
            f"id={self.id}, "
            f"name={self.name!r}, "
            f"cost={self.cost}, "
            f"status={self.status}"
            f")>"
        )