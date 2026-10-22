# Checkout Security

## Scope

CHK-08 - Security and Edge-Case Hardening for Checkout.

Checkout review and order handoff must derive prices and totals from
trusted server-side data. Client-supplied totals and prices must not
be trusted.

## Security Controls

- [x] Checkout review requires customer authentication.
- [x] Reject unexpected request fields using Pydantic extra-field validation.
- [x] Reject client-supplied total, subtotal, shipping_cost, and price fields.
- [x] Read the current product price from the database.
- [x] Validate product availability and selected variants.
- [x] Reject stale or tampered saved cart prices with HTTP 409.
- [x] Calculate checkout totals on the server.
- [x] Verify checkout session ownership, status, and expiry at order handoff.
- [x] Revalidate prices during checkout-session order handoff.
- [x] Reject mismatched address and shipping details at order handoff.
- [x] Verify CORS does not approve an untrusted browser origin.
- [ ] Complete live-database tampering checks and final security review.

## Security Test Log

Targeted automated test command, run from the backend directory:

`python -m pytest -q tests\test_checkout_security.py tests\test_checkout_cors.py tests\test_checkout_legacy_session_security.py tests\test_order_create.py`

Result: 55 passed, 0 failed, 4 deprecation warnings.

| Scenario | Expected result | Result |
|---|---|---|
| Checkout review without authentication | HTTP 401 | PASS |
| Client supplies total, subtotal, shipping_cost, or price | HTTP 422 | PASS |
| Saved cart price differs from current product price | HTTP 409 | PASS |
| Checkout CORS preflight from configured frontend origin | Origin allowed | PASS |
| Checkout CORS preflight from untrusted origin | Origin not approved | PASS |
| Checkout session belongs to another customer | Order rejected | PASS |
| Checkout session is missing, expired, or completed | Order rejected | PASS |
| Product prices changed after checkout | Order rejected; session remains active | PASS |
| Address or shipping details mismatch session | Order rejected | PASS |
| Client supplies total with checkout-session order | HTTP 422 | PASS |
| Successful order handoff | Server-derived order created and session consumed | PASS |

The automated tampering and handoff tests include isolated test fixtures.
Live-database tampering checks have not yet been confirmed and remain
pending. CORS restrictions are browser controls, not a substitute for
authentication or API authorization.

## Sign-off

Status: Pending live-database verification and final review.

Do not mark CHK-08 fully complete until the remaining verification item
has been tested and reviewed.
