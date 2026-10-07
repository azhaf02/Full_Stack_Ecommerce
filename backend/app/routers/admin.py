from datetime import date, datetime, time, timedelta, timezone
from math import ceil
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, ConfigDict, Field, model_validator
from pydantic.alias_generators import to_camel
from sqlalchemy import bindparam, func, or_, text
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.security import require_role
from app.models.address import Address
from app.schemas.order import OrderActions, OrderDetailOut
from app.services import order_service, return_service
from app.models.order import Order, OrderStatus
from app.models.payment import Payment, PaymentMethod, PaymentStatus
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



class CustomerOrder(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True, from_attributes=True)

    id: int
    order_number: str
    status: str
    total_amount: float
    created_at: datetime


class CustomerDetail(CustomerOut):
    orders_count: int
    total_spent: float
    recent_orders: list[CustomerOrder]


# ADM-03: one customer's profile with a summary of their orders
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
    # Cancelled and refunded orders do not count as money spent
    total_spent = sum(
        float(o.total_amount) for o in orders if o.status not in ("CANCELLED", "REFUNDED")
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



class OrderListParams(BaseModel):
    """Search and filter values for the admin order list. Pydantic rejects anything invalid."""

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
    # Escape % and _ so they are searched as normal characters, not wildcards
    escaped = value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
    return f"%{escaped}%"


# ADM-04: order list for admins with search, status/date filters and pagination
@router.get("/orders", response_model=AdminOrderList)
def list_orders(params: Annotated[OrderListParams, Query()], db: Session = Depends(get_db)):
    # orders.user_id has no foreign key yet, so join users by id.
    # Outer join keeps an order in the list even if its user row is missing.
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
        query = query.filter(Order.created_at >= datetime.combine(params.date_from, time.min))
    if params.date_to:
        # include the whole "to" day
        day_after = params.date_to + timedelta(days=1)
        query = query.filter(Order.created_at < datetime.combine(day_after, time.min))

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



class AdminOrderDetail(OrderDetailOut):
    """The order detail from the orders module, plus what the admin screen shows next to it."""

    customer_name: str
    customer_email: str | None = None
    shipping_address: str | None = None
    product_names: dict[int, str] = {}


def _format_address(address: Address | None) -> str | None:
    if address is None:
        return None
    parts = [
        address.full_name, address.line1, address.line2, address.city,
        f"{address.state} {address.postal_code}", address.country, address.phone,
    ]
    return ", ".join(part for part in parts if part)


# ADM-05: one order with its items, history and the statuses an admin may move it to
@router.get("/orders/{order_id}", response_model=AdminOrderDetail)
def get_order(order_id: int, db: Session = Depends(get_db)):
    order = db.get(Order, order_id)
    if order is None:
        raise HTTPException(status_code=404, detail=f"Order {order_id} not found")

    customer = db.get(User, order.user_id)
    address = db.get(Address, order.address_id)

    # Product names for the items table
    product_ids = sorted({item.product_id for item in order.items})
    product_names = {}
    if product_ids:
        rows = db.execute(
            text("SELECT id, name FROM products WHERE id IN :ids").bindparams(
                bindparam("ids", expanding=True)
            ),
            {"ids": product_ids},
        ).all()
        product_names = {row.id: row.name for row in rows}

    detail = OrderDetailOut.model_validate(order)
    detail.actions = OrderActions(
        can_cancel=order_service.can_customer_cancel(order),
        can_request_return=return_service.can_request_return(order),
        return_deadline=return_service.return_deadline(order),
        # the same list that PUT /api/admin/orders/{id}/status accepts
        allowed_next_statuses=order_service.admin_next_statuses(order),
    )

    return AdminOrderDetail(
        **detail.model_dump(),
        customer_name=customer.name if customer else "Unknown customer",
        customer_email=customer.email if customer else None,
        shipping_address=_format_address(address),
        product_names=product_names,
    )



class PaymentListParams(BaseModel):
    """Search and filter values for the admin payment list. Pydantic rejects anything invalid."""

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
    # Totals over ALL payments, not only the current page or filter
    collected_amount: float
    pending_cod_amount: float
    status_counts: dict[str, int]


def _enum_text(value) -> str:
    # payment.method and payment.status come back as enum members; send their text value
    return getattr(value, "value", value)


# ADM-06: payment records for admins (read only), with search, filters and pagination
@router.get("/payments", response_model=AdminPaymentList)
def list_payments(params: Annotated[PaymentListParams, Query()], db: Session = Depends(get_db)):
    # Outer joins keep a payment in the list even if its order or customer row is missing
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

    collected = (
        db.query(func.coalesce(func.sum(Payment.amount), 0))
        .filter(Payment.status == PaymentStatus.SUCCESS)
        .scalar()
    )
    pending_cod = (
        db.query(func.coalesce(func.sum(Payment.amount), 0))
        .filter(Payment.method == PaymentMethod.COD, Payment.status == PaymentStatus.PENDING)
        .scalar()
    )
    counts = db.query(Payment.status, func.count(Payment.id)).group_by(Payment.status).all()

    return {
        "items": items,
        "total": total,
        "page": params.page,
        "page_size": params.page_size,
        "total_pages": max(1, ceil(total / params.page_size)),
        "collected_amount": float(collected),
        "pending_cod_amount": float(pending_cod),
        "status_counts": {_enum_text(status): count for status, count in counts},
    }
