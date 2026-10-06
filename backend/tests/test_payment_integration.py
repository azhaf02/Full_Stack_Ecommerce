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
from app.models.payment import Payment, PaymentStatus
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
