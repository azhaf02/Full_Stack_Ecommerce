"""Checkpoint 4 (ORD-08): payment + order + inventory working together, with the real hooks registered.

Rules from the plan: an order is confirmed only after payment succeeds (online) or is accepted (COD), and stock
is deducted exactly once, restored on cancel, and never deducted for an order that was not confirmed.
"""
from decimal import Decimal

import pytest

# These tests need Rehan's stock hook (inventory PR #28). Until it is on main they are skipped, not failed.
inventory_service = pytest.importorskip("app.services.inventory_service")
if not hasattr(inventory_service, "on_order_status_change"):
    pytest.skip("inventory stock hook is not on this branch yet", allow_module_level=True)

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base
from app.models.inventory import Inventory
from app.models.inventory_history import InventoryHistory
from app.models.order import Order, OrderItem, OrderStatusHistory, Return, ReturnItem
from app.models.payment import Payment, PaymentMethod, PaymentStatus
from app.services import order_service
from app.services.cod_payment_hook import on_cod_order_change
from app.services.inventory_service import on_order_status_change
from app.services.order_service import (
    InvalidOrder, OrderInput, OrderItemInput, OutOfStock, apply_payment_result, cancel_order, clear_status_hooks, create_order,
    register_status_hook, update_status,
)

TABLES = [Order.__table__, OrderItem.__table__, OrderStatusHistory.__table__, Return.__table__,
          ReturnItem.__table__, Payment.__table__, Inventory.__table__, InventoryHistory.__table__]
PATH = ["PROCESSING", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"]


@pytest.fixture()
def db():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine, tables=TABLES)
    session = sessionmaker(bind=engine)()
    clear_status_hooks()
    register_status_hook(on_order_status_change)      # Rehan: stock
    register_status_hook(on_cod_order_change)         # Rukhsar: COD payment follows delivery
    session.add(Inventory(product_id=1, variant_id=None, quantity=10, low_stock_threshold=2, status="IN_STOCK"))
    session.commit()
    yield session
    clear_status_hooks()
    session.close()


def stock(db):
    db.flush()
    db.expire_all()
    return db.query(Inventory).filter_by(product_id=1).one().quantity


def place(db, method, qty=2):
    order = create_order(db, OrderInput(
        user_id=1, address_id=1, shipping_method_id=1, payment_method=method,
        items=[OrderItemInput(product_id=1, quantity=qty, unit_price=Decimal("50.00"))],
        subtotal=Decimal(50 * qty), total_amount=Decimal(50 * qty)))
    db.flush()
    return order


def payment_of(db, order):
    return db.query(Payment).filter(Payment.order_id == order.id).one()


def test_cod_journey_deducts_once_and_is_paid_on_delivery(db):
    order = place(db, "COD")
    assert order.status == "CONFIRMED" and stock(db) == 8                     # confirmed -> deducted once
    assert payment_of(db, order).status == PaymentStatus.PENDING
    for step in PATH:
        update_status(db, order, step)
        assert stock(db) == 8                                                 # never deducted again
    assert order.payment_status == "SUCCESS" and payment_of(db, order).status == PaymentStatus.SUCCESS
    assert db.query(InventoryHistory).filter_by(change_type="DEDUCTION").count() == 1


def test_online_order_is_not_confirmed_or_deducted_until_payment_succeeds(db):
    order = place(db, "ONLINE")
    assert order.status == "PLACED" and stock(db) == 10
    apply_payment_result(db, order, "FAILED")
    assert order.status == "PLACED" and stock(db) == 10                       # failed payment: nothing happens
    apply_payment_result(db, order, "SUCCESS")
    assert order.status == "CONFIRMED" and stock(db) == 8
    apply_payment_result(db, order, "SUCCESS")                                # repeated callback
    assert stock(db) == 8


def test_cancelling_a_paid_online_order_restores_stock_and_starts_the_refund(db):
    order = place(db, "ONLINE")
    apply_payment_result(db, order, "SUCCESS")
    assert stock(db) == 8
    cancel_order(db, order, user_id=1, reason="changed my mind")
    assert stock(db) == 10
    assert order.status == "REFUND_PENDING" and order.payment_status == "REFUND_PENDING"


def test_cancelling_a_cod_order_restores_stock_and_is_not_marked_paid(db):
    order = place(db, "COD")
    cancel_order(db, order, user_id=1)
    assert stock(db) == 10 and order.status == "CANCELLED"
    assert payment_of(db, order).status == PaymentStatus.PENDING and order.payment_status != "SUCCESS"


def test_cancelling_an_unconfirmed_order_does_not_add_stock(db):
    order = place(db, "ONLINE")                                               # PLACED, nothing deducted
    cancel_order(db, order, user_id=1)
    assert stock(db) == 10


def test_an_order_for_more_than_is_in_stock_is_refused_at_creation(db):
    with pytest.raises(InvalidOrder):
        place(db, "COD", qty=11)
    with pytest.raises(InvalidOrder):
        place(db, "ONLINE", qty=11)
    db.rollback()
    assert stock(db) == 10 and db.query(Order).count() == 0


def test_stock_sold_while_a_payment_was_pending_blocks_the_confirmation(db):
    online = place(db, "ONLINE", qty=6)            # fits now (10 in stock), waiting for payment
    cod = place(db, "COD", qty=6)                  # confirmed at once, so stock drops to 4
    assert cod.status == "CONFIRMED" and stock(db) == 4
    db.commit()                                    # the COD order is saved; the failing payment is not
    with pytest.raises(OutOfStock):
        apply_payment_result(db, online, "SUCCESS")   # 6 wanted, 4 left
    db.rollback()
    assert stock(db) == 4
