
import os
from decimal import Decimal, ROUND_HALF_UP
from collections.abc import Mapping

CENT = Decimal("0.01")
ZERO = Decimal("0.00")


def _money(value) -> Decimal:
    """Convert a numeric value to a two-decimal monetary Decimal."""
    return Decimal(str(value)).quantize(CENT, rounding=ROUND_HALF_UP)


def _get_item_value(item, key):
    """Read a value from either a dictionary or an object."""
    if isinstance(item, Mapping):
        return item[key]

    return getattr(item, key)


def calculate_pricing(items, tax_rate=None, discount=ZERO):
    """
    Calculate the canonical cart price breakdown.

    Order of operations:
      1. Sum unit_price * quantity into subtotal.
      2. Clamp the discount to [0, subtotal].
      3. Calculate tax on the discounted subtotal.
      4. Return a non-negative total.
    """
    subtotal = ZERO

    for item in items:
        unit_price = _money(_get_item_value(item, "unit_price"))
        quantity = int(_get_item_value(item, "quantity"))
        subtotal += unit_price * quantity

    subtotal = _money(subtotal)

    requested_discount = _money(max(ZERO, _money(discount)))
    applied_discount = min(subtotal, requested_discount)

    discounted_subtotal = max(ZERO, _money(subtotal - applied_discount))

    # Read the environment variable at calculation time so tests and
    # runtime configuration changes are picked up without reloading.
    rate = (
        Decimal(os.getenv("TAX_RATE_PERCENT", "0.00"))
        if tax_rate is None
        else Decimal(str(tax_rate))
    )

    if rate < 0:
        raise ValueError("tax_rate cannot be negative")

    tax = _money(discounted_subtotal * rate / Decimal("100"))
    total = max(ZERO, _money(discounted_subtotal + tax))

    return {
        "subtotal": subtotal,
        "discount": applied_discount,
        "tax": tax,
        "total": total,
    }
