from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.database import get_db
from app.models.checkout_session import CheckoutSession
from app.models.payment import PaymentMethod as ModelPaymentMethod
from app.models.user import User
from app.schemas.payment import (
    PaymentSelectionRequest,
    PaymentSelectionResponse,
)
from app.services.order_service import OrderNotFound, get_order_for_user
from app.services.payment_service import save_payment_method


router = APIRouter(
    prefix="/api/payment",
    tags=["Payment"],
)


@router.post(
    "/select-method",
    response_model=PaymentSelectionResponse,
)
def select_payment_method(
    data: PaymentSelectionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Validate checkout session
    checkout_session = (
        db.query(CheckoutSession)
        .filter(
            CheckoutSession.session_id == str(data.checkout_session_id)
        )
        .first()
    )

    if checkout_session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Checkout session not found",
        )

    # Verify checkout session belongs to current customer
    if checkout_session.customer_id != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Checkout session does not belong to current customer",
        )

    # Validate session status and expiry
    now = datetime.now(timezone.utc)
    expiry = checkout_session.expires_at

    if expiry.tzinfo is None:
        expiry = expiry.replace(tzinfo=timezone.utc)

    if checkout_session.status != "active" or expiry <= now:
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="Checkout session expired or inactive",
        )

    # Verify order belongs to current customer
    try:
        order = get_order_for_user(
            db,
            data.order_id,
            current_user.id,
        )
    except OrderNotFound:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )

    # Save selected payment method.
    # Payment remains PENDING until actual verification.
    model_method = ModelPaymentMethod(data.method.value)

    try:
        payment = save_payment_method(
            db,
            order,
            model_method,
        )

        db.commit()
        db.refresh(payment)

    except Exception:
        db.rollback()
        raise

    return PaymentSelectionResponse(
        payment_id=payment.id,
        order_id=order.id,
        method=data.method,
        status=payment.status.value,
        message="Payment method selected successfully",
    )