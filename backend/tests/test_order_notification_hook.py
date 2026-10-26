from decimal import Decimal

import pytest
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base
from app.models.inventory import Inventory
from app.models.inventory_history import InventoryHistory
from app.models.notification import Notification
from app.models.order import Order, OrderItem, OrderStatusHistory, Return, ReturnItem
from app.services.order_notification_hook import TEMPLATES, on_order_notification
from app.services.order_service import (
    OrderInput, OrderItemInput, apply_payment_result, cancel_order, clear_status_hooks, create_order,
    register_status_hook, update_status,
)

TABLES = [Order.__table__, OrderItem.__table__, OrderStatusHistory.__table__, Return.__table__,
          ReturnItem.__table__, Notification.__table__, Inventory.__table__, InventoryHistory.__table__]
PATH = ["PROCESSING", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"]


@pytest.fixture()
def db():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine, tables=TABLES)
    session = sessionmaker(bind=engine)()
    session.add(Inventory(product_id=1, variant_id=None, quantity=50, low_stock_threshold=2, status="IN_STOCK"))
    session.commit()
    clear_status_hooks()
    register_status_hook(on_order_notification)
    yield session
    clear_status_hooks()
    session.close()


def new_order(db, method="COD", user_id=7):
    order = create_order(db, OrderInput(
        user_id=user_id, address_id=1, shipping_method_id=1, payment_method=method,
        items=[OrderItemInput(product_id=1, quantity=1, unit_price=Decimal("50.00"))],
        subtotal=Decimal("50.00"), total_amount=Decimal("50.00")))
    db.flush()
    return order


def messages(db):
    return [(n.user_id, n.type, n.message) for n in db.query(Notification).order_by(Notification.id)]


def test_a_cod_order_journey_sends_the_agreed_messages_to_the_customer(db):
    order = new_order(db)
    for step in PATH:
        update_status(db, order, step)
    number = order.order_number
    assert messages(db) == [
        (7, "order_status", f"Your order #{number} has been confirmed."),
        (7, "order_status", f"Your order #{number} has been shipped and is on the way!"),
        (7, "order_status", f"Your order #{number} is out for delivery today."),
        (7, "order_status", f"Your order #{number} has been delivered. Enjoy your purchase!"),
    ]


def test_steps_without_a_template_send_nothing(db):
    order = new_order(db, method="ONLINE")                 # PLACED: nothing yet
    assert messages(db) == []
    apply_payment_result(db, order, "SUCCESS")             # CONFIRMED
    update_status(db, order, "PROCESSING")
    update_status(db, order, "PACKED")
    assert [m[2].split(" has")[0] for m in messages(db)] == [f"Your order #{order.order_number}"]  # only CONFIRMED


def test_cancelling_a_paid_order_sends_cancelled_then_refunded(db):
    order = new_order(db, method="ONLINE")
    apply_payment_result(db, order, "SUCCESS")
    cancel_order(db, order, user_id=7)                     # CANCELLED -> REFUND_PENDING
    update_status(db, order, "REFUNDED")
    texts = [m[2] for m in messages(db)]
    assert texts[-2:] == [f"Your order #{order.order_number} has been cancelled.",
                          f"Refund for order #{order.order_number} has been processed."]
    assert not any("REFUND_PENDING" in t for t in texts)


def test_a_notification_problem_never_blocks_the_order(db):
    db.execute(text("DROP TABLE notifications"))
    order = new_order(db)                                  # confirming sends a notification, which fails
    update_status(db, order, "PROCESSING")
    assert order.status == "PROCESSING"
    assert [h.new_status for h in order.status_history] == ["PLACED", "CONFIRMED", "PROCESSING"]


def test_all_templates_have_the_order_number_and_fit_the_column():
    for status, template in TEMPLATES.items():
        assert "{n}" in template and len(template.format(n="ORD-20261026-ABCDEF")) < 500


def test_the_hook_is_registered_by_the_real_app():
    import inspect
    import app.main
    assert "register_status_hook(on_order_notification)" in inspect.getsource(app.main)
