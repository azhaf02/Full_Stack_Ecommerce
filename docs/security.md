# Checkout Security

## Scope

CHK-08 - Security and Edge-Case Hardening for Checkout.

Checkout review and order handoff must derive prices and totals from trusted server-side data. Client-supplied totals and prices must not be trusted.

## Security Controls

- [x] Checkout review requires customer authentication.
- [x] Reject unexpected request fields using Pydantic extra-field validation.
- [x] Reject client-supplied total, subtotal, shipping_cost, and price fields.
- [x] Read current product prices from trusted server-side data.
- [x] Validate product availability and selected variants.
- [x] Reject stale or tampered saved cart prices.
- [x] Calculate checkout totals on the server.
- [x] Verify checkout session ownership, status, and expiry at order handoff.
- [x] Revalidate prices during checkout-session order handoff.
- [x] Validate address and shipping details at order handoff.
- [x] Test configured and untrusted CORS origins.
- [x] Run the targeted checkout security and order test suite.
- [x] Record automated test evidence and limitations.

## Security Test Log

Run from the backend directory:

`python -m pytest -q tests\test_checkout_security.py tests\test_checkout_cors.py tests\test_checkout_legacy_session_security.py tests\test_order_create.py`

Latest recorded result: 55 passed, 0 failed, 4 deprecation warnings in 8.74 seconds.

| Scenario | Expected result | Evidence |
|---|---|---|
| Checkout review without authentication | Request rejected | Automated tests passed |
| Client supplies total, subtotal, shipping_cost, or price | Request rejected | Automated tests passed |
| Saved cart price differs from current product price | Request rejected | Automated tests passed |
| Untrusted browser origin sends CORS preflight | Origin not approved | Automated tests passed |
| Legacy checkout session endpoint without authentication | Request rejected | Automated tests passed |
| Checkout session ownership, status, or expiry is invalid | Order rejected | Automated tests passed |
| Product price changes before order handoff | Order rejected | Automated tests passed |
| Address or shipping details mismatch the session | Order rejected | Automated tests passed |
| Invalid, missing, or excessive quantity/item input | Request rejected | Automated tests passed |
| Client supplies total during checkout-session order handoff | Request rejected | Automated tests passed |

The automated tests use isolated test fixtures. These results do not represent live-database mutation tests. A separate test for every valid-but-altered quantity has not been confirmed by the recorded test evidence.

CORS restrictions are browser controls and do not replace authentication or API authorization.

## Sign-off

Status: Targeted automated security tests passed. Final review of the remaining quantity-tampering evidence is required.

No live-database tampering was performed as part of this test run. Do not claim that live-database verification was completed.
