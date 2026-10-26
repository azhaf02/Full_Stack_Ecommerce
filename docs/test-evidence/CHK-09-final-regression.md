# CHK-09 Final Regression Evidence

## Automated test results

| Check | Result |
|---|---|
| Full backend suite | 229 passed, 60 warnings |
| Targeted checkout/order regression | 176 passed, 6 warnings |
| Frontend production build | Passed |
| Frontend lint | Passed; no reported errors |

The targeted checkout/order regression suite is part of the full backend
test coverage and must not be added to the full-suite total.

## Targeted backend test files

- `tests/test_checkout_address.py`
- `tests/test_checkout_cors.py`
- `tests/test_checkout_legacy_session_security.py`
- `tests/test_checkout_security.py`
- `tests/test_checkout_session_handoff.py`
- `tests/test_order_api.py`
- `tests/test_order_create.py`
- `tests/test_order_service.py`
- `tests/test_order_workflow.py`

## Warnings

The full backend suite reported 60 warnings. Observed categories included
Starlette TestClient/httpx deprecation, `datetime.utcnow` deprecation,
Pydantic configuration deprecation, a pytest collection warning, and an
insecure-length HMAC test-key warning.

The targeted suite reported 6 warnings. Warnings were not test failures.

## Frontend test limitation

The current frontend package has build and lint scripts but no test script.
A dedicated checkout-page test file was not found in the inspected paths.
Do not report a frontend checkout test suite as passed.

## Manual checks pending confirmation

- Complete browser flow from cart through checkout and order creation.
- Coupon application/removal and discounted total verification.
- Address and shipping selection retained through checkout review.
- Checkout-session handoff and order creation in the integrated environment.
- Mentor sign-off and final PR references to closed bug IDs.

## Status

Automated backend regression, frontend build and lint passed in the recorded
local run. Do not mark CHK-09 COMPLETED until remaining acceptance checks and
required sign-off are verified.
