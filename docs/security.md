# Checkout Security

## Scope

CHK-08 - Checkout Security and Edge-Case Hardening.

Checkout review and order handoff must use trusted server-side prices and calculate totals on the server. Client-supplied prices and totals must not be trusted.

## Security Controls

- [x] Require customer authentication for checkout review.
- [x] Reject unexpected request fields.
- [x] Reject client-supplied prices, subtotals, shipping costs, and totals.
- [x] Derive prices from trusted server-side product data.
- [x] Validate product availability and selected variants.
- [x] Reject stale or tampered saved cart prices.
- [x] Calculate checkout totals on the server.
- [x] Validate checkout session ownership, status, and expiry at order handoff.
- [x] Revalidate prices during order handoff.
- [x] Validate address and shipping details at order handoff.
- [x] Test configured and untrusted CORS origins.
- [x] Run the targeted checkout security and order tests.

## Security Test Log

Run from the backend directory:

`python -m pytest -q tests\test_checkout_security.py tests\test_checkout_cors.py tests\test_checkout_legacy_session_security.py tests\test_order_create.py`

Latest verified result: 55 passed, 0 failed, 4 deprecation warnings in 8.46 seconds.

| Scenario | Expected result | Evidence |
|---|---|---|
| Checkout review without authentication | Request rejected | Automated tests passed |
| Client supplies price or total fields | Request rejected | Automated tests passed |
| Saved cart price differs from current product price | Request rejected | Automated tests passed |
| Untrusted browser origin sends CORS preflight | Origin not approved | Automated tests passed |
| Legacy checkout session endpoint lacks authentication | Request rejected | Automated tests passed |
| Checkout session ownership, status, or expiry is invalid | Order rejected | Automated tests passed |
| Product price changes before order handoff | Order rejected | Automated tests passed |
| Address or shipping details mismatch the session | Order rejected | Automated tests passed |
| Invalid, missing, or excessive quantity/item input | Request rejected | Automated tests passed |
| Client supplies totals during checkout-session order handoff | Request rejected | Automated tests passed |
| Valid order handoff | Server derives order pricing | Automated tests passed |

The automated tests use isolated test fixtures. Order creation tests verify server-derived pricing for requested quantities, and invalid quantity inputs are rejected. Live-database mutation testing was not performed.

CORS restrictions are browser controls and do not replace authentication or API authorization.

## Sign-off

Status: Targeted automated security tests passed. Server-side pricing and quantity validation are covered by automated tests. Live-database mutation testing was not performed.
