"""Keeps an order's payment in step with its status changes.

Registered in app/main.py with order_service.register_status_hook(). It runs inside update_status(), in the
same transaction as the status change, so a failure rolls both back.

  * CONFIRMED (COD): make sure the order has a payments row (PENDING). Aaliya's mark-paid route needs one.
  * DELIVERED (COD): the courier has collected the cash, so the payment row and the order's payment_status
    both become SUCCESS. This also repairs older COD orders that never got a payments row.
  * CANCELLED (COD or online): a payment that is still PENDING (nothing was paid) becomes CANCELLED, on the
    payments row and on orders.payment_status, so it is no longer counted as money still to come. A payment
    that already SUCCEEDED is left alone; cancel_order() moves it on through REFUND_PENDING and REFUNDED.

Online payments are otherwise confirmed by the payment module (apply_payment_result). The function keeps its
original name, on_cod_order_change, because app/main.py registers it by that name.
"""
from sqlalchemy.orm import Session

from app.models.order import Order, OrderStatus, PaymentMethod as OrderPaymentMethod, PaymentStatus as OrderPaymentStatus
from app.models.payment import Payment, PaymentMethod, PaymentStatus


def _value(x) -> str:
    return getattr(x, "value", x)


def _cancel_unpaid(db: Session, order: Order) -> None:
    for payment in db.query(Payment).filter(Payment.order_id == order.id,
                                            Payment.status == PaymentStatus.PENDING).all():
        payment.status = PaymentStatus.CANCELLED
    if order.payment_status == OrderPaymentStatus.PENDING.value:
        order.payment_status = OrderPaymentStatus.CANCELLED.value
    db.flush()


def on_cod_order_change(db: Session, order: Order, previous_status: str, new_status: str) -> None:
    if new_status == OrderStatus.CANCELLED.value:
        _cancel_unpaid(db, order)
        return

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
