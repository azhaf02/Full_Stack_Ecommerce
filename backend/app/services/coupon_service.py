from datetime import datetime
from decimal import Decimal


def validate_coupon(coupon, order_value, current_date=None):
    """
    Validate a coupon against the cart/order value.
    """

    if current_date is None:
        current_date = datetime.utcnow()

    if coupon is None:
        return False, "Invalid coupon code"

    if not coupon.status:
        return False, "Coupon is inactive"

    if current_date < coupon.start_date:
        return False, "Coupon is not active yet"

    if current_date > coupon.expiry_date:
        return False, "Coupon has expired"

    if (
        coupon.min_order_value is not None
        and Decimal(str(order_value)) < Decimal(str(coupon.min_order_value))
    ):
        return False, "Minimum order value not met"

    if (
        coupon.usage_limit is not None
        and coupon.usage_limit <= 0
    ):
        return False, "Coupon usage limit exceeded"

    return True, "Coupon is valid"


def calculate_coupon_discount(coupon, order_value):
    """
    Calculate the discount amount for a valid coupon.
    """

    order_value = Decimal(str(order_value))
    discount_value = Decimal(str(coupon.discount_value))

    if coupon.discount_type.lower() == "percentage":
        discount = (
            order_value * discount_value / Decimal("100")
        )

        if coupon.max_discount is not None:
            max_discount = Decimal(str(coupon.max_discount))
            discount = min(discount, max_discount)

    elif coupon.discount_type.lower() == "fixed":
        discount = discount_value

    else:
        return Decimal("0.00")

    # Discount can never be greater than cart value.
    discount = min(discount, order_value)

    return max(Decimal("0.00"), discount)