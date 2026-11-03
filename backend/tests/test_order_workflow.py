import itertools
from datetime import datetime, timedelta
from decimal import Decimal
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base
from app.models.order import Order, OrderItem, OrderStatusHistory, Return, ReturnItem
from app.models.inventory import Inventory
from app.models.inventory_history import InventoryHistory

from app.services.order_service import (
    OrderInput, OrderItemInput, InvalidOrder, OrderNotFound, NotCancellable, InvalidTransition,
    create_order, apply_payment_result, cancel_order, get_order_for_user, list_orders_for_user, update_status,
    stock_was_deducted, register_status_hook, clear_status_hooks,
)
from app.services.inventory_service import on_order_status_change
from app.services.return_service import (
    ReturnNotAllowed, ReturnWindowClosed, InvalidReturnItems, RETURN_WINDOW_DAYS,
    request_return, review_return, mark_returned, complete_refund, delivered_at, refund_amount_for,
)
TABLES = [
    Order.__table__,
    OrderItem.__table__,
    OrderStatusHistory.__table__,
    Return.__table__,
    ReturnItem.__table__,
    Inventory.__table__,
    InventoryHistory.__table__,
]

@pytest.fixture()
def db():
    engine = create_engine("sqlite://")
    Base.metadata.create_all(engine, tables=TABLES)
    session = sessionmaker(bind=engine)()

    clear_status_hooks()
    register_status_hook(on_order_status_change)

    session.add_all([
        Inventory(
            product_id=10,
            variant_id=None,
            quantity=100,
            low_stock_threshold=10,
            status="IN_STOCK",
        ),
        Inventory(
            product_id=11,
            variant_id=5,
            quantity=100,
            low_stock_threshold=10,
            status="IN_STOCK",
        ),
    ])
    session.commit()

    yield session

    clear_status_hooks()
    session.close()


def order_input(**overrides):
    base = dict(user_id=1, address_id=1, shipping_method_id=1, payment_method="ONLINE",
                items=[OrderItemInput(product_id=10, quantity=2, unit_price=Decimal("50.00")),
                       OrderItemInput(product_id=11, variant_id=5, quantity=1, unit_price=Decimal("20.00"))],
                subtotal=Decimal("120.00"), discount_amount=Decimal("10.00"), tax_amount=Decimal("6.00"),
                shipping_cost=Decimal("5.00"), total_amount=Decimal("121.00"))
    base.update(overrides)
    return OrderInput(**base)


