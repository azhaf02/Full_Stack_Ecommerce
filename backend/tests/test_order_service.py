import itertools
from decimal import Decimal
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base
from app.models.order import Order, OrderItem, OrderStatusHistory, Return, ReturnItem, OrderStatus
from app.services import order_service
from app.services.order_service import (
    ALLOWED_TRANSITIONS, InvalidTransition, PaymentNotVerified, NothingToRefund, UnknownStatus,
    update_status, allowed_next_statuses, can_customer_cancel, register_status_hook, clear_status_hooks,
)

ORDER_TABLES = [Order.__table__, OrderItem.__table__, OrderStatusHistory.__table__,
                Return.__table__, ReturnItem.__table__]


@pytest.fixture()
def db():
    engine = create_engine("sqlite://")
    Base.metadata.create_all(engine, tables=ORDER_TABLES)
    session = sessionmaker(bind=engine)()
    clear_status_hooks()
    yield session
    clear_status_hooks()
    session.close()


_numbers = itertools.count(1)


def make_order(db, status="PLACED", payment_method="ONLINE", payment_status="PENDING"):
    order = Order(order_number=f"ORD-TEST-{next(_numbers)}", user_id=1, address_id=1, shipping_method_id=1,
                  payment_method=payment_method, payment_status=payment_status, status=status,
                  subtotal=Decimal("100"), total_amount=Decimal("100"))
    db.add(order)
    db.flush()
    return order


def test_every_status_has_a_rule():
    assert set(ALLOWED_TRANSITIONS) == {s.value for s in OrderStatus}


