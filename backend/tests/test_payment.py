import pytest
from pydantic import ValidationError

from app.schemas.payment import PaymentSelectionRequest
VALID_SESSION_ID = "550e8400-e29b-41d4-a716-446655440000"


def test_invalid_payment_method():
	with pytest.raises(ValidationError):
		PaymentSelectionRequest(
			checkout_session_id=VALID_SESSION_ID,
			method="INVALID",
		)



def test_missing_payment_method():
    with pytest.raises(ValidationError):
        PaymentSelectionRequest(
            checkout_session_id=VALID_SESSION_ID
        )




def test_valid_online_payment():
    request = PaymentSelectionRequest(
        checkout_session_id=VALID_SESSION_ID,
        method="ONLINE"
    )

    assert request.method.value == "ONLINE"




def test_valid_cod_payment():
    request = PaymentSelectionRequest(
        checkout_session_id=VALID_SESSION_ID,
        method="COD"
    )

    assert request.method.value == "COD"



def test_missing_checkout_session():
    with pytest.raises(ValidationError):
        PaymentSelectionRequest(
            checkout_session_id="",
            method="ONLINE"
        )
