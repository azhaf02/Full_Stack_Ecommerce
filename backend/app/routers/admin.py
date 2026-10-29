
from datetime import date, datetime, time, timedelta, timezone
from math import ceil
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, ConfigDict, Field, model_validator
from pydantic.alias_generators import to_camel
from sqlalchemy import func, or_, text
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

    # Real stock is kept in the inventory module; each item has its own threshold.
    # Out-of-stock items (quantity 0) count as low stock too. Same rule as the analytics API.
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


class CustomerOrder(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )

    id: int
    order_number: str
    status: str
    total_amount: float
    created_at: datetime


class CustomerDetail(CustomerOut):
    orders_count: int
    total_spent: float
    recent_orders: list[CustomerOrder]


@router.get("/customers/{customer_id}", response_model=CustomerDetail)
def get_customer(customer_id: int, db: Session = Depends(get_db)):
    customer = (
        db.query(User)
        .join(Role)
        .filter(User.id == customer_id, Role.name == "customer")
        .first()
    )

    if customer is None:
        raise HTTPException(status_code=404, detail="Customer not found")

    orders = (
        db.query(Order)
        .filter(Order.user_id == customer_id)
        .order_by(Order.created_at.desc())
        .all()
    )

    total_spent = sum(
        float(order.total_amount)
        for order in orders
        if order.status not in ("CANCELLED", "REFUNDED")
    )

    return {
        "id": customer.id,
        "name": customer.name,
        "email": customer.email,
        "status": customer.status,
        "created_at": customer.created_at,
        "orders_count": len(orders),
        "total_spent": total_spent,
        "recent_orders": orders[:5],
    }


# ============================================================
# ORDER MANAGEMENT — ADM-04 / ADM-05
# ============================================================

class OrderListParams(BaseModel):
    """Search and filter values for the admin order list."""

    model_config = ConfigDict(extra="forbid")

    q: str = Field("", max_length=100)
    status: OrderStatus | None = None
    date_from: date | None = None
    date_to: date | None = None
    page: int = Field(1, ge=1)
    page_size: int = Field(10, ge=1, le=50)

    @model_validator(mode="after")
    def check_date_range(self):
        if self.date_from and self.date_to and self.date_from > self.date_to:
            raise ValueError("date_from cannot be after date_to")
        return self


