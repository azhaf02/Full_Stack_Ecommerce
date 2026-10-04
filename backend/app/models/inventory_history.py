from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    ForeignKey,
    Text,
    func
)
from sqlalchemy.orm import relationship

from app.database import Base


class InventoryHistory(Base):
    __tablename__ = "inventory_history"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
        autoincrement=True
    )

    # Required product reference
    product_id = Column(
        Integer,
        ForeignKey("products.id"),
        nullable=False,
        index=True
    )

    # Link to the inventory record
    inventory_id = Column(
        Integer,
        ForeignKey("inventory.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # Stock change details
    change_amount = Column(
        Integer,
        nullable=False
    )

    change_type = Column(
        String(30),
        nullable=False
    )

    quantity_changed = Column(
        Integer,
        nullable=False
    )

    previous_quantity = Column(
        Integer,
        nullable=False
    )

    new_quantity = Column(
        Integer,
        nullable=False
    )

    # Reason and admin/user who made the change
    reason = Column(
        Text,
        nullable=True
    )

    changed_by = Column(
        Integer,
        nullable=False
    )

    location = Column(
        String(100),
        nullable=True
    )

    # Required timestamp
    timestamp = Column(
        DateTime,
        server_default=func.now(),
        nullable=False
    )

    # Existing compatibility field
    created_at = Column(
        DateTime,
        server_default=func.now(),
        nullable=False
    )

    inventory = relationship(
        "Inventory",
        back_populates="history"
    )