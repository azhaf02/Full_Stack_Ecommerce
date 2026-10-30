from datetime import date, datetime, time, timedelta, timezone
from math import ceil
from typing import Annotated, Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, ConfigDict, Field, model_validator
from pydantic.alias_generators import to_camel
from sqlalchemy import func, or_, text, cast, String
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.security import require_role
from app.models.order import Order, OrderStatus
from app.models.payment import Payment, PaymentMethod, PaymentStatus
from app.models.role import Role
from app.models.user import User
from app.models.audit_log import AuditLog
from app.models.review import Review

router = APIRouter(
    prefix="/api/admin",
    tags=["Admin"],
    dependencies=[Depends(require_role("admin"))],
)

# ============================================================
# DASHBOARD SUMMARY
# ============================================================

class DashboardKpis(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    total_revenue: float
    orders_today: int
    pending_orders: int
    low_stock_count: int


class DashboardSummary(BaseModel):
    kpis: DashboardKpis


@router.get("/dashboard-summary", response_model=DashboardSummary)
def dashboard_summary(db: Session = Depends(get_db)):
    start_of_today = datetime.combine(
        datetime.now(timezone.utc).date(), time.min
    )

    total_revenue = db.execute(
        text(
            "SELECT COALESCE(SUM(total_amount), 0) FROM orders "
            "WHERE status NOT IN ('CANCELLED', 'REFUNDED')"
        )
    ).scalar()

    orders_today = db.execute(
        text("SELECT COUNT(*) FROM orders WHERE created_at >= :start"),
        {"start": start_of_today},
    ).scalar()

    pending_orders = db.execute(
        text(
            "SELECT COUNT(*) FROM orders "
            "WHERE status IN ('PLACED', 'CONFIRMED', 'PROCESSING')"
        )
    ).scalar()

    low_stock_count = db.execute(
        text("SELECT COUNT(*) FROM inventory WHERE quantity <= low_stock_threshold")
    ).scalar()

    return DashboardSummary(
        kpis=DashboardKpis(
            total_revenue=float(total_revenue),
            orders_today=orders_today,
            pending_orders=pending_orders,
            low_stock_count=low_stock_count,
        )
    )


# ============================================================
# CUSTOMER MANAGEMENT — ADM-03
# ============================================================

class CustomerOut(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )

    id: int
    name: str
    email: str
    status: str
    created_at: datetime | None = None


class CustomerList(BaseModel):
    items: list[CustomerOut]
    total: int


@router.get("/customers", response_model=CustomerList)
def list_customers(q: str = "", db: Session = Depends(get_db)):
    query = db.query(User).join(Role).filter(Role.name == "customer")

    search = q.strip()
    if search:
        pattern = f"%{search}%"
        query = query.filter(
            or_(
                User.name.ilike(pattern),
                User.email.ilike(pattern),
            )
        )

    customers = query.order_by(User.created_at.desc()).all()
    return {"items": customers, "total": len(customers)}


class CustomerStatusUpdate(BaseModel):
    status: Literal["active", "inactive"]


@router.put("/customers/{customer_id}/status", response_model=CustomerOut)
def update_customer_status(
    customer_id: int,
    payload: CustomerStatusUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_role("admin")),
):
    if customer_id == current_admin.id:
        raise HTTPException(
            status_code=409,
            detail="You cannot change the status of your own account",
        )

    customer = (
        db.query(User)
        .join(Role)
        .filter(User.id == customer_id, Role.name == "customer")
        .first()
    )

    if customer is None:
        raise HTTPException(status_code=404, detail="Customer not found")

    customer.status = payload.status
    db.commit()
    db.refresh(customer)
    return customer


class CustomerOrder(Base