"""Tells the customer when their order changes status (checkpoint 5, with Aliza's notifications).

Registered in app/main.py with order_service.register_status_hook(). It adds one row to `notifications`
(type "order_status", the type Aliza's dashboard already uses) in the same transaction as the status change.

It writes the row itself instead of calling NotificationService.create_notification(), because that helper
commits, and a hook must not commit in the middle of an order. A notification problem never blocks the order:
the insert runs in a savepoint and any error is logged and ignored.
"""
import logging

from sqlalchemy.orm import Session

from app.models.notification import Notification
from app.models.order import Order

logger = logging.getLogger(__name__)

NOTIFICATION_TYPE = "order_status"

# Wording agreed with Aliza. Statuses not listed here send nothing.
TEMPLATES = {
    "CONFIRMED": "Your order #{n} has been confirmed.",
    "SHIPPED": "Your order #{n} has been shipped and is on the way!",
    "OUT_FOR_DELIVERY": "Your order #{n} is out for delivery today.",
    "DELIVERED": "Your order #{n} has been delivered. Enjoy your purchase!",
    "CANCELLED": "Your order #{n} has been cancelled.",
    "REFUNDED": "Refund for order #{n} has been processed.",
}


def order_message(order: Order, new_status: str):
    template = TEMPLATES.get(new_status)
    return template.format(n=order.order_number) if template else None


def on_order_notification(db: Session, order: Order, previous_status: str, new_status: str) -> None:
    message = order_message(order, new_status)
    if message is None:
        return
    try:
        with db.begin_nested():
            db.add(Notification(user_id=order.user_id, type=NOTIFICATION_TYPE, message=message, is_read=False))
    except Exception:  # never let a notification problem stop an order
        logger.warning("Could not save the %s notification for order %s", new_status, order.id, exc_info=True)
