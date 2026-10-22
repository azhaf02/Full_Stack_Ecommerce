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
- [x] Read current product prices from trusted server-side data.
- [x] Validate product availability and selected variants.
- [x] Reject stale or tampered saved cart prices with HTTP 409.
- [x] Calculate checkout totals on the server.
- [x] Verify checkout session ownership, status, and expiry at order handoff.
- [x] Revalidate prices during checkout-session order handoff.
- [x] Reject mismatched address and shipping details at order handoff.
- [x] Verify CORS does not approve an untrusted browser origin.
- [x] Run the targeted checkout security and order test suite successfully.
- [x] Document automated security test evidence and limitations.

## Security Test Log

Run from the backend directory:

`python -m pytest -q tests\test_checkout_security.py tests\test_checkout_cors.py tests\test_checkout_legacy_session_security.py tests\test_order_create.py`

Verified result: 55 passed, 0 failed, 4 deprecation warnings in 8.74 seconds.

| Scenario | Expected result | Result |
|---|---|---|
| Checkout review without authentication | HTTP 401 | PASS |
| Client supplies total, subtotal, shipping_cost, or price | HTTP 422 | PASS |
| Saved cart price differs from current product price | HTTP 409 | PASS |
| Configured frontend origin sends CORS preflight | Origin allowed | PASS |
| Untrusted origin sends CORS preflight | Origin not approved | PASS |
| Legacy checkout session endpoint without authentication | Request rejected | PASS |
| Checkout session belongs to another customer | Order rejected | PASS |
| Checkout session is missing, expired, or completed | Order rejected | PASS |
| Product prices changed after checkout | Order rejected; session remains active | PASS |
| Address or shipping details mismatch the session | Order rejected | PASS |
| Client supplies total with checkout-session order | HTTP 422 | PASS |
| Invalid quantity values, including zero, negative, or above the limit | Request rejected | PASS |
| Missing quantity or excessive number of items | Request rejected | PASS |
| Successful order handoff | Server-derived order created and session consumed | PASS |

The automated tests use isolated test fixtures. The test results above
do not represent live-database mutation tests. A separate test proving
rejection of every possible valid-but-altered quantity has not been
recorded here. CORS restrictions are browser controls and do not replace
authentication or API authorization.

## Sign-off

Status: Targeted automated security test suite passed.

The automated evidence supports server-side pricing, rejection of
client-supplied totals and prices, authentication checks, CORS checks,
quantity validation, and checkout-session handoff protections.

No live-database tampering was performed as part of this test run.
