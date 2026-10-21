"""Order endpoints: a customer's orders, cancellation and returns, and the admin status and returns screens.

The routes only check who is asking and translate errors; the rules live in services/order_service.py and
return_service.py. A route commits once at the end, so a status change and everything hooked onto it
(stock, notifications) succeed or fail together.

POST /api/orders prices the order on the server (services/order_pricing.py); the browser never sends a price.
When Safiya's checkout session exists, only order_pricing.price_order() needs to change.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.security import require_role
from app.database import get_db
from app.models.order import Order, OrderStatus, Return, ReturnStatus
from app.models.address import Address
from app.models.user import User
from app.schemas.order import (
    AddressBrief, AdminOrderDetailOut, CancelRequest, CustomerBrief, OrderActions, OrderCreate, OrderDetailOut,
    OrderSummaryOut, ReturnOut, ReturnRequest, ReturnReview, StatusUpdate,
)
from app.services import order_pricing, order_service, return_service
from app.services.order_service import OrderServiceError

router = APIRouter(tags=["Orders"])

customer_only = require_role("customer")
admin_only = require_role("admin")

# Most specific first: ReturnWindowClosed is a ReturnNotAllowed, which is an OrderServiceError.
_ERROR_STATUS = [
    (order_service.OrderNotFound, status.HTTP_404_NOT_FOUND),
    (order_service.UnknownStatus, 422),
    (order_service.InvalidOrder, 422),
    (return_service.InvalidReturnItems, 422),
    (OrderServiceError, status.HTTP_409_CONFLICT),
]



def _http_error(exc: OrderServiceError) -> HTTPException:
    for error_type, code in _ERROR_STATUS:
        if isinstance(exc, error_type):
            return HTTPException(status_code=code, detail=str(exc))
    return HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc))


def _run(db: Session, action):
    """Run `action()`, commit, and turn a rule violation into an HTTP error (rolling everything back)."""
    try:
        result = action()
        db.commit()
        return result
    except OrderServiceError as exc:
        db.rollback()
        raise _http_error(exc)
    except Exception:
        db.rollback()
        raise


def _detail(order: Order, for_admin: bool = False, db: Session = None) -> OrderDetailOut:
    out = (AdminOrderDetailOut if for_admin else OrderDetailOut).model_validate(order)
    out.actions = OrderActions(
        can_cancel=order_service.can_customer_cancel(order),
        can_request_return=return_service.can_request_return(order),
        return_deadline=return_service.return_deadline(order),
        # Only the admin screens need this; it is what PUT /api/admin/orders/{id}/status will accept.
        allowed_next_statuses=order_service.admin_next_statuses(order) if for_admin else None,
    )
    if for_admin and db is not None:
        customer = db.get(User, order.user_id)
        address = db.get(Address, order.address_id)
        out.customer = CustomerBrief.model_validate(customer) if customer else None
        out.address = AddressBrief.model_validate(address) if address else None
    return out


def _load_return(db: Session, return_id: int) -> Return:
    ret = db.get(Return, return_id)
    if ret is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Return {return_id} not found")
    return ret


# ---------------------------------------------------------------- customer

@router.post("/api/orders", response_model=OrderDetailOut, status_code=status.HTTP_201_CREATED)
def place_order(data: OrderCreate, user: User = Depends(customer_only), db: Session = Depends(get_db)):
    """Place an order. A COD order comes back CONFIRMED; an online order comes back PLACED and is confirmed
    when the payment module reports a verified SUCCESS."""
    def action():
        request = order_pricing.OrderRequest(
            address_id=data.address_id, shipping_method_id=data.shipping_method_id,
            payment_method=data.payment_method,
            items=[order_pricing.OrderLine(product_id=i.product_id, variant_id=i.variant_id, quantity=i.quantity)
                   for i in data.items])
        return order_service.create_order(db, order_pricing.price_order(db, user.id, request))
    return _detail(_run(db, action))


@router.get("/api/account/orders", response_model=List[OrderSummaryOut])
def my_orders(page: int = Query(1, ge=1), page_size: int = Query(10, ge=1, le=100),
              user: User = Depends(customer_only), db: Session = Depends(get_db)):
    return order_service.list_orders_for_user(db, user.id, page, page_size)


@router.get("/api/account/orders/{order_id}", response_model=OrderDetailOut)
def my_order(order_id: int, user: User = Depends(customer_only), db: Session = Depends(get_db)):
    try:
        return _detail(order_service.get_order_for_user(db, order_id, user.id))
    except OrderServiceError as exc:
        raise _http_error(exc)


@router.post("/api/account/orders/{order_id}/cancel", response_model=OrderDetailOut)
def cancel_my_order(order_id: int, data: CancelRequest = None,
                    user: User = Depends(customer_only), db: Session = Depends(get_db)):
    def action():
        order = order_service.get_order_for_user(db, order_id, user.id)
        order_service.cancel_order(db, order, user.id, reason=data.reason if data else None)
        return order
    return _detail(_run(db, action))


@router.post("/api/account/orders/{order_id}/return", response_model=ReturnOut, status_code=status.HTTP_201_CREATED)
def request_my_return(order_id: int, data: ReturnRequest,
                      user: User = Depends(customer_only), db: Session = Depends(get_db)):
    def action():
        order = order_service.get_order_for_user(db, order_id, user.id)
        return return_service.request_return(
            db, order, user.id, data.reason, [(i.order_item_id, i.quantity) for i in data.items])
    return _run(db, action)


# ---------------------------------------------------------------- admin

@router.get("/api/admin/orders/{order_id}", response_model=AdminOrderDetailOut)
def admin_get_order(order_id: int, admin: User = Depends(admin_only), db: Session = Depends(get_db)):
    """One order for the admin page: items, status history, returns, the customer, the shipping address, and
    `actions.allowed_next_statuses` for the status dropdown."""
    order = db.get(Order, order_id)
    if order is None:
        raise _http_error(order_service.OrderNotFound(f"Order {order_id} not found"))
    return _detail(order, for_admin=True, db=db)


@router.put("/api/admin/orders/{order_id}/status", response_model=AdminOrderDetailOut)
def admin_update_status(order_id: int, data: StatusUpdate,
                        admin: User = Depends(admin_only), db: Session = Depends(get_db)):
    def action():
        order = db.get(Order, order_id)
        if order is None:
            raise order_service.OrderNotFound(f"Order {order_id} not found")
        if order_service.admin_status_is_blocked(order, data.status):
            raise order_service.OrderServiceError(
                "This step belongs to the returns workflow; use PUT /api/admin/returns/{id}")
        return order_service.update_status(db, order, data.status, changed_by=admin.id, remarks=data.remarks)
    return _detail(_run(db, action), for_admin=True, db=db)


@router.get("/api/admin/returns", response_model=List[ReturnOut])
def admin_list_returns(status_filter: Optional[str] = Query(None, alias="status"),
                       page: int = Query(1, ge=1), page_size: int = Query(20, ge=1, le=100),
                       admin: User = Depends(admin_only), db: Session = Depends(get_db)):
    query = db.query(Return)
    if status_filter is not None:
        if status_filter not in {s.value for s in ReturnStatus}:
            raise HTTPException(status_code=422,
                                detail=f"'{status_filter}' is not a valid return status")
        query = query.filter(Return.status == status_filter)
    return (query.order_by(Return.requested_at.desc(), Return.id.desc())
            .offset((page - 1) * page_size).limit(page_size).all())


@router.put("/api/admin/returns/{return_id}", response_model=ReturnOut)
def admin_review_return(return_id: int, data: ReturnReview,
                        admin: User = Depends(admin_only), db: Session = Depends(get_db)):
    def action():
        ret = _load_return(db, return_id)
        if data.action == "approve":
            return return_service.review_return(db, ret, admin.id, approve=True, remarks=data.remarks)
        if data.action == "reject":
            return return_service.review_return(db, ret, admin.id, approve=False, remarks=data.remarks)
        if data.action == "mark_returned":
            return return_service.mark_returned(db, ret, admin.id)
        return return_service.complete_refund(db, ret, admin.id)
    return _run(db, action)
