from sqlalchemy.orm import Session

from app.models.order import Order
from app.models.payment import (
	Payment,
	PaymentMethod,
	PaymentStatus,
)


def save_payment_method(
	db: Session,
	order: Order,
	method: PaymentMethod,
) -> Payment:
	# Check whether a pending payment already exists.
	payment = (
		db.query(Payment)
		.filter(
			Payment.order_id == order.id,
			Payment.status == PaymentStatus.PENDING,
		)
		.first()
	)

	if payment:
		payment.method = method
		payment.amount = order.total_amount
	else:
		payment = Payment(
			order_id=order.id,
			method=method,
			status=PaymentStatus.PENDING,
			amount=order.total_amount,
		)
		db.add(payment)

	# Update the order's payment information.
	order.payment_method = method.value
	order.payment_status = PaymentStatus.PENDING.value

	db.flush()
	return payment
