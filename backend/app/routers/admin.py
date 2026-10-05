from datetime import datetime, time, timezone

from fastapi import APIRouter, Depends
from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.core.security import require_role
from app.database import get_db

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


# TODO (AUTH-06): protect this route with Madeeha's require_role("admin")
# once her auth module is merged, e.g. dependencies=[Depends(require_role("admin"))]
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
