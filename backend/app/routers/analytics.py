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


# ============================================================
# ANALYTICS SUMMARY / KPI
# ============================================================

@router.get("/analytics/summary")
def get_analytics_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):

    # -----------------------------
    # 1. Total Orders
    # -----------------------------
    total_orders = db.query(
        func.count(Order.id)
    ).scalar() or 0

    # -----------------------------
    # 2. Total Sales
    # -----------------------------
    total_sales = db.query(
        func.coalesce(
            func.sum(Order.total_amount), 0
        )
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
        .filter(
            Order.status.in_(pending_order_statuses)
        )
        .scalar()
        or 0
    )

    # -----------------------------
    # 6. Completed Orders
    # -----------------------------
    completed_orders = (
        db.query(func.count(Order.id))
        .filter(
            Order.status == OrderStatus.DELIVERED.value
        )
        .scalar()
        or 0
    )

    # -----------------------------
    # 7. Cancelled Orders
    # -----------------------------
    cancelled_orders = (
        db.query(func.count(Order.id))
        .filter(
            Order.status == OrderStatus.CANCELLED.value
        )
        .scalar()
        or 0
    )

    # -----------------------------
    # 8. Pending Payments
    # -----------------------------
    pending_payments = (
        db.query(func.count(Payment.id))
        .filter(
            Payment.status == PaymentStatus.PENDING
        )
        .scalar()
        or 0
    )

    # -----------------------------
    # 9. Low Stock Products
    # -----------------------------
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


# ============================================================
# ANALYTICS CHARTS
# ============================================================

@router.get("/analytics/charts")
def get_analytics_charts(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):

    # --------------------------------------------------------
    # 1. Sales Over Time
    # --------------------------------------------------------
    sales_over_time = (
        db.query(
            func.date(Order.created_at).label("date"),
            func.coalesce(
                func.sum(Order.total_amount), 0
            ).label("sales")
        )
        .group_by(
            func.date(Order.created_at)
        )
        .order_by(
            func.date(Order.created_at)
        )
        .all()
    )

    # --------------------------------------------------------
    # 2. Orders Over Time
    # --------------------------------------------------------
    orders_over_time = (
        db.query(
            func.date(Order.created_at).label("date"),
            func.count(Order.id).label("orders")
        )
        .group_by(
            func.date(Order.created_at)
        )
        .order_by(
            func.date(Order.created_at)
        )
        .all()
    )

    # --------------------------------------------------------
    # 3. Top Products
    # --------------------------------------------------------
    top_products = db.execute(
        text("""
            SELECT
                p.id AS product_id,
                p.name AS product_name,
                COALESCE(SUM(oi.quantity), 0) AS quantity
            FROM order_items oi
            JOIN products p
                ON p.id = oi.product_id
            GROUP BY p.id, p.name
            ORDER BY quantity DESC
            LIMIT 10
        """)
    ).fetchall()

    # --------------------------------------------------------
    # 4. Top Categories
    # --------------------------------------------------------
    top_categories = db.execute(
        text("""
            SELECT
                c.id AS category_id,
                c.name AS category_name,
                COALESCE(SUM(oi.quantity), 0) AS quantity
            FROM order_items oi
            JOIN products p
                ON p.id = oi.product_id
            JOIN categories c
                ON c.id = p.category_id
            GROUP BY c.id, c.name
            ORDER BY quantity DESC
            LIMIT 10
        """)
    ).fetchall()

    # --------------------------------------------------------
    # 5. Revenue by Category
    # --------------------------------------------------------
    revenue_by_category = db.execute(
        text("""
            SELECT
                c.id AS category_id,
                c.name AS category_name,
                COALESCE(
                    SUM(oi.quantity * oi.unit_price),
                    0
                ) AS revenue
            FROM order_items oi
            JOIN products p
                ON p.id = oi.product_id
            JOIN categories c
                ON c.id = p.category_id
            GROUP BY c.id, c.name
            ORDER BY revenue DESC
        """)
    ).fetchall()

    # --------------------------------------------------------
    # 6. Order Status Distribution
    # --------------------------------------------------------
    order_status_distribution = (
        db.query(
            Order.status.label("status"),
            func.count(Order.id).label("orders")
        )
        .group_by(
            Order.status
        )
        .order_by(
            Order.status
        )
        .all()
    )

    # --------------------------------------------------------
    # RETURN ALL CHART DATA
    # --------------------------------------------------------

    return {
        "sales_over_time": [
            {
                "date": str(row.date),
                "sales": float(row.sales or 0)
            }
            for row in sales_over_time
        ],

        "orders_over_time": [
            {
                "date": str(row.date),
                "orders": int(row.orders or 0)
            }
            for row in orders_over_time
        ],

        "top_products": [
            {
                "product_id": row.product_id,
                "product_name": row.product_name,
                "quantity": int(row.quantity or 0)
            }
            for row in top_products
        ],

        "top_categories": [
            {
                "category_id": row.category_id,
                "category_name": row.category_name,
                "quantity": int(row.quantity or 0)
            }
            for row in top_categories
        ],

        "revenue_by_category": [
            {
                "category_id": row.category_id,
                "category_name": row.category_name,
                "revenue": float(row.revenue or 0)
            }
            for row in revenue_by_category
        ],

        "order_status_distribution": [
            {
                "status": row.status,
                "orders": int(row.orders or 0)
            }
            for row in order_status_distribution
        ]
    }