class AdminOrderRow(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    id: int
    order_number: str
    customer_name: str
    status: str
    payment_method: str
    total_amount: float
    created_at: datetime


class AdminOrderList(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    items: list[AdminOrderRow]
    total: int
    page: int
    page_size: int
    total_pages: int


def _like_pattern(value: str) -> str:
    escaped = value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
    return f"%{escaped}%"


@router.get("/orders", response_model=AdminOrderList)
def list_orders(
    params: Annotated[OrderListParams, Query()],
    db: Session = Depends(get_db),
):
    query = db.query(Order, User.name).outerjoin(User, User.id == Order.user_id)

    search = params.q.strip()
    if search:
        pattern = _like_pattern(search)
        query = query.filter(
            or_(
                Order.order_number.ilike(pattern, escape="\\"),
                User.name.ilike(pattern, escape="\\"),
            )
        )

    if params.status:
        query = query.filter(Order.status == params.status.value)

    if params.date_from:
        query = query.filter(
            Order.created_at >= datetime.combine(params.date_from, time.min)
        )

    if params.date_to:
        day_after = params.date_to + timedelta(days=1)
        query = query.filter(
            Order.created_at < datetime.combine(day_after, time.min)
        )

    total = query.count()

    rows = (
        query.order_by(Order.created_at.desc(), Order.id.desc())
        .offset((params.page - 1) * params.page_size)
        .limit(params.page_size)
        .all()
    )

    items = [
        {
            "id": order.id,
            "order_number": order.order_number,
            "customer_name": name or "Unknown customer",
            "status": order.status,
            "payment_method": order.payment_method,
            "total_amount": float(order.total_amount),
            "created_at": order.created_at,
        }
        for order, name in rows
    ]

    return {
        "items": items,
        "total": total,
        "page": params.page,
        "page_size": params.page_size,
        "total_pages": max(1, ceil(total / params.page_size)),
    }


# The admin order detail (GET /api/admin/orders/{id}) and status change
# (PUT /api/admin/orders/{id}/status) live in the orders module (routers/orders.py).


# ============================================================
# PAYMENT MANAGEMENT — ADM-06
# ============================================================

class PaymentListParams(BaseModel):
    """Search and filter values for the admin payment list."""

    model_config = ConfigDict(extra="forbid")

    q: str = Field("", max_length=100)
    status: PaymentStatus | None = None
    method: PaymentMethod | None = None
    page: int = Field(1, ge=1)
    page_size: int = Field(10, ge=1, le=50)


class AdminPaymentRow(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    id: int
    order_id: int
    order_number: str
    customer_name: str
    method: str
    status: str
    transaction_id: str | None = None
    amount: float
    created_at: datetime


class AdminPaymentList(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)

    items: list[AdminPaymentRow]
    total: int
    page: int
    page_size: int
    total_pages: int
    collected_amount: float  # paid orders (orders.payment_status SUCCESS)
    collected_count: int
    status_counts: dict[str, int]
    # Unpaid orders from the orders table, per method: {"COD": {"count", "amount"}, "ONLINE": {...}}
    awaiting_payment: dict[str, dict[str, float]]


def _enum_text(value) -> str:
    return getattr(value, "value", value)


@router.get("/payments", response_model=AdminPaymentList)
def list_payments(
    params: Annotated[PaymentListParams, Query()],
    db: Session = Depends(get_db),
):
    query = (
        db.query(Payment, Order.order_number, User.name)
        .outerjoin(Order, Order.id == Payment.order_id)
        .outerjoin(User, User.id == Order.user_id)
    )

    search = params.q.strip()
    if search:
        pattern = _like_pattern(search)
        query = query.filter(
            or_(
                Order.order_number.ilike(pattern, escape="\\"),
                User.name.ilike(pattern, escape="\\"),
                Payment.transaction_id.ilike(pattern, escape="\\"),
            )
        )

    if params.status:
        query = query.filter(Payment.status == params.status)

    if params.method:
        query = query.filter(Payment.method == params.method)

    total = query.count()

    rows = (
        query.order_by(Payment.created_at.desc(), Payment.id.desc())
        .offset((params.page - 1) * params.page_size)
        .limit(params.page_size)
        .all()
    )

    items = [
        {
            "id": payment.id,
            "order_id": payment.order_id,
            "order_number": order_number or f"Order #{payment.order_id}",
            "customer_name": name or "Unknown customer",
            "method": _enum_text(payment.method),
            "status": _enum_text(payment.status),
            "transaction_id": payment.transaction_id,
            "amount": float(payment.amount),
            "created_at": payment.created_at,
        }
        for payment, order_number, name in rows
    ]

    # Money received, read from the orders table (same source as "awaiting" below),
    # so paid orders without a payments row are counted too. Refunded orders have
    # payment_status REFUNDED, so they drop out automatically.
    collected_count, collected = (
        db.query(func.count(Order.id), func.coalesce(func.sum(Order.total_amount), 0))
        .filter(Order.payment_status == "SUCCESS")
        .one()
    )

    counts = (
        db.query(Payment.status, func.count(Payment.id))
        .group_by(Payment.status)
        .all()
    )

    # Unpaid orders, read from the orders table. Older orders have no payments row,
    # so the payments table alone would miss them. Cancelled, returned and
    # refunded orders are left out: there is nothing to collect for them.
    awaiting_rows = (
        db.query(Order.payment_method, func.count(Order.id), func.coalesce(func.sum(Order.total_amount), 0))
        .filter(
            Order.payment_status == "PENDING",
            Order.status.notin_(["CANCELLED", "RETURNED", "REFUND_PENDING", "REFUNDED"]),
        )
        .group_by(Order.payment_method)
        .all()
    )
    awaiting = {"COD": {"count": 0, "amount": 0.0}, "ONLINE": {"count": 0, "amount": 0.0}}
    for method, count, amount in awaiting_rows:
        awaiting[_enum_text(method)] = {"count": count, "amount": float(amount)}

    return {
        "items": items,
        "total": total,
        "page": params.page,
        "page_size": params.page_size,
        "total_pages": max(1, ceil(total / params.page_size)),
        "collected_amount": float(collected),
        "collected_count": collected_count,
        "awaiting_payment": awaiting,
        "status_counts": {
            _enum_text(status): count for status, count in counts
        },
    }


# ============================================================
# USER ROLE MANAGEMENT — ADM-07
# ============================================================

class AdminRoleUserOut(BaseModel):
    """User information returned to the admin roles screen."""

    id: int
    name: str
    email: str
    role: str
    status: str


class UserRoleUpdate(BaseModel):
    """Only the two roles supported by this project's role system."""

    role: Literal["admin", "customer"]


# GET /api/admin/users
# List users and their current roles.
@router.get("/users", response_model=list[AdminRoleUserOut])
def list_users_for_role_management(db: Session = Depends(get_db)):
    users = (
        db.query(User)
        .join(Role, User.role_id == Role.id)
        .order_by(User.name.asc())
        .all()
    )

    return [
        AdminRoleUserOut(
            id=user.id,
            name=user.name,
            email=user.email,
            role=user.role.name.upper(),
            status=user.status,
        )
        for user in users
    ]


# PUT /api/admin/users/{user_id}/role
# Promote a customer to admin or demote an admin to customer.
@router.put("/users/{user_id}/role", response_model=AdminRoleUserOut)
def update_user_role(
    user_id: int,
    payload: UserRoleUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_role("admin")),
):
    user = db.query(User).filter(User.id == user_id).first()

    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    target_role = (
        db.query(Role)
        .filter(Role.name == payload.role)
        .first()
    )

    if target_role is None:
        raise HTTPException(
            status_code=500,
            detail=f"Role '{payload.role}' is missing from the roles table",
        )

    old_role = user.role.name.lower()

    if old_role == payload.role:
        raise HTTPException(
            status_code=409,
            detail="User already has this role",
        )

    # Do not allow the logged-in admin to demote themselves.
    if user.id == current_admin.id and payload.role == "customer":
        raise HTTPException(
            status_code=409,
            detail="You cannot demote your own account",
        )

    # Do not allow demotion of the last remaining admin.
    if old_role == "admin" and payload.role == "customer":
        admin_count = (
            db.query(User)
            .join(Role, User.role_id == Role.id)
            .filter(Role.name == "admin")
            .count()
        )

        if admin_count <= 1:
            raise HTTPException(
                status_code=409,
                detail="At least one admin must remain",
            )

    try:
        user.role = target_role

        audit_entry = AuditLog(
            actor_id=current_admin.id,
            action="USER_ROLE_CHANGED",
            entity_type="user",
            entity_id=user.id,
            details=(
                f"Role changed from {old_role} to {payload.role}"
            ),
        )

        db.add(audit_entry)
        db.commit()
        db.refresh(user)

    except Exception:
        db.rollback()
        raise

    return AdminRoleUserOut(
        id=user.id,
        name=user.name,
        email=user.email,
        role=user.role.name.upper(),
        status=user.status,
    )


# ============================================================
# REVIEW DELETE — ADM-08
# ============================================================

# DELETE /api/admin/reviews/{review_id}
# Permanently removes a review (e.g. spam or personal details).
# Approve / reject come from the reviews module.
@router.delete("/reviews/{review_id}", status_code=204)
def delete_review(
    review_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_role("admin")),
):
    review = db.query(Review).filter(Review.id == review_id).first()

    if not review:
        raise HTTPException(status_code=404, detail="Review not found.")

    try:
        db.add(
            AuditLog(
                actor_id=current_admin.id,
                action="REVIEW_DELETED",
                entity_type="review",
                entity_id=review.id,
                details=(
                    f"Deleted {review.rating}-star review on product "
                    f"{review.product_id} by user {review.user_id}"
                ),
            )
        )
        db.delete(review)
        db.commit()

    except Exception:
        db.rollback()
        raise
