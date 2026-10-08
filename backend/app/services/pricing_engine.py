from decimal import Decimal


def calculate_pricing(items, tax_rate=Decimal("0.00"), discount=Decimal("0.00")):
    """
    Calculate cart pricing.

    Returns:
        subtotal
        discount
        tax
        total
    """

    subtotal = Decimal("0.00")

    for item in items:
        subtotal += Decimal(str(item.unit_price)) * item.quantity

    discount = max(Decimal("0.00"), Decimal(str(discount)))

    discounted_subtotal = max(
        Decimal("0.00"),
        subtotal - discount
    )

    tax = discounted_subtotal * Decimal(str(tax_rate)) / Decimal("100")

    total = max(
        Decimal("0.00"),
        discounted_subtotal + tax
    )

    return {
        "subtotal": subtotal,
        "discount": discount,
        "tax": tax,
        "total": total,
    }