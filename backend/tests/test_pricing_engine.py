from decimal import Decimal
from types import SimpleNamespace

import pytest

from app.services.pricing_engine import calculate_pricing


def item(unit_price, quantity):
    return SimpleNamespace(unit_price=Decimal(str(unit_price)), quantity=quantity)


def test_pricing_without_coupon_uses_decimal_and_zero_tax_by_default():
    result = calculate_pricing([item("19.99", 2), item("3.50", 1)])

    assert result == {
        "subtotal": Decimal("43.48"),
        "discount": Decimal("0.00"),
        "tax": Decimal("0.00"),
        "total": Decimal("43.48"),
    }


def test_discount_is_applied_before_tax_and_total_is_rounded():
    result = calculate_pricing(
        [item("100.00", 1)],
        tax_rate=Decimal("5"),
        discount=Decimal("10"),
    )

    assert result["subtotal"] == Decimal("100.00")
    assert result["discount"] == Decimal("10.00")
    assert result["tax"] == Decimal("4.50")
    assert result["total"] == Decimal("94.50")


def test_discount_cannot_exceed_subtotal_or_make_total_negative():
    result = calculate_pricing(
        [item("25.00", 1)],
        discount=Decimal("80.00"),
    )

    assert result["discount"] == Decimal("25.00")
    assert result["tax"] == Decimal("0.00")
    assert result["total"] == Decimal("0.00")


def test_negative_discount_is_treated_as_zero():
    result = calculate_pricing(
        [item("10.00", 1)],
        discount=Decimal("-2.00"),
    )

    assert result["discount"] == Decimal("0.00")
    assert result["total"] == Decimal("10.00")


def test_negative_tax_rate_is_rejected():
    with pytest.raises(ValueError, match="tax_rate cannot be negative"):
        calculate_pricing([item("10.00", 1)], tax_rate=Decimal("-1"))
