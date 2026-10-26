"""Keeps a Cash on Delivery order's payment in step with its delivery.

Registered in app/main.py with order_service.register_status_hook(). It runs inside update_status(), in the
same transaction as the status change, so a failure rolls both back.

  * CONFIRMED (COD): make sure the order has a payments row (PENDING). Aaliya's mark-paid route needs one.
  * DELIVERED (COD): the courier has collected the cash, so the payment row and the order's payment_status
    both become SUCCESS. This also repairs older COD orders that never got a payments row.

Online orders are not touched here; their payment is confirmed by the payment module (apply_payment_result).
"""
from sqlalchemy.orm import Session

from app.models.order import Order, OrderStatus, PaymentMethod as OrderPaymentMethod, PaymentStatus as OrderPaymentStatus
from app.models.payment import Payment, PaymentMethod, PaymentStatus


def _value(x) -> str:
    return getattr(x, "value", x)


def on_cod_order_change(db: Session, order: Order, previous_status: str, new_status: str) -> None:
    if _value(order.payment_method) != OrderPaymentMethod.COD.value:
        return
    if new_status not in (OrderStatus.CONFIRMED.value, OrderStatus.DELIVERED.value):
        return

    payment = (db.query(Payment)
               .filter(Payment.order_id == order.id, Payment.method == PaymentMethod.COD)
               .order_by(Payment.id.desc()).first())
    if payment is None:
        payment = Payment(order_id=order.id, method=PaymentMethod.COD, status=PaymentStatus.PENDING,
                          amount=order.total_amount)
        db.add(payment)

    if (new_status == OrderStatus.DELIVERED.value and payment.status == PaymentStatus.PENDING
            and order.payment_status == OrderPaymentStatus.PENDING.value):
        payment.status = PaymentStatus.SUCCESS
        order.payment_status = OrderPaymentStatus.SUCCESS.value
    db.flush()


def backfill_cod_payments(db: Session) -> list:
    """One-off repair for COD orders created before the hook was running (or by a server that had not been
    updated): give each COD order that has no payments row one, in the state the order implies. Does not
    commit. Returns [(order_id, payment_status)] for the rows it created."""
    created = []
    orders = (db.query(Order)
              .filter(Order.payment_method == OrderPaymentMethod.COD.value)
              .filter(~db.query(Payment.id).filter(Payment.order_id == Order.id).exists())
              .order_by(Order.id).all())
    for order in orders:
        status = PaymentStatus(order.payment_status)
        if order.payment_status == OrderPaymentStatus.PENDING.value:
            if order.status == OrderStatus.DELIVERED.value:
                status = PaymentStatus.SUCCESS
                order.payment_status = OrderPaymentStatus.SUCCESS.value
            elif order.status == OrderStatus.CANCELLED.value:
                status = PaymentStatus.CANCELLED
                order.payment_status = OrderPaymentStatus.CANCELLED.value
        db.add(Payment(order_id=order.id, method=PaymentMethod.COD, status=status, amount=order.total_amount))
        created.append((order.id, status.value))
    db.flush()
    return created
