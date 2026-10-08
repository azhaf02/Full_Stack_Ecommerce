from datetime import datetime, timedelta, timezone
from types import SimpleNamespace
from uuid import uuid4

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.security import get_current_user
from app.database import Base, get_db
from app.models.checkout_session import CheckoutSession
from app.models.order import Order
from app.models.payment import Payment,PaymentMethod,PaymentStatus
from app.routers import payment as payment_router


@pytest.fixture()
def env():
	engine = create_engine(
		"sqlite://",
		connect_args={"check_same_thread": False},
		poolclass=StaticPool,
	)
	Base.metadata.create_all(engine)

	Session = sessionmaker(bind=engine, autoflush=False, autocommit=False)
	db = Session()
	user = SimpleNamespace(id=1)

	app = FastAPI()
	app.include_router(payment_router.router)

	def override_db():
		test_db = Session()
		try:
			yield test_db
		finally:
			test_db.close()

	app.dependency_overrides[get_db] = override_db
	app.dependency_overrides[get_current_user] = lambda: user

	yield SimpleNamespace(db=db, client=TestClient(app), user=user)

	db.close()


def create_order(db, user_id=1):
	order = Order(
		order_number=f"TEST-{uuid4().hex[:8]}",
		user_id=user_id,
		address_id=1,
		shipping_method_id=1,
		status="PLACED",
		payment_method="ONLINE",
		payment_status="PENDING",
		subtotal=1000,
		discount_amount=0,
		tax_amount=0,
		shipping_cost=50,
		total_amount=1050,
	)
	db.add(order)
	db.commit()
	db.refresh(order)
	return order


def create_checkout_session(db, customer_id="1", status="active", expired=False):
	now = datetime.now(timezone.utc)
	checkout_session = CheckoutSession(
		session_id=str(uuid4()),
		customer_id=customer_id,
		status=status,
		created_at=now,
		expires_at=(
			now - timedelta(minutes=1)
			if expired
			else now + timedelta(minutes=30)
		),
	)
	db.add(checkout_session)
	db.commit()
	db.refresh(checkout_session)
	return checkout_session


def test_online_payment_method_saved_as_pending(env):
	order = create_order(env.db)
	checkout = create_checkout_session(env.db)

	response = env.client.post(
		"/api/payment/select-method",
		json={
			"checkout_session_id": str(checkout.session_id),
			"order_id": order.id,
			"method": "ONLINE",
		},
	)

	assert response.status_code == 200
	data = response.json()
	assert data["order_id"] == order.id
	assert data["method"] == "ONLINE"
	assert data["status"] == "PENDING"

	payment = env.db.query(Payment).filter(Payment.order_id == order.id).first()
	assert payment is not None
	assert payment.status == PaymentStatus.PENDING


def test_cod_payment_method_saved_as_pending(env):
	order = create_order(env.db)
	checkout = create_checkout_session(env.db)

	response = env.client.post(
		"/api/payment/select-method",
		json={
			"checkout_session_id": str(checkout.session_id),
			"order_id": order.id,
			"method": "COD",
		},
	)

	assert response.status_code == 200
	assert response.json()["method"] == "COD"
	assert response.json()["status"] == "PENDING"


def test_expired_checkout_session_rejected(env):
	order = create_order(env.db)
	checkout = create_checkout_session(env.db, expired=True)

	response = env.client.post(
		"/api/payment/select-method",
		json={
			"checkout_session_id": str(checkout.session_id),
			"order_id": order.id,
			"method": "ONLINE",
		},
	)

	assert response.status_code == 410


def test_checkout_session_wrong_customer_rejected(env):
	order = create_order(env.db)
	checkout = create_checkout_session(env.db, customer_id="999")

	response = env.client.post(
		"/api/payment/select-method",
		json={
			"checkout_session_id": str(checkout.session_id),
			"order_id": order.id,
			"method": "ONLINE",
		},
	)

	assert response.status_code == 403


def test_order_wrong_customer_rejected(env):
	order = create_order(env.db, user_id=999)
	checkout = create_checkout_session(env.db)

	response = env.client.post(
		"/api/payment/select-method",
		json={
			"checkout_session_id": str(checkout.session_id),
			"order_id": order.id,
			"method": "ONLINE",
		},
	)

	assert response.status_code == 404
