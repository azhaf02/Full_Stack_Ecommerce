"""Pricing settings shared by the cart, checkout and order code.

TAX_RATE_PERCENT is the one flat tax rate for the whole shop, as a percentage (18 means 18%). It is read from
the environment (backend/.env) and defaults to 0.00 until the project-approved rate is confirmed. Tax is
charged on the subtotal after the discount. Cart summary, checkout review/session and order pricing must all
use this value so the customer pays what the page showed.
"""
import os
from decimal import Decimal, InvalidOperation

DEFAULT_TAX_RATE_PERCENT = "0.00"


def get_tax_rate_percent() -> Decimal:
    raw = os.getenv("TAX_RATE_PERCENT", DEFAULT_TAX_RATE_PERCENT).strip() or DEFAULT_TAX_RATE_PERCENT
    try:
        rate = Decimal(raw)
    except InvalidOperation:
        raise RuntimeError(f"TAX_RATE_PERCENT must be a number, got {raw!r}")
    if not rate.is_finite() or rate < 0 or rate > 100:
        raise RuntimeError(f"TAX_RATE_PERCENT must be between 0 and 100, got {raw!r}")
    return rate
