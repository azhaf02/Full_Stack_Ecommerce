
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.security import require_role
from app.database import get_db
from app.models.invoice import Invoice
from app.models.order import Order
from app.models.user import User

router = APIRouter(tags=["Invoices"])

customer_only = require_role("customer")


@router.get("/api/orders/{order_id}/invoice")
def get_order_invoice(
    order_id: int,
    user: User = Depends(customer_only),
    db: Session = Depends(get_db),
):
    # Customers can access only their own orders.
    order = (
        db.query(Order)
        .filter(
            Order.id == order_id,
            Order.user_id == user.id,
        )
        .first()
    )

    if order is None:
        raise HTTPException(
            status_code=404,
            detail="Order not found",
        )

    # Reuse an existing invoice if one was already generated.
    invoice = (
        db.query(Invoice)
        .filter(Invoice.order_id == order.id)
        .first()
    )

    if invoice is None:
        invoice = Invoice(
            order_id=order.id,
            invoice_number=f"INV-{order.id:08d}",
            amount=order.total_amount,
            tax=order.tax_amount or Decimal("0.00"),
        )

        try:
            db.add(invoice)
            db.commit()
            db.refresh(invoice)
        except IntegrityError:
            db.rollback()

            invoice = (
                db.query(Invoice)
                .filter(Invoice.order_id == order.id)
                .first()
            )

            if invoice is None:
                raise HTTPException(
                    status_code=409,
                    detail="Invoice generation conflict",
                )

    return {
        "invoice_id": invoice.id,
        "invoice_number": invoice.invoice_number,
        "issued_at": invoice.issued_at,
        "order_id": order.id,
        "order_number": order.order_number,
        "customer_id": order.user_id,
        "customer_name": user.name,
        "customer_email": user.email,
        "subtotal": order.subtotal,
        "discount_amount": order.discount_amount,
        "tax_amount": invoice.tax,
        "shipping_cost": order.shipping_cost,
        "total_amount": invoice.amount,
        "payment_method": order.payment_method,
        "payment_status": order.payment_status,
        "items": [
            {
                "product_id": item.product_id,
                "variant_id": item.variant_id,
                "quantity": item.quantity,
                "unit_price": item.unit_price,
                "line_total": item.unit_price * item.quantity,
            }
            for item in order.items
        ],
    }
