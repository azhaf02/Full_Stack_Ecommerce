from enum import Enum
from sqlalchemy import Column, Integer, String, Text, Numeric, DateTime, ForeignKey, CheckConstraint, UniqueConstraint, func
from sqlalchemy.orm import relationship
from app.database import Base

class OrderStatus(str, Enum):
    PLACED = "PLACED"
    CONFIRMED = "CONFIRMED"
    PROCESSING = "PROCESSING"
    PACKED = "PACKED"
    SHIPPED = "SHIPPED"
    OUT_FOR_DELIVERY = "OUT_FOR_DELIVERY"
    DELIVERED = "DELIVERED"
    CANCELLED = "CANCELLED"
    RETURN_REQUESTED = "RETURN_REQUESTED"
    RETURN_APPROVED = "RETURN_APPROVED"
    RETURNED = "RETURNED"
    REFUND_PENDING = "REFUND_PENDING"
    REFUNDED = "REFUNDED"

ORDER_STATUS_VALUES = ", ".join(f"'{s.value}'" for s in OrderStatus)

class PaymentStatus(str, Enum):
    PENDING = "PENDING"
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"
    REFUND_PENDING = "REFUND_PENDING"
    REFUNDED = "REFUNDED"

PAYMENT_STATUS_VALUES = ", ".join(f"'{s.value}'" for s in PaymentStatus)

class ReturnStatus(str, Enum):
    REQUESTED = "REQUESTED"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    RETURNED = "RETURNED"
    REFUND_PENDING = "REFUND_PENDING"
    REFUNDED = "REFUNDED"

RETURN_STATUS_VALUES = ", ".join(f"'{s.value}'" for s in ReturnStatus)

class PaymentMethod(str, Enum):
    ONLINE = "ONLINE"
    COD = "COD"

# user_id, address_id, coupon_id, product_id and variant_id are plain indexed integers until the
# users/addresses/coupons/products/product_variants tables exist; FK constraints are added in a later migration.
# shipping_method_id is FK-constrained in the database (0007_orders), but has no ForeignKey here because
# shipping_methods has no model in the repo yet; add ForeignKey("shipping_methods.id") once it does.

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    order_number = Column(String(30), unique=True, nullable=False, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    address_id = Column(Integer, nullable=False)
    shipping_method_id = Column(Integer, nullable=False)
    coupon_id = Column(Integer, nullable=True)
    status = Column(String(30), default=OrderStatus.PLACED.value, nullable=False, index=True)
    payment_method = Column(String(20), nullable=False)
    payment_status = Column(String(20), default=PaymentStatus.PENDING.value, nullable=False)
    subtotal = Column(Numeric(10, 2), nullable=False)
    discount_amount = Column(Numeric(10, 2), default=0, nullable=False)
    tax_amount = Column(Numeric(10, 2), default=0, nullable=False)
    shipping_cost = Column(Numeric(10, 2), default=0, nullable=False)
    total_amount = Column(Numeric(10, 2), nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    status_history = relationship("OrderStatusHistory", back_populates="order", cascade="all, delete-orphan",
                                  order_by="OrderStatusHistory.changed_at")
    returns = relationship("Return", back_populates="order", cascade="all, delete-orphan")

    __table_args__ = (
        CheckConstraint(f"status IN ({ORDER_STATUS_VALUES})", name="check_order_status_valid"),
        CheckConstraint(f"payment_status IN ({PAYMENT_STATUS_VALUES})", name="check_order_payment_status_valid"),
        CheckConstraint("total_amount >= 0", name="check_order_total_non_negative"),
    )

class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(Integer, nullable=False, index=True)
    variant_id = Column(Integer, nullable=True)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Numeric(10, 2), nullable=False)

    order = relationship("Order", back_populates="items")

    __table_args__ = (
        CheckConstraint("quantity > 0", name="check_order_item_quantity_positive"),
        CheckConstraint("unit_price >= 0", name="check_order_item_price_non_negative"),
    )

class OrderStatusHistory(Base):
    __tablename__ = "order_status_history"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    previous_status = Column(String(30), nullable=True)
    new_status = Column(String(30), nullable=False)
    changed_by = Column(Integer, nullable=True)
    remarks = Column(Text, nullable=True)
    changed_at = Column(DateTime, server_default=func.now(), nullable=False)

    order = relationship("Order", back_populates="status_history")

class Return(Base):
    __tablename__ = "returns"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    reason = Column(Text, nullable=False)
    status = Column(String(20), default=ReturnStatus.REQUESTED.value, nullable=False, index=True)
    admin_remarks = Column(Text, nullable=True)
    reviewed_by = Column(Integer, nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    refund_amount = Column(Numeric(10, 2), nullable=True)
    requested_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    order = relationship("Order", back_populates="returns")
    items = relationship("ReturnItem", back_populates="return_request", cascade="all, delete-orphan")

    __table_args__ = (
        CheckConstraint(f"status IN ({RETURN_STATUS_VALUES})", name="check_return_status_valid"),
        CheckConstraint("refund_amount IS NULL OR refund_amount >= 0", name="check_return_refund_non_negative"),
    )

class ReturnItem(Base):
    __tablename__ = "return_items"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    return_id = Column(Integer, ForeignKey("returns.id", ondelete="CASCADE"), nullable=False, index=True)
    order_item_id = Column(Integer, ForeignKey("order_items.id"), nullable=False, index=True)
    quantity = Column(Integer, nullable=False)

    return_request = relationship("Return", back_populates="items")

    __table_args__ = (
        UniqueConstraint("return_id", "order_item_id", name="uq_return_item_per_return"),
        CheckConstraint("quantity > 0", name="check_return_item_quantity_positive"),
    )
