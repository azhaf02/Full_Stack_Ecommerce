
from sqlalchemy import Column, Integer, String, DateTime, CheckConstraint, func, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class Inventory(Base):
    __tablename__ = "inventory"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)

product_id = Column(
    Integer,
    ForeignKey("products.id"),
    nullable=False,
    index=True
)

variant_id = Column(
    Integer,
    ForeignKey("product_variants.id"),
    nullable=True,
    index=True
)

quantity = Column(Integer, nullable=False, default=0)
low_stock_threshold = Column(Integer, nullable=False, default=10)

location = Column(String(100), nullable=True)
status = Column(String(20), nullable=False, default="IN_STOCK")

created_at = Column(DateTime, server_default=func.now(), nullable=False)
updated_at = Column(
        DateTime,
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )

history = relationship(
    "InventoryHistory",
     back_populates="inventory",
    cascade="all, delete-orphan"
    )

__table_args__ = (
        CheckConstraint(
            "quantity >= 0",
            name="check_inventory_quantity_non_negative"
        ),
        CheckConstraint(
            "low_stock_threshold >= 0",
            name="check_inventory_threshold_non_negative"
        ),
        CheckConstraint(
            "status IN ('IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK')",
            name="check_inventory_status_valid"
        ),
    )

    