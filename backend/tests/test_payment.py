import pytest
from pydantic import ValidationError

from app.schemas.payment import PaymentSelectionRequest


VALID_SESSION_ID = "550e8400-e29b-41d4-a716-446655440000"


def test_invalid_payment_method():
    with pytest.raises(ValidationError):
        PaymentSelectionRequest(
            checkout_session_id=VALID_SESSION_ID,
            order_id=1,
            method="INVALID",
        )


def test_missing_payment_method():
    with pytest.raises(ValidationError):
        PaymentSelectionRequest(
            checkout_session_id=VALID_SESSION_ID,
            order_id=1,
        )


def test_valid_online_payment():
    request = PaymentSelectionRequest(
        checkout_session_id=VALID_SESSION_ID,
        order_id=1,
        method="ONLINE",
    )

    assert request.method.value == "ONLINE"
    assert request.order_id == 1


def test_valid_cod_payment():
    request = PaymentSelectionRequest(
        checkout_session_id=VALID_SESSION_ID,
        order_id=1,
        method="COD",
    )

    assert request.method.value == "COD"
    assert request.order_id == 1


def test_missing_checkout_session():
    with pytest.raises(ValidationError):
        PaymentSelectionRequest(
            checkout_session_id="",
            order_id=1,
            method="ONLINE",
        )


def test_missing_order_id():
    with pytest.raises(ValidationError):
        PaymentSelectionRequest(
            checkout_session_id=VALID_SESSION_ID,
            method="ONLINE",
        )


def test_valid_request_contains_order_id():
    request = PaymentSelectionRequest(
        checkout_session_id=VALID_SESSION_ID,
        order_id=10,
        method="ONLINE",
    )

    assert request.order_id == 10
    assert request.method.value == "ONLINE"