def test_main_flow_moves_forward_and_logs_each_step(db):
    order = make_order(db, payment_status="SUCCESS")
    for step in ["CONFIRMED", "PROCESSING", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"]:
        update_status(db, order, step, changed_by=7, remarks=f"to {step}")
    assert order.status == "DELIVERED"
    assert [(h.previous_status, h.new_status) for h in order.status_history] == [
        ("PLACED", "CONFIRMED"), ("CONFIRMED", "PROCESSING"), ("PROCESSING", "PACKED"),
        ("PACKED", "SHIPPED"), ("SHIPPED", "OUT_FOR_DELIVERY"), ("OUT_FOR_DELIVERY", "DELIVERED")]
    assert all(h.changed_by == 7 for h in order.status_history)


@pytest.mark.parametrize("current,new", [
    ("DELIVERED", "PLACED"), ("PLACED", "SHIPPED"), ("PLACED", "DELIVERED"), ("PACKED", "CANCELLED"),
    ("SHIPPED", "CANCELLED"), ("DELIVERED", "RETURNED"), ("REFUNDED", "PLACED"), ("CANCELLED", "CONFIRMED"),
])
def test_invalid_transitions_are_rejected_and_nothing_is_logged(db, current, new):
    order = make_order(db, status=current, payment_status="SUCCESS")
    with pytest.raises(InvalidTransition):
        update_status(db, order, new)
    assert order.status == current
    assert order.status_history == []


def test_unknown_status_is_rejected(db):
    with pytest.raises(UnknownStatus):
        update_status(db, make_order(db), "TELEPORTED")


def test_accepts_the_enum_as_well_as_text(db):
    order = make_order(db, payment_status="SUCCESS")
    update_status(db, order, OrderStatus.CONFIRMED)
    assert order.status == "CONFIRMED"


@pytest.mark.parametrize("payment_status", ["PENDING", "FAILED", "CANCELLED"])
def test_online_order_is_not_confirmed_without_verified_payment(db, payment_status):
    order = make_order(db, payment_method="ONLINE", payment_status=payment_status)
    with pytest.raises(PaymentNotVerified):
        update_status(db, order, "CONFIRMED")
    assert order.status == "PLACED"


def test_online_order_is_confirmed_after_verified_payment(db):
    order = make_order(db, payment_method="ONLINE", payment_status="SUCCESS")
    assert update_status(db, order, "CONFIRMED").status == "CONFIRMED"


def test_cod_order_is_confirmed_without_online_payment(db):
    order = make_order(db, payment_method="COD", payment_status="PENDING")
    update_status(db, order, "CONFIRMED")
    assert order.status == "CONFIRMED" and order.payment_status == "PENDING"


def test_cancelling_an_unpaid_order_is_allowed_but_has_nothing_to_refund(db):
    order = make_order(db, payment_status="PENDING")
    update_status(db, order, "CANCELLED")
    with pytest.raises(NothingToRefund):
        update_status(db, order, "REFUND_PENDING")


def test_cancelled_paid_order_goes_through_refund_and_payment_status_follows(db):
    order = make_order(db, payment_status="SUCCESS")
    update_status(db, order, "CANCELLED")
    update_status(db, order, "REFUND_PENDING")
    assert order.payment_status == "REFUND_PENDING"
    update_status(db, order, "REFUNDED")
    assert order.status == "REFUNDED" and order.payment_status == "REFUNDED"


def test_return_flow_approved(db):
    order = make_order(db, status="DELIVERED", payment_status="SUCCESS")
    for step in ["RETURN_REQUESTED", "RETURN_APPROVED", "RETURNED", "REFUND_PENDING", "REFUNDED"]:
        update_status(db, order, step)
    assert order.status == "REFUNDED"


def test_rejected_return_puts_the_order_back_to_delivered(db):
    order = make_order(db, status="DELIVERED", payment_status="SUCCESS")
    update_status(db, order, "RETURN_REQUESTED")
    update_status(db, order, "DELIVERED", remarks="return rejected")
    assert order.status == "DELIVERED"


def test_customer_can_cancel_only_before_packing(db):
    cancellable = {"PLACED", "CONFIRMED", "PROCESSING"}
    for s in OrderStatus:
        assert can_customer_cancel(make_order(db, status=s.value)) == (s.value in cancellable)


def test_allowed_next_statuses(db):
    assert allowed_next_statuses("PLACED") == {"CONFIRMED", "CANCELLED"}
    assert allowed_next_statuses("REFUNDED") == frozenset()


def test_hooks_run_with_old_and_new_status(db):
    seen = []
    register_status_hook(lambda session, order, old, new: seen.append((order.order_number, old, new)))
    order = make_order(db, payment_status="SUCCESS")
    update_status(db, order, "CONFIRMED")
    assert seen == [(order.order_number, "PLACED", "CONFIRMED")]


def test_hooks_do_not_run_when_the_change_is_rejected(db):
    seen = []
    register_status_hook(lambda *a: seen.append(a))
    with pytest.raises(InvalidTransition):
        update_status(db, make_order(db), "DELIVERED")
    assert seen == []


def test_a_failing_hook_can_be_rolled_back_with_the_status_change(db):
    order = make_order(db, payment_status="SUCCESS")
    db.commit()

    def out_of_stock(*args):
        raise RuntimeError("out of stock")

    register_status_hook(out_of_stock)
    with pytest.raises(RuntimeError):
        update_status(db, order, "CONFIRMED")
    db.rollback()
    db.refresh(order)
    assert order.status == "PLACED"
    assert db.query(OrderStatusHistory).count() == 0


# ------------------------------------------------------------------ what the admin dropdown may offer

from app.services.order_service import admin_next_statuses, admin_status_is_blocked, RETURN_ONLY_STATUSES


def test_paid_online_order_offers_confirm_and_cancel_in_lifecycle_order(db):
    assert admin_next_statuses(make_order(db, payment_status="SUCCESS")) == ["CONFIRMED", "CANCELLED"]


def test_unpaid_online_order_does_not_offer_confirm(db):
    assert admin_next_statuses(make_order(db, payment_status="PENDING")) == ["CANCELLED"]


def test_cod_order_offers_confirm_without_payment(db):
    assert admin_next_statuses(make_order(db, payment_method="COD")) == ["CONFIRMED", "CANCELLED"]


@pytest.mark.parametrize("status,expected", [
    ("CONFIRMED", ["PROCESSING", "CANCELLED"]), ("PROCESSING", ["PACKED", "CANCELLED"]),
    ("PACKED", ["SHIPPED"]), ("SHIPPED", ["OUT_FOR_DELIVERY"]), ("OUT_FOR_DELIVERY", ["DELIVERED"]),
    ("REFUNDED", []),
])
def test_next_options_follow_the_lifecycle(db, status, expected):
    assert admin_next_statuses(make_order(db, status=status, payment_status="SUCCESS")) == expected


def test_delivered_order_offers_nothing_because_returns_use_their_own_workflow(db):
    assert admin_next_statuses(make_order(db, status="DELIVERED", payment_status="SUCCESS")) == []


def test_cancelled_order_offers_a_refund_only_if_it_was_paid(db):
    assert admin_next_statuses(make_order(db, status="CANCELLED", payment_status="SUCCESS")) == ["REFUND_PENDING"]
    assert admin_next_statuses(make_order(db, status="CANCELLED", payment_status="PENDING")) == []


def test_every_offered_option_is_really_accepted(db):
    """The dropdown must never offer something update_status would refuse."""
    for status in OrderStatus:
        for payment in ("PENDING", "SUCCESS"):
            for method in ("ONLINE", "COD"):
                order = make_order(db, status=status.value, payment_status=payment, payment_method=method)
                for option in admin_next_statuses(order):
                    update_status(db, order, option)
                    order.status = status.value  # reset for the next option


def test_return_steps_are_blocked_for_the_plain_status_route(db):
    order = make_order(db, status="DELIVERED", payment_status="SUCCESS")
    for blocked in RETURN_ONLY_STATUSES:
        assert admin_status_is_blocked(order, blocked)
    assert not admin_status_is_blocked(order, "CANCELLED")
