from datetime import datetime, timedelta
from decimal import Decimal
from types import SimpleNamespace

from app.services.coupon_service import (
    calculate_coupon_discount,
    validate_coupon,
)


def make_coupon(**overrides):
    now = datetime.utcnow()
    values = {
        "status": True,
        "start_date": now - timedelta(days=1),
        "expiry_date": now + timedelta(days=1),
        "min_order_value": None,
        "usage_limit": None,
        "per_user_limit": None,
        "discount_type": "PERCENTAGE",
        "discount_value": Decimal("10"),
        "max_discount": None,
    }
    values.update(overrides)
    return SimpleNamespace(**values)


def test_percentage_discount():
    coupon = make_coupon(discount_type="PERCENTAGE")
    assert calculate_coupon_discount(coupon, Decimal("200")) == Decimal("20")


def test_percentage_discount_respects_max_discount():
    coupon = make_coupon(
        discount_type="percentage",
        discount_value=Decimal("50"),
        max_discount=Decimal("25"),
    )
    assert calculate_coupon_discount(coupon, Decimal("200")) == Decimal("25")


def test_fixed_discount_cannot_exceed_order_value():
    coupon = make_coupon(
        discount_type="FIXED",
        discount_value=Decimal("500"),
    )
    assert calculate_coupon_discount(coupon, Decimal("100")) == Decimal("100")


def test_unknown_discount_type_returns_zero():
    coupon = make_coupon(discount_type="other")
    assert calculate_coupon_discount(coupon, Decimal("100")) == Decimal("0.00")


def test_inactive_coupon_is_rejected():
    valid, message = validate_coupon(make_coupon(status=False), Decimal("100"))
    assert not valid
    assert message == "Coupon is inactive"


def test_minimum_order_value_is_enforced():
    coupon = make_coupon(min_order_value=Decimal("100"))
    valid, message = validate_coupon(coupon, Decimal("50"))
    assert not valid
    assert message == "Minimum order value not met"


def test_total_usage_limit_is_enforced():
    coupon = make_coupon(usage_limit=5)
    valid, message = validate_coupon(
        coupon, Decimal("100"), total_usage_count=5
    )
    assert not valid
    assert message == "Coupon usage limit exceeded"


def test_per_user_usage_limit_is_enforced():
    coupon = make_coupon(per_user_limit=1)
    valid, message = validate_coupon(
        coupon, Decimal("100"), user_usage_count=1
    )
    assert not valid
    assert message == "Per-user coupon usage limit exceeded"
