from datetime import datetime, timedelta
from decimal import Decimal
from types import SimpleNamespace

from app.services.coupon_service import (
    calculate_coupon_discount,
    validate_coupon,
)


def make_coupon(**overrides):
    values = {
        "status": True,
        "start_date": datetime.utcnow() - timedelta(days=1),
        "expiry_date": datetime.utcnow() + timedelta(days=1),
        "min_order_value": Decimal("100.00"),
        "usage_limit": 5,
        "per_user_limit": 2,
        "discount_type": "PERCENTAGE",
        "discount_value": Decimal("10.00"),
        "max_discount": Decimal("50.00"),
    }
    values.update(overrides)
    return SimpleNamespace(**values)


def test_validate_coupon_accepts_valid_coupon():
    valid, message = validate_coupon(
        make_coupon(),
        Decimal("200.00"),
        current_date=datetime.utcnow(),
        user_usage_count=0,
        total_usage_count=0,
    )

    assert valid is True
    assert message == "Coupon is valid"


def test_validate_coupon_rejects_expired_coupon():
    coupon = make_coupon(expiry_date=datetime.utcnow() - timedelta(seconds=1))

    valid, message = validate_coupon(
        coupon,
        Decimal("200.00"),
        current_date=datetime.utcnow(),
    )

    assert valid is False
    assert message == "Coupon has expired"


def test_validate_coupon_rejects_below_minimum_order():
    valid, message = validate_coupon(
        make_coupon(),
        Decimal("99.99"),
        current_date=datetime.utcnow(),
    )

    assert valid is False
    assert message == "Minimum order value not met"


def test_validate_coupon_enforces_total_and_per_user_limits():
    coupon = make_coupon()

    total_valid, total_message = validate_coupon(
        coupon, Decimal("200.00"), current_date=datetime.utcnow(),
        total_usage_count=5,
    )
    user_valid, user_message = validate_coupon(
        coupon, Decimal("200.00"), current_date=datetime.utcnow(),
        user_usage_count=2,
    )

    assert total_valid is False
    assert total_message == "Coupon usage limit exceeded"
    assert user_valid is False
    assert user_message == "Per-user coupon usage limit exceeded"


def test_percentage_discount_respects_max_discount():
    discount = calculate_coupon_discount(
        make_coupon(),
        Decimal("1000.00"),
    )

    assert discount == Decimal("50.00")


def test_fixed_discount_never_exceeds_order_value():
    coupon = make_coupon(
        discount_type="FIXED",
        discount_value=Decimal("150.00"),
        max_discount=None,
    )

    discount = calculate_coupon_discount(coupon, Decimal("100.00"))

    assert discount == Decimal("100.00")
