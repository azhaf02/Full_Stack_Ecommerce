from decimal import Decimal

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base
from app.models.order import Order, OrderItem, OrderStatusHistory, Return, ReturnItem
from app.models.payment import Payment, PaymentMethod, PaymentStatus
from app.services import order_service
from app.services.cod_payment_hook import on_cod_order_change
from app.services.order_service import (
    OrderInput, OrderItemInput, apply_payment_result, clear_status_hooks, create_order, register_status_hook,
    update_status,
)

TABLES = [Order.__table__, OrderItem.__table__, OrderStatusHistory.__table__, Return.__table__,
          ReturnItem.__table__, Payment.__table__]
PATH = ["PROCESSING", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"]


@pytest.fixture()
def db():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine, tables=TABLES)
    session = sessionmaker(bind=engine)()
    clear_status_hooks()
    register_status_hook(on_cod_order_change)
    yield session
    clear_status_hooks()
    session.close()


def new_order(db, method):
    order = create_order(db, OrderInput(
        user_id=1, address_id=1, shipping_method_id=1, payment_method=method,
        items=[OrderItemInput(product_id=1, quantity=2, unit_price=Decimal("50.00"))],
        subtotal=Decimal("100.00"), shipping_cost=Decimal("20.00"), total_amount=Decimal("120.00")))
    db.flush()
    return order


def payments(db, order):
    return db.query(Payment).filter(Payment.order_id == order.id).all()


def test_a_confirmed_cod_order_gets_a_pending_payment_row(db):
    order = new_order(db, "COD")
    (payment,) = payments(db, order)
    assert payment.method == PaymentMethod.COD and payment.status == PaymentStatus.PENDING
    assert payment.amount == Decimal("120.00") and order.payment_status == "PENDING"


def test_delivering_a_cod_order_marks_it_paid_everywhere(db):
    order = new_order(db, "COD")
    for step in PATH[:-1]:
        update_status(db, order, step)
        assert order.payment_status == "PENDING"             # not paid before delivery
    update_status(db, order, "DELIVERED")
    (payment,) = payments(db, order)
    assert order.payment_status == "SUCCESS" and payment.status == PaymentStatus.SUCCESS


def test_an_older_cod_order_without_a_payment_row_is_repaired_on_delivery(db):
    order = new_order(db, "COD")
    db.query(Payment).delete()
    db.flush()
    for step in PATH:
        update_status(db, order, step)
    (payment,) = payments(db, order)
    assert payment.status == PaymentStatus.SUCCESS and order.payment_status == "SUCCESS"


def test_there_is_never_more_than_one_payment_row_per_cod_order(db):
    order = new_order(db, "COD")
    for step in PATH:
        update_status(db, order, step)
    assert len(payments(db, order)) == 1


def test_a_delivered_cod_return_is_refunded_because_cash_was_collected(db):
    order = new_order(db, "COD")
    for step in PATH:
        update_status(db, order, step)
    update_status(db, order, "RETURN_REQUESTED")
    update_status(db, order, "RETURN_APPROVED")
    update_status(db, order, "RETURNED")
    update_status(db, order, "REFUND_PENDING")
    assert order.payment_status == "REFUND_PENDING"


def test_online_orders_are_left_to_the_payment_module(db):
    order = new_order(db, "ONLINE")
    assert payments(db, order) == [] and order.status == "PLACED"
    apply_payment_result(db, order, "SUCCESS")
    for step in PATH:
        update_status(db, order, step)
    assert payments(db, order) == [] and order.payment_status == "SUCCESS"


def test_cancelled_cod_order_is_not_marked_paid(db):
    order = new_order(db, "COD")
    update_status(db, order, "CANCELLED")
    (payment,) = payments(db, order)
    assert payment.status == PaymentStatus.PENDING and order.payment_status != "SUCCESS"


def test_the_hook_is_registered_by_the_real_app():
    # Other tests clear the hook list, so check the registration line itself rather than the live list.
    import inspect
    import app.main
    assert "register_status_hook(on_cod_order_change)" in inspect.getsource(app.main)


def test_backfill_gives_missing_cod_payment_rows_their_implied_state(db):
    from app.services.cod_payment_hook import backfill_cod_payments

    clear_status_hooks()                                  # simulate orders made by a server without the hook
    placed = new_order(db, "COD")                         # CONFIRMED, no row
    delivered = new_order(db, "COD")
    for step in PATH:
        update_status(db, delivered, step)                # DELIVERED, payment still PENDING
    cancelled = new_order(db, "COD")
    update_status(db, cancelled, "CANCELLED")
    online = new_order(db, "ONLINE")                      # not COD: untouched
    assert db.query(Payment).count() == 0

    created = dict(backfill_cod_payments(db))
    assert created == {placed.id: "PENDING", delivered.id: "SUCCESS", cancelled.id: "CANCELLED"}
    assert delivered.payment_status == "SUCCESS" and cancelled.payment_status == "CANCELLED"
    assert payments(db, online) == []
    assert backfill_cod_payments(db) == []                # running it again changes nothing
