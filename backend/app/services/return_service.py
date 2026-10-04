"""Return and refund workflow.

Customer requests a return -> admin approves or rejects -> product comes back -> refund.

    request_return   order DELIVERED -> RETURN_REQUESTED   return REQUESTED
    review_return    approve: order RETURN_APPROVED, return APPROVED
                     reject:  order back to DELIVERED,     return REJECTED
    mark_returned    order RETURNED, return RETURNED; if the order was paid, the refund starts:
                     order REFUND_PENDING, return REFUND_PENDING, refund_amount set
    complete_refund  order REFUNDED, return REFUNDED

Order status changes go through order_service.update_status(), so the rules, history and hooks (restock
on RETURNED, notifications) apply. Like order_service, nothing here commits.
"""
from datetime import datetime, timedelta
from decimal import Decimal
from typing import Dict, List, Optional, Tuple
from sqlalchemy.orm import Session

from app.models.order import Order, Return, ReturnItem, OrderStatus, PaymentStatus, ReturnStatus
from app.services.order_service import OrderNotFound, OrderServiceError, update_status, utcnow

RETURN_WINDOW_DAYS = 7


class ReturnNotAllowed(OrderServiceError):
    """The order or return is not in a state where this step is allowed."""


class ReturnWindowClosed(ReturnNotAllowed):
    """More than RETURN_WINDOW_DAYS have passed since delivery."""


class InvalidReturnItems(OrderServiceError):
    """The items chosen for the return do not match the order."""


def delivered_at(order: Order) -> Optional[datetime]:
    """When the order most recently entered DELIVERED, from its status history."""
    times = [h.changed_at for h in order.status_history
             if h.new_status == OrderStatus.DELIVERED.value and h.changed_at is not None]
    return max(times) if times else None


def return_deadline(order: Order) -> Optional[datetime]:
    """Last moment a return can be requested, or None if the order was never delivered."""
    delivered = delivered_at(order)
    return delivered + timedelta(days=RETURN_WINDOW_DAYS) if delivered else None


def can_request_return(order: Order, now: datetime = None) -> bool:
    """True if request_return would accept this order (ignoring who is asking and what items)."""
    deadline = return_deadline(order)
    return (order.status == OrderStatus.DELIVERED.value and not order.returns
            and deadline is not None and (now or utcnow()) <= deadline)


def _check_items(order: Order, items: List[Tuple[int, int]]) -> None:
    if not items:
        raise InvalidReturnItems("Choose at least one item to return")
    ordered: Dict[int, int] = {i.id: i.quantity for i in order.items}
    seen = set()
    for order_item_id, quantity in items:
        if order_item_id not in ordered:
            raise InvalidReturnItems(f"Item {order_item_id} is not part of order {order.order_number}")
        if order_item_id in seen:
            raise InvalidReturnItems(f"Item {order_item_id} is listed more than once")
        seen.add(order_item_id)
        if quantity <= 0 or quantity > ordered[order_item_id]:
            raise InvalidReturnItems(
                f"Return quantity for item {order_item_id} must be between 1 and {ordered[order_item_id]}")


def request_return(db: Session, order: Order, user_id: int, reason: str, items: List[Tuple[int, int]],
                   now: datetime = None) -> Return:
    """Customer return request. `items` is a list of (order_item_id, quantity).

    Only DELIVERED orders, within RETURN_WINDOW_DAYS of delivery, and only one return request per order:
    a rejected return cannot be requested again (the customer should contact support).
    """
    if order.user_id != user_id:
        raise OrderNotFound(f"Order {order.id} not found")
    if order.status != OrderStatus.DELIVERED.value:
        raise ReturnNotAllowed(f"Order {order.order_number} is {order.status}; only delivered orders can be returned")
    if order.returns:
        raise ReturnNotAllowed(f"Order {order.order_number} already has a return request")
    if not reason or not reason.strip():
        raise ReturnNotAllowed("A reason for the return is required")
    delivered = delivered_at(order)
    now = now or utcnow()
    if delivered is None or now - delivered > timedelta(days=RETURN_WINDOW_DAYS):
        raise ReturnWindowClosed(f"The {RETURN_WINDOW_DAYS}-day return window for order {order.order_number} has closed")
    _check_items(order, items)

    ret = Return(order_id=order.id, user_id=user_id, reason=reason.strip(), status=ReturnStatus.REQUESTED.value,
                 items=[ReturnItem(order_item_id=i, quantity=q) for i, q in items])
    order.returns.append(ret)
    db.flush()
    update_status(db, order, OrderStatus.RETURN_REQUESTED.value, changed_by=user_id, remarks=reason.strip())
    return ret


def review_return(db: Session, ret: Return, admin_id: int, approve: bool, remarks: str = None,
                  now: datetime = None) -> Return:
    if ret.status != ReturnStatus.REQUESTED.value:
        raise ReturnNotAllowed(f"Return {ret.id} is {ret.status}; only a requested return can be reviewed")
    ret.reviewed_by = admin_id
    ret.reviewed_at = now or utcnow()
    ret.admin_remarks = remarks
    if approve:
        ret.status = ReturnStatus.APPROVED.value
        update_status(db, ret.order, OrderStatus.RETURN_APPROVED.value, changed_by=admin_id, remarks=remarks)
    else:
        ret.status = ReturnStatus.REJECTED.value
        update_status(db, ret.order, OrderStatus.DELIVERED.value, changed_by=admin_id,
                      remarks=remarks or "Return rejected")
    db.flush()
    return ret


def refund_amount_for(ret: Return) -> Decimal:
    """Value of the returned items (price paid per unit x quantity). Shipping is not refunded."""
    by_id = {i.id: i for i in ret.order.items}
    return sum((by_id[ri.order_item_id].unit_price * ri.quantity for ri in ret.items), Decimal("0"))


def mark_returned(db: Session, ret: Return, admin_id: int) -> Return:
    """The product is back. Restocks (via hook) and, if the order was paid, starts the refund."""
    if ret.status != ReturnStatus.APPROVED.value:
        raise ReturnNotAllowed(f"Return {ret.id} is {ret.status}; only an approved return can be marked returned")
    order = ret.order
    update_status(db, order, OrderStatus.RETURNED.value, changed_by=admin_id, remarks="Product received back")
    ret.status = ReturnStatus.RETURNED.value
    if order.payment_status == PaymentStatus.SUCCESS.value:
        ret.refund_amount = refund_amount_for(ret)
        update_status(db, order, OrderStatus.REFUND_PENDING.value, changed_by=admin_id, remarks="Refund started")
        ret.status = ReturnStatus.REFUND_PENDING.value
    db.flush()
    return ret


def complete_refund(db: Session, ret: Return, admin_id: int) -> Return:
    if ret.status != ReturnStatus.REFUND_PENDING.value:
        raise ReturnNotAllowed(f"Return {ret.id} is {ret.status}; there is no pending refund to complete")
    update_status(db, ret.order, OrderStatus.REFUNDED.value, changed_by=admin_id, remarks="Refund completed")
    ret.status = ReturnStatus.REFUNDED.value
    db.flush()
    return ret