def delivered_paid_order(db, user_id=1, delivered=None):
    """An online order that has gone through payment and delivery."""
    order = create_order(db, order_input(user_id=user_id))
    apply_payment_result(db, order, "SUCCESS")
    for step in ["PROCESSING", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"]:
        update_status(db, order, step)
    if delivered:
        for h in order.status_history:
            if h.new_status == "DELIVERED":
                h.changed_at = delivered
    db.flush()
    return order


# ------------------------------------------------------------------ creation

def test_online_order_is_created_placed_with_items_and_first_history_row(db):
    order = create_order(db, order_input())
    assert order.status == "PLACED" and order.payment_status == "PENDING"
    assert order.order_number.startswith("ORD-")
    assert [(i.product_id, i.variant_id, i.quantity, i.unit_price) for i in order.items] == [
        (10, None, 2, Decimal("50.00")), (11, 5, 1, Decimal("20.00"))]
    assert [(h.previous_status, h.new_status) for h in order.status_history] == [(None, "PLACED")]


def test_order_numbers_are_unique(db):
    numbers = {create_order(db, order_input()).order_number for _ in range(20)}
    assert len(numbers) == 20


def test_cod_order_is_confirmed_straight_away(db):
    order = create_order(db, order_input(payment_method="COD"))
    assert order.status == "CONFIRMED" and order.payment_status == "PENDING"
    assert [h.new_status for h in order.status_history] == ["PLACED", "CONFIRMED"]


@pytest.mark.parametrize("override,message", [
    (dict(items=[]), "at least one item"),
    (dict(payment_method="CHEQUE"), "payment method"),
    (dict(payment_status="INITIATED"), "payment status"),
    (dict(subtotal=Decimal("999.00"), total_amount=Decimal("999.00")), "Subtotal"),
    (dict(total_amount=Decimal("1.00")), "Total"),
    (dict(items=[OrderItemInput(product_id=1, quantity=0, unit_price=Decimal("1"))],
          subtotal=Decimal("0"), discount_amount=Decimal("0"), tax_amount=Decimal("0"),
          shipping_cost=Decimal("0"), total_amount=Decimal("0")), "quantity"),
])
def test_inconsistent_order_data_is_rejected(db, override, message):
    with pytest.raises(InvalidOrder, match=message):
        create_order(db, order_input(**override))
    assert db.query(Order).count() == 0


def test_verified_payment_confirms_an_online_order(db):
    order = create_order(db, order_input())
    apply_payment_result(db, order, "SUCCESS", changed_by=2)
    assert order.status == "CONFIRMED" and order.payment_status == "SUCCESS"
    assert stock_was_deducted(order)


@pytest.mark.parametrize("result", ["FAILED", "CANCELLED", "PENDING"])
def test_failed_or_cancelled_payment_does_not_confirm(db, result):
    order = create_order(db, order_input())
    apply_payment_result(db, order, result)
    assert order.status == "PLACED" and order.payment_status == result
    assert not stock_was_deducted(order)


def test_a_late_second_success_does_not_confirm_twice(db):
    order = create_order(db, order_input())
    apply_payment_result(db, order, "SUCCESS")
    apply_payment_result(db, order, "SUCCESS")
    assert [h.new_status for h in order.status_history].count("CONFIRMED") == 1


def test_confirmation_runs_the_stock_hook_exactly_once(db):
    deducted = []
    register_status_hook(lambda s, o, old, new: deducted.append(o.id) if new == "CONFIRMED" else None)
    order = create_order(db, order_input())
    apply_payment_result(db, order, "SUCCESS")
    apply_payment_result(db, order, "SUCCESS")
    assert deducted == [order.id]


# ------------------------------------------------------------------ customer access

def test_a_customer_sees_only_their_own_orders(db):
    mine = create_order(db, order_input(user_id=1))
    theirs = create_order(db, order_input(user_id=2))
    assert get_order_for_user(db, mine.id, 1) is mine
    with pytest.raises(OrderNotFound):
        get_order_for_user(db, theirs.id, 1)
    with pytest.raises(OrderNotFound):
        get_order_for_user(db, 99999, 1)
    assert [o.id for o in list_orders_for_user(db, 1)] == [mine.id]


def test_order_list_is_paginated_newest_first(db):
    ids = [create_order(db, order_input(user_id=1)).id for _ in range(5)]
    assert [o.id for o in list_orders_for_user(db, 1, page=1, page_size=2)] == [ids[4], ids[3]]
    assert [o.id for o in list_orders_for_user(db, 1, page=3, page_size=2)] == [ids[0]]


# ------------------------------------------------------------------ cancellation

def test_cancelling_an_unpaid_order(db):
    order = create_order(db, order_input())
    cancel_order(db, order, user_id=1, reason="changed my mind")
    assert order.status == "CANCELLED" and order.payment_status == "PENDING"
    assert not stock_was_deducted(order)
    assert order.status_history[-1].remarks == "changed my mind"


def test_cancelling_a_paid_order_starts_the_refund(db):
    order = create_order(db, order_input())
    apply_payment_result(db, order, "SUCCESS")
    cancel_order(db, order, user_id=1)
    assert order.status == "REFUND_PENDING" and order.payment_status == "REFUND_PENDING"
    assert stock_was_deducted(order)


def test_cod_order_cancelled_before_it_is_paid_has_no_refund(db):
    order = create_order(db, order_input(payment_method="COD"))
    cancel_order(db, order, user_id=1)
    assert order.status == "CANCELLED"


@pytest.mark.parametrize("late_step", ["PACKED", "SHIPPED", "DELIVERED"])
def test_cannot_cancel_once_packed(db, late_step):
    order = create_order(db, order_input())
    apply_payment_result(db, order, "SUCCESS")
    path = ["PROCESSING", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"]
    for step in path[:path.index(late_step) + 1]:
        update_status(db, order, step)
    with pytest.raises(NotCancellable):
        cancel_order(db, order, user_id=1)


def test_cannot_cancel_someone_elses_order(db):
    order = create_order(db, order_input(user_id=2))
    with pytest.raises(OrderNotFound):
        cancel_order(db, order, user_id=1)
    assert order.status == "PLACED"


def test_cannot_cancel_twice(db):
    order = create_order(db, order_input())
    cancel_order(db, order, user_id=1)
    with pytest.raises(NotCancellable):
        cancel_order(db, order, user_id=1)


# ------------------------------------------------------------------ returns

def item_ids(order):
    return [i.id for i in order.items]


def test_full_return_and_refund_flow(db):
    order = delivered_paid_order(db)
    first, second = item_ids(order)
    ret = request_return(db, order, 1, "damaged", [(first, 2), (second, 1)])
    assert order.status == "RETURN_REQUESTED" and ret.status == "REQUESTED"

    review_return(db, ret, admin_id=9, approve=True, remarks="ok")
    assert order.status == "RETURN_APPROVED" and ret.status == "APPROVED" and ret.reviewed_by == 9

    mark_returned(db, ret, admin_id=9)
    assert order.status == "REFUND_PENDING" and ret.status == "REFUND_PENDING"
    assert order.payment_status == "REFUND_PENDING"
    assert ret.refund_amount == Decimal("120.00")

    complete_refund(db, ret, admin_id=9)
    assert order.status == "REFUNDED" and ret.status == "REFUNDED" and order.payment_status == "REFUNDED"


def test_partial_return_refunds_only_the_returned_items(db):
    order = delivered_paid_order(db)
    first, _ = item_ids(order)
    ret = request_return(db, order, 1, "wrong size", [(first, 1)])
    review_return(db, ret, 9, True)
    mark_returned(db, ret, 9)
    assert ret.refund_amount == Decimal("50.00") == refund_amount_for(ret)


def test_rejected_return_puts_the_order_back_to_delivered(db):
    order = delivered_paid_order(db)
    ret = request_return(db, order, 1, "changed mind", [(item_ids(order)[0], 1)])
    review_return(db, ret, 9, approve=False, remarks="outside policy")
    assert order.status == "DELIVERED" and ret.status == "REJECTED" and ret.admin_remarks == "outside policy"
    with pytest.raises(ReturnNotAllowed):
        review_return(db, ret, 9, approve=True)


def test_a_rejected_return_cannot_be_requested_again(db):
    order = delivered_paid_order(db)
    ret = request_return(db, order, 1, "changed mind", [(item_ids(order)[0], 1)])
    review_return(db, ret, 9, approve=False)
    with pytest.raises(ReturnNotAllowed, match="already has a return"):
        request_return(db, order, 1, "please", [(item_ids(order)[0], 1)])


def test_return_window_is_seven_days_from_delivery(db):
    assert RETURN_WINDOW_DAYS == 7
    delivered = datetime(2026, 10, 1, 12, 0)
    order = delivered_paid_order(db, delivered=delivered)
    assert delivered_at(order) == delivered
    ok = request_return(db, order, 1, "damaged", [(item_ids(order)[0], 1)], now=delivered + timedelta(days=7))
    assert ok.status == "REQUESTED"


def test_return_after_seven_days_is_refused(db):
    delivered = datetime(2026, 10, 1, 12, 0)
    order = delivered_paid_order(db, delivered=delivered)
    with pytest.raises(ReturnWindowClosed):
        request_return(db, order, 1, "damaged", [(item_ids(order)[0], 1)],
                       now=delivered + timedelta(days=7, seconds=1))
    assert order.status == "DELIVERED" and order.returns == []


def test_only_delivered_orders_can_be_returned(db):
    order = create_order(db, order_input())
    apply_payment_result(db, order, "SUCCESS")
    with pytest.raises(ReturnNotAllowed, match="only delivered"):
        request_return(db, order, 1, "damaged", [(item_ids(order)[0], 1)])


def test_cannot_return_someone_elses_order(db):
    order = delivered_paid_order(db, user_id=2)
    with pytest.raises(OrderNotFound):
        request_return(db, order, 1, "damaged", [(item_ids(order)[0], 1)])


@pytest.mark.parametrize("bad_items", [[], [(99999, 1)], [(None, 1)], ["first-too-many"], ["zero"], ["twice"]])
def test_invalid_return_items_are_refused(db, bad_items):
    order = delivered_paid_order(db)
    first, second = item_ids(order)
    mapping = {"first-too-many": [(first, 3)], "zero": [(first, 0)], "twice": [(first, 1), (first, 1)]}
    items = mapping.get(bad_items[0], bad_items) if bad_items and isinstance(bad_items[0], str) else bad_items
    if items == [(None, 1)]:
        items = [(second + 1000, 1)]
    with pytest.raises(InvalidReturnItems):
        request_return(db, order, 1, "damaged", items)
    assert order.status == "DELIVERED"


def test_a_reason_is_required(db):
    order = delivered_paid_order(db)
    with pytest.raises(ReturnNotAllowed, match="reason"):
        request_return(db, order, 1, "   ", [(item_ids(order)[0], 1)])


def test_return_steps_must_happen_in_order(db):
    order = delivered_paid_order(db)
    ret = request_return(db, order, 1, "damaged", [(item_ids(order)[0], 1)])
    with pytest.raises(ReturnNotAllowed):
        mark_returned(db, ret, 9)
    with pytest.raises(ReturnNotAllowed):
        complete_refund(db, ret, 9)
    review_return(db, ret, 9, True)
    with pytest.raises(ReturnNotAllowed):
        complete_refund(db, ret, 9)


def test_returning_an_unpaid_cod_order_restocks_but_refunds_nothing(db):
    order = create_order(db, order_input(payment_method="COD"))
    for step in ["PROCESSING", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"]:
        update_status(db, order, step)
    ret = request_return(db, order, 1, "damaged", [(item_ids(order)[0], 1)])
    review_return(db, ret, 9, True)
    mark_returned(db, ret, 9)
    assert order.status == "RETURNED" and ret.status == "RETURNED" and ret.refund_amount is None


def test_the_returned_status_runs_the_restock_hook(db):
    seen = []
    register_status_hook(lambda s, o, old, new: seen.append(new))
    order = delivered_paid_order(db)
    ret = request_return(db, order, 1, "damaged", [(item_ids(order)[0], 1)])
    review_return(db, ret, 9, True)
    mark_returned(db, ret, 9)
    assert "RETURNED" in seen
