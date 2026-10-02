from datetime import datetime, time, timezone
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel
from sqlalchemy import or_, text
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.security import require_role
from app.models.role import Role
from app.models.user import User

router = APIRouter(
    prefix="/api/admin",
    tags=["Admin"],
    dependencies=[Depends(require_role("admin"))],
)

# A product counts as "low stock" at or below this quantity
LOW_STOCK_THRESHOLD = 10


class DashboardKpis(BaseModel):
    # Python uses snake_case, the JSON sent to React uses camelCase (totalRevenue)
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    total_revenue: float
    orders_today: int
    pending_orders: int
    low_stock_count: int


class DashboardSummary(BaseModel):
    kpis: DashboardKpis



@router.get("/dashboard-summary", response_model=DashboardSummary)
def dashboard_summary(db: Session = Depends(get_db)):
    start_of_today = datetime.combine(datetime.now(timezone.utc).date(), time.min)

    # Money from every order that was not cancelled or refunded
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

    # Orders the store still has to pack and ship
    pending_orders = db.execute(
        text(
            "SELECT COUNT(*) FROM orders "
            "WHERE status IN ('PLACED', 'CONFIRMED', 'PROCESSING')"
        )
    ).scalar()

    low_stock_count = db.execute(
        text("SELECT COUNT(*) FROM products WHERE stock_quantity <= :limit"),
        {"limit": LOW_STOCK_THRESHOLD},
    ).scalar()

    return DashboardSummary(
        kpis=DashboardKpis(
            total_revenue=float(total_revenue),
            orders_today=orders_today,
            pending_orders=pending_orders,
            low_stock_count=low_stock_count,
        )
    )


class CustomerOut(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, from_attributes=True)

    id: int
    name: str
    email: str
    status: str
    created_at: datetime | None = None


class CustomerList(BaseModel):
    items: list[CustomerOut]
    total: int


# ADM-03: list customers, with optional search by name or email
@router.get("/customers", response_model=CustomerList)
def list_customers(q: str = "", db: Session = Depends(get_db)):
    query = db.query(User).join(Role).filter(Role.name == "customer")

    search = q.strip()
    if search:
        pattern = f"%{search}%"
        # ilike = case-insensitive match, so "sara" also finds "Sara"
        query = query.filter(or_(User.name.ilike(pattern), User.email.ilike(pattern)))

    customers = query.order_by(User.created_at.desc()).all()
    return {"items": customers, "total": len(customers)}



class CustomerStatusUpdate(BaseModel):
    status: Literal["active", "inactive"]


# ADM-03: activate or deactivate a customer account
@router.put("/customers/{customer_id}/status", response_model=CustomerOut)
def update_customer_status(
    customer_id: int,
    payload: CustomerStatusUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_role("admin")),
):
    # An admin must not lock themselves out
    if customer_id == current_admin.id:
        raise HTTPException(status_code=409, detail="You cannot change the status of your own account")

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
