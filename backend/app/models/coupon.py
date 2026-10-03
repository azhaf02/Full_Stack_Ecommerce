from sqlalchemy import Column, Integer, String, Numeric, DateTime, Boolean
from app.database import Base


class Coupon(Base):
    __tablename__ = "coupons"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    code = Column(String(50), unique=True, nullable=False, index=True)
    discount_type = Column(String(20), nullable=False)
    discount_value = Column(Numeric(10, 2), nullable=False)
    min_order_value = Column(Numeric(10, 2), nullable=True)
    max_discount = Column(Numeric(10, 2), nullable=True)
    start_date = Column(DateTime, nullable=False)
    expiry_date = Column(DateTime, nullable=False)
    usage_limit = Column(Integer, nullable=True)
    per_user_limit = Column(Integer, nullable=True)
    status = Column(Boolean, nullable=False, default=True)