# CHK-09 — Final Checkout Test Case Sheet

**Project:** TLT Ecommerce  
**Module owner:** Safiya Shaikh — Checkout, Address & Shipping  
**Plan reference:** TLT Ecommerce Internship Project Plan v2.0, CHK-09  
**Verification date:** 2026-10-24

## A. Automated Regression Evidence

| ID | Test/check | Result | Evidence |
|---|---|---|---|
| AUTO-01 | Full backend regression suite | PASS | 238 passed, 0 failed; warning count not recorded for this run |
| AUTO-02 | Targeted checkout/order suite | PASS | 176 passed, 0 failed; 6 warnings — previously recorded result |
| AUTO-03 | Frontend production build | PASS | `npm.cmd --prefix frontend run build` completed successfully in the previously recorded verification |
| AUTO-04 | Frontend lint | PASS | `npm.cmd --prefix frontend run lint` completed successfully in the previously recorded verification |

The targeted suite is a subset of the full suite. Do not add its count to the full-suite count. The targeted checkout/order and frontend lint results above are previously recorded results, not claims that those checks were rerun alongside the latest full backend suite.

## B. Manual Checkout Acceptance Matrix

| ID | Acceptance test | Status | Notes |
|---|---|---|---|
| MAN-01 | Cart loads and displays expected items and quantities | PASS | Manually verified |
| MAN-02 | Apply a valid coupon and verify the discount | PASS | Manually verified |
| MAN-03 | Remove the coupon and verify the discount is removed | PASS | Manually verified |
| MAN-04 | Select or add a valid delivery address | PASS | Manually verified |
| MAN-05 | Verify invalid or incomplete address data is rejected | PASS | Manually verified |
| MAN-06 | Select each available shipping method and verify its charge | PASS | Manually verified |
| MAN-07 | Review subtotal, discount, shipping, tax, and final total | PASS | Manually verified |
| MAN-08 | Verify checkout uses server-calculated prices and totals | PASS | Manual verification completed; automated security tests also passed as previously reported |
| MAN-09 | Place a COD order and verify successful order creation | PASS | Manually verified |
| MAN-10 | Verify the cart is empty after successful order creation | PASS | Manually verified |
| MAN-11 | Verify unauthenticated checkout is rejected | PASS | Manually verified |
| MAN-12 | Verify checkout errors are displayed clearly and allow recovery | PASS | Manually verified |

**Manual flow confirmation:** The module owner confirmed completion of the manual acceptance tests and the Cart → Checkout → Shipping → Review flow.

## C. Final Status

- Latest recorded full backend regression result: **238 passed, 0 failed**.
- Targeted checkout/order regression: **PASS**, based on the previously recorded result.
- Frontend production build and lint: **PASS**, based on the previously recorded results.
- Manual checkout acceptance tests: **PASS**, based on the module owner's confirmation.
- Checkout module status: **COMPLETED**, based on the recorded test evidence and manual acceptance confirmation.
- Product listing API: An `Internal Server Error` was observed during testing. This is a separate Product module issue and should be tracked with the responsible module owner.
- Previously merged PR: **PR #60 — Merged**.
- Mentor sign-off: **NOT APPLICABLE — no mentor assigned**.

**Release decision:** **CHK-09 — COMPLETED**, based on the recorded automated results and module owner's manual acceptance confirmation. The separate Product listing API issue remains outside the Checkout module's scope.
