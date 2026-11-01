from decimal import Decimal, ROUND_HALF_UP

from app.core.pricing_config import get_tax_rate_percent

CENT = Decimal("0.01")
ZERO = Decimal("0.00")


def _money(value) -> Decimal:
    """Convert a numeric value to a two-decimal monetary Decimal."""
    return Decimal(str(value)).quantize(CENT, rounding=ROUND_HALF_UP)


def calculate_pricing(items, tax_rate=None, discount=ZERO):
    """
    Calculate the canonical cart price breakdown.

    Order of operations:
      1. Sum unit_price * quantity into subtotal.
      2. Clamp the discount to [0, subtotal].
      3. Calculate tax on the discounted subtotal using tax_rate as a percentage.
      4. Return a non-negative total.

    Tax defaults to 0% until the project confirms the applicable rate. The same
    function should be reused by checkout; browser-supplied prices are never
    authoritative.
    """
    subtotal = sum(
        (
            _money(item.unit_price) * int(item.quantity)
            for item in items
        ),
        ZERO,
    )
    subtotal = _money(subtotal)

    requested_discount = _money(max(ZERO, _money(discount)))
    applied_discount = min(subtotal, requested_discount)

    discounted_subtotal = max(ZERO, _money(subtotal - applied_discount))
    rate = get_tax_rate_percent() if tax_rate is None else Decimal(str(tax_rate))
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
