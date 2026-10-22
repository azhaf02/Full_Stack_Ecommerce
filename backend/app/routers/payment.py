from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.database import get_db
from app.models.checkout_session import CheckoutSession
from app.models.payment import (
    Payment,
    PaymentMethod as ModelPaymentMethod,
    PaymentStatus,
)
from app.models.user import User
from app.schemas.payment import (
    PaymentSelectionRequest,
    PaymentSelectionResponse,
    MockPaymentProcessRequest,
    MockPaymentProcessResponse,
    MockPaymentVerifyRequest,
    MockPaymentVerifyResponse,
    PaymentByOrderResponse,
    CODPaymentRequest,
    CODPaymentResponse,
)
from app.services.mock_gateway import (
    mock_gateway,
    MockGatewayResponse,
    MockGatewayStatus,
)
from app.services.order_service import (
    OrderNotFound,
    get_order_for_user,
    apply_payment_result,
)
from app.services.payment_service import save_payment_method


router = APIRouter(
    prefix="/api/payment",
    tags=["Payment"],
)


# =========================================================
# PAY-03: PAYMENT METHOD SELECTION
# =========================================================

@router.post(
    "/select-method",
    response_model=PaymentSelectionResponse,
)
def select_payment_method(
    data: PaymentSelectionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
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

    if checkout_session.customer_id != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Checkout session does not belong to current customer",
        )

    now = datetime.now(timezone.utc)
    expiry = checkout_session.expires_at

    if expiry.tzinfo is None:
        expiry = expiry.replace(tzinfo=timezone.utc)

    if checkout_session.status != "active" or expiry <= now:
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="Checkout session expired or inactive",
        )

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


# =========================================================
# MOCK ONLINE PAYMENT - PROCESS
# =========================================================

@router.post(
    "/mock/process",
    response_model=MockPaymentProcessResponse,
)
def process_mock_payment(
    data: MockPaymentProcessRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    payment = db.get(Payment, data.payment_id)

    if payment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found",
        )

    try:
        get_order_for_user(
            db,
            payment.order_id,
            current_user.id,
        )
    except OrderNotFound:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )

    if payment.method != ModelPaymentMethod.ONLINE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mock payment is only available for ONLINE payments",
        )

    if payment.status != PaymentStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Payment is not pending",
        )

    gateway_response = mock_gateway.process_payment(
        amount=payment.amount,
        simulate_failure=data.simulate_failure,
    )

    if gateway_response.status == MockGatewayStatus.SUCCESS:
        payment.transaction_id = (
            f"MOCK-SUCCESS-"
            f"{gateway_response.transaction_id.removeprefix('MOCK-')}"
        )
    else:
        payment.transaction_id = (
            f"MOCK-FAILED-"
            f"{gateway_response.transaction_id.removeprefix('MOCK-')}"
        )

    try:
        db.commit()
        db.refresh(payment)
    except Exception:
        db.rollback()
        raise

    return MockPaymentProcessResponse(
        payment_id=payment.id,
        transaction_id=payment.transaction_id,
        gateway_status=gateway_response.status.value,
        message="Mock payment processed. Backend verification is required.",
    )


# =========================================================
# MOCK ONLINE PAYMENT - VERIFY
# =========================================================

@router.post(
    "/mock/verify",
    response_model=MockPaymentVerifyResponse,
)
def verify_mock_payment(
    data: MockPaymentVerifyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    payment = db.get(Payment, data.payment_id)

    if payment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found",
        )

    try:
        order = get_order_for_user(
            db,
            payment.order_id,
            current_user.id,
        )
    except OrderNotFound:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )

    if payment.method != ModelPaymentMethod.ONLINE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification is only available for ONLINE payments",
        )

    if payment.status != PaymentStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Payment is not pending",
        )

    if not payment.transaction_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment has not been processed by the mock gateway",
        )

    if data.transaction_id != payment.transaction_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid transaction ID",
        )

    if payment.transaction_id.startswith("MOCK-SUCCESS-"):
        gateway_status = MockGatewayStatus.SUCCESS
    elif payment.transaction_id.startswith("MOCK-FAILED-"):
        gateway_status = MockGatewayStatus.FAILED
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid mock gateway transaction",
        )

    gateway_response = MockGatewayResponse(
        transaction_id=payment.transaction_id,
        status=gateway_status,
    )

    verified = mock_gateway.verify_payment(gateway_response)

    if verified:
        payment.status = PaymentStatus.SUCCESS
        final_status = PaymentStatus.SUCCESS
        message = "Mock payment verified successfully"
    else:
        payment.status = PaymentStatus.FAILED
        final_status = PaymentStatus.FAILED
        message = "Mock payment verification failed"

    try:
        apply_payment_result(
            db,
            order,
            final_status.value,
            changed_by=current_user.id,
        )

        db.commit()
        db.refresh(payment)

    except Exception:
        db.rollback()
        raise

    return MockPaymentVerifyResponse(
        payment_id=payment.id,
        transaction_id=payment.transaction_id,
        status=payment.status.value,
        message=message,
    )


# =========================================================
# GET CURRENT CUSTOMER PAYMENT BY ORDER
# =========================================================

@router.get(
    "/order/{order_id}",
    response_model=PaymentByOrderResponse,
)
def get_payment_by_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        order = get_order_for_user(
            db,
            order_id,
            current_user.id,
        )
    except OrderNotFound:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )

    payment = (
        db.query(Payment)
        .filter(Payment.order_id == order.id)
        .order_by(Payment.id.desc())
        .first()
    )

    if payment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found for this order",
        )

    return PaymentByOrderResponse(
        payment_id=payment.id,
        order_id=payment.order_id,
        method=payment.method.value,
        status=payment.status.value,
        transaction_id=payment.transaction_id,
    )


# =========================================================
# PAY-05: CASH ON DELIVERY
# =========================================================

@router.post(
    "/cod",
    response_model=CODPaymentResponse,
)
def confirm_cod_payment(
    data: CODPaymentRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    payment = db.get(Payment, data.payment_id)

    if payment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found",
        )

    try:
        order = get_order_for_user(
            db,
            payment.order_id,
            current_user.id,
        )
    except OrderNotFound:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found",
        )

    if payment.method != ModelPaymentMethod.COD:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="COD endpoint is only available for COD payments",
        )

    if payment.status != PaymentStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="COD payment must be pending",
        )

    # COD is not paid during checkout.
    # Payment remains PENDING until payment is collected
    # and an authorized admin records it as paid.
    payment.status = PaymentStatus.PENDING
    order.payment_method = ModelPaymentMethod.COD.value
    order.payment_status = PaymentStatus.PENDING.value

    try:
        db.commit()
        db.refresh(payment)
    except Exception:
        db.rollback()
        raise

    return CODPaymentResponse(
        payment_id=payment.id,
        order_id=order.id,
        method="COD",
        status=payment.status.value,
        message="Cash on Delivery confirmed. Payment remains pending until collection.",
    )