# =========================================================
# MOCK / SANDBOX ONLINE PAYMENT TESTS
# =========================================================


def create_pending_payment(env, method="ONLINE"):
    order = create_order(env.db)

    payment = Payment(
        order_id=order.id,
        method=method,
        status="PENDING",
        amount=order.total_amount,
    )

    env.db.add(payment)
    env.db.commit()
    env.db.refresh(payment)

    return order, payment


def test_mock_success_payment(env):
    order, payment = create_pending_payment(env)

    process_response = env.client.post(
        "/api/payment/mock/process",
        json={
            "payment_id": payment.id,
            "simulate_failure": False,
        },
    )

    assert process_response.status_code == 200

    process_data = process_response.json()

    assert process_data["gateway_status"] == "SUCCESS"
    assert process_data["transaction_id"].startswith("MOCK-SUCCESS-")

    env.db.expire_all()

    pending_payment = env.db.get(Payment, payment.id)

    # Frontend processing must NOT directly mark payment successful.
    assert pending_payment.status.value == "PENDING"
    assert pending_payment.transaction_id == process_data["transaction_id"]

    verify_response = env.client.post(
        "/api/payment/mock/verify",
        json={
            "payment_id": payment.id,
            "transaction_id": process_data["transaction_id"],
        },
    )

    assert verify_response.status_code == 200
    assert verify_response.json()["status"] == "SUCCESS"

    env.db.expire_all()

    verified_payment = env.db.get(Payment, payment.id)

    assert verified_payment.status.value == "SUCCESS"
    assert verified_payment.transaction_id == process_data["transaction_id"]


def test_mock_failed_payment(env):
    order, payment = create_pending_payment(env)

    process_response = env.client.post(
        "/api/payment/mock/process",
        json={
            "payment_id": payment.id,
            "simulate_failure": True,
        },
    )

    assert process_response.status_code == 200

    process_data = process_response.json()

    assert process_data["gateway_status"] == "FAILED"
    assert process_data["transaction_id"].startswith("MOCK-FAILED-")

    env.db.expire_all()

    pending_payment = env.db.get(Payment, payment.id)

    # Even a failed gateway simulation remains PENDING
    # until the backend verification step.
    assert pending_payment.status.value == "PENDING"

    verify_response = env.client.post(
        "/api/payment/mock/verify",
        json={
            "payment_id": payment.id,
            "transaction_id": process_data["transaction_id"],
        },
    )

    assert verify_response.status_code == 200
    assert verify_response.json()["status"] == "FAILED"

    env.db.expire_all()

    failed_payment = env.db.get(Payment, payment.id)

    assert failed_payment.status.value == "FAILED"


def test_mock_transaction_id_is_stored(env):
    order, payment = create_pending_payment(env)

    response = env.client.post(
        "/api/payment/mock/process",
        json={
            "payment_id": payment.id,
            "simulate_failure": False,
        },
    )

    assert response.status_code == 200

    transaction_id = response.json()["transaction_id"]

    env.db.expire_all()
    stored_payment = env.db.get(Payment, payment.id)

    assert stored_payment.transaction_id == transaction_id


def test_mock_tampered_transaction_id_rejected(env):
    order, payment = create_pending_payment(env)

    process_response = env.client.post(
        "/api/payment/mock/process",
        json={
            "payment_id": payment.id,
            "simulate_failure": False,
        },
    )

    assert process_response.status_code == 200

    response = env.client.post(
        "/api/payment/mock/verify",
        json={
            "payment_id": payment.id,
            "transaction_id": "MOCK-TAMPERED-TRANSACTION",
        },
    )

    assert response.status_code == 400

    env.db.expire_all()
    stored_payment = env.db.get(Payment, payment.id)

    assert stored_payment.status.value == "PENDING"


def test_frontend_cannot_force_payment_success(env):
    order, payment = create_pending_payment(env)

    process_response = env.client.post(
        "/api/payment/mock/process",
        json={
            "payment_id": payment.id,
            "simulate_failure": False,
        },
    )

    assert process_response.status_code == 200

    transaction_id = process_response.json()["transaction_id"]

    response = env.client.post(
        "/api/payment/mock/verify",
        json={
            "payment_id": payment.id,
            "transaction_id": transaction_id,
            "status": "SUCCESS",
        },
    )

    # MockPaymentVerifyRequest forbids unexpected fields.
    assert response.status_code == 422

    env.db.expire_all()
    stored_payment = env.db.get(Payment, payment.id)

    assert stored_payment.status.value == "PENDING"


def test_cod_cannot_use_mock_online_gateway(env):
    order, payment = create_pending_payment(env, method="COD")

    response = env.client.post(
        "/api/payment/mock/process",
        json={
            "payment_id": payment.id,
            "simulate_failure": False,
        },
    )

    assert response.status_code == 400

    env.db.expire_all()
    stored_payment = env.db.get(Payment, payment.id)

    assert stored_payment.status.value == "PENDING"
    assert stored_payment.transaction_id is None
def test_get_payment_by_order_for_current_customer(env):
    order = create_order(env.db, user_id=1)
    checkout = create_checkout_session(env.db)

    select_response = env.client.post(
        "/api/payment/select-method",
        json={
            "checkout_session_id": str(checkout.session_id),
            "order_id": order.id,
            "method": "ONLINE",
        },
    )

    assert select_response.status_code == 200

    response = env.client.get(
        f"/api/payment/order/{order.id}"
    )

    assert response.status_code == 200

    data = response.json()

    assert data["order_id"] == order.id
    assert data["payment_id"] == select_response.json()["payment_id"]
    assert data["method"] == "ONLINE"
    assert data["status"] == "PENDING"


def test_get_payment_by_order_wrong_customer_rejected(env):
    order = create_order(env.db, user_id=999)

    response = env.client.get(
        f"/api/payment/order/{order.id}"
    )

    assert response.status_code == 404
def test_cod_payment_remains_pending(env):
    order = create_order(env.db, user_id=1)
    checkout = create_checkout_session(env.db)

    select_response = env.client.post(
        "/api/payment/select-method",
        json={
            "checkout_session_id": str(checkout.session_id),
            "order_id": order.id,
            "method": "COD",
        },
    )

    assert select_response.status_code == 200
    payment_id = select_response.json()["payment_id"]

    response = env.client.post(
        "/api/payment/cod",
        json={
            "payment_id": payment_id,
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["payment_id"] == payment_id
    assert data["order_id"] == order.id
    assert data["method"] == "COD"
    assert data["status"] == "PENDING"

    env.db.refresh(order)

    assert order.payment_method == "COD"
    assert order.payment_status == "PENDING"


def test_online_payment_rejected_by_cod_endpoint(env):
    order = create_order(env.db, user_id=1)
    checkout = create_checkout_session(env.db)

    select_response = env.client.post(
        "/api/payment/select-method",
        json={
            "checkout_session_id": str(checkout.session_id),
            "order_id": order.id,
            "method": "ONLINE",
        },
    )

    assert select_response.status_code == 200
    payment_id = select_response.json()["payment_id"]

    response = env.client.post(
        "/api/payment/cod",
        json={
            "payment_id": payment_id,
        },
    )

    assert response.status_code == 400


def test_cod_payment_wrong_customer_rejected(env):
    order = create_order(env.db, user_id=999)

    from app.models.payment import Payment, PaymentMethod, PaymentStatus

    payment = Payment(
        order_id=order.id,
        method=PaymentMethod.COD,
        status=PaymentStatus.PENDING,
        amount=order.total_amount,
    )

    env.db.add(payment)
    env.db.commit()
    env.db.refresh(payment)

    response = env.client.post(
        "/api/payment/cod",
        json={
            "payment_id": payment.id,
        },
    )

    assert response.status_code == 404


def test_cod_request_rejects_extra_status_field(env):
    order = create_order(env.db, user_id=1)
    checkout = create_checkout_session(env.db)

    select_response = env.client.post(
        "/api/payment/select-method",
        json={
            "checkout_session_id": str(checkout.session_id),
            "order_id": order.id,
            "method": "COD",
        },
    )

    assert select_response.status_code == 200
    payment_id = select_response.json()["payment_id"]

    response = env.client.post(
        "/api/payment/cod",
        json={
            "payment_id": payment_id,
            "status": "SUCCESS",
        },
    )

    assert response.status_code == 422