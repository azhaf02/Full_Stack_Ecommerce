from dataclasses import dataclass
from enum import Enum
from uuid import uuid4


class MockGatewayStatus(str, Enum):
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"


@dataclass(frozen=True)
class MockGatewayResponse:
    transaction_id: str
    status: MockGatewayStatus


class MockGateway:
    """
    Simulates an external online payment provider.

    No real card/payment details are processed here.
    A real provider such as Razorpay or Stripe can later
    replace this service while keeping the backend payment
    verification flow.
    """

    @staticmethod
    def process_payment(
        amount,
        simulate_failure: bool = False,
    ) -> MockGatewayResponse:
        if amount is None or amount <= 0:
            raise ValueError("Payment amount must be greater than zero")

        transaction_id = f"MOCK-{uuid4().hex.upper()}"

        gateway_status = (
            MockGatewayStatus.FAILED
            if simulate_failure
            else MockGatewayStatus.SUCCESS
        )

        return MockGatewayResponse(
            transaction_id=transaction_id,
            status=gateway_status,
        )

    @staticmethod
    def verify_payment(
        response: MockGatewayResponse,
    ) -> bool:
        """
        Verification happens on the backend.

        The frontend cannot directly set a Payment record
        to SUCCESS.
        """
        if not response.transaction_id.startswith("MOCK-"):
            return False

        return response.status == MockGatewayStatus.SUCCESS


mock_gateway = MockGateway()