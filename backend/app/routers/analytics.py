from fastapi import APIRouter, Depends
from sqlalchemy import func, text
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.security import require_role
from app.models.user import User
from app.models.role import Role
from app.models.order import Order, OrderStatus
from app.models.payment import Payment, PaymentStatus


router = APIRouter(
    prefix="/api/admin",
    tags=["Analytics"]
)


@router.get("/analytics/summary")
def get_analytics_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    # -----------------------------
    # 1. Total Orders
    # -----------------------------
    total_orders = db.query(func.count(Order.id)).scalar() or 0

    # -----------------------------
    # 2. Total Sales
    # -----------------------------
    total_sales = db.query(
        func.coalesce(func.sum(Order.total_amount), 0)
    ).scalar()

    # -----------------------------
    # 3. Total Customers
    # -----------------------------
    total_customers = (
        db.query(func.count(User.id))
        .join(Role, User.role_id == Role.id)
        .filter(Role.name == "customer")
        .scalar()
        or 0
    )

    # -----------------------------
    # 4. Total Products
    # -----------------------------
    product_result = db.execute(
        text("SELECT COUNT(*) FROM products")
    ).scalar()

    total_products = product_result or 0

    # -----------------------------
    # 5. Pending Orders
    # -----------------------------
    pending_order_statuses = [
        OrderStatus.PLACED.value,
        OrderStatus.CONFIRMED.value,
        OrderStatus.PROCESSING.value,
        OrderStatus.PACKED.value,
        OrderStatus.SHIPPED.value,
        OrderStatus.OUT_FOR_DELIVERY.value,
    ]

    pending_orders = (
        db.query(func.count(Order.id))
        .filter(Order.status.in_(pending_order_statuses))
        .scalar()
        or 0
    )

    # -----------------------------
    # 6. Completed Orders
    # -----------------------------
    completed_orders = (
        db.query(func.count(Order.id))
        .filter(Order.status == OrderStatus.DELIVERED.value)
        .scalar()
        or 0
    )

    # -----------------------------
    # 7. Cancelled Orders
    # -----------------------------
    cancelled_orders = (
        db.query(func.count(Order.id))
        .filter(Order.status == OrderStatus.CANCELLED.value)
        .scalar()
        or 0
    )

    # -----------------------------
    # 8. Pending Payments
    # -----------------------------
    pending_payments = (
        db.query(func.count(Payment.id))
        .filter(Payment.status == PaymentStatus.PENDING)
        .scalar()
        or 0
    )

    low_stock_count = db.execute(
        text("""
            SELECT COUNT(*)
            FROM inventory
            WHERE quantity <= low_stock_threshold
        """)
    ).scalar() or 0

    return {
        "total_orders": total_orders,
        "total_sales": float(total_sales or 0),
        "total_customers": total_customers,
        "total_products": total_products,
        "pending_orders": pending_orders,
        "completed_orders": completed_orders,
        "cancelled_orders": cancelled_orders,
        "pending_payments": pending_payments,
        "low_stock_count": low_stock_count,
    }
