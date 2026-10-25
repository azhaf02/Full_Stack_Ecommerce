# CHK-09 — Final Checkout Test Case Sheet

**Project:** TLT Ecommerce  
**Module owner:** Safiya Shaikh — Checkout, Address & Shipping  
**Plan reference:** TLT Ecommerce Internship Project Plan v2.0, CHK-09  
**Verification date:** 2026-10-24

## A. Automated Regression Evidence

| ID | Test/check | Result | Evidence |
|---|---|---|---|
| AUTO-01 | Full backend regression suite | PASS | 229 passed, 0 failed; 60 warnings |
| AUTO-02 | Targeted checkout/order suite | PASS | 176 passed, 0 failed; 6 warnings |
| AUTO-03 | Frontend production build | PASS | `npm.cmd --prefix frontend run build` completed |
| AUTO-04 | Frontend lint | PASS | `npm.cmd --prefix frontend run lint` completed |

The targeted suite is a subset of the full suite. Do not add its count to the full-suite count.

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
| MAN-08 | Verify checkout uses server-calculated prices and totals | PASS | Manual verification completed; automated security tests also passed |
| MAN-09 | Place a COD order and verify successful order creation | PASS | Manually verified |
| MAN-10 | Verify the cart is empty after successful order creation | PASS | Manually verified |
| MAN-11 | Verify unauthenticated checkout is rejected | PASS | Manually verified |
| MAN-12 | Verify checkout errors are displayed clearly and allow recovery | PASS | Manually verified |

**Manual flow confirmation:** The module owner confirmed completion of the manual acceptance tests and the Cart → Checkout → Shipping → Review flow.

## C. Final Status

- Automated regression and frontend checks: **PASS**.
- Manual checkout acceptance tests: **PASS**, based on the module owner's confirmation.
- Checkout module status: **COMPLETED**.
- Product listing API: An `Internal Server Error` was observed during testing. This is a separate Product module issue and should be tracked with the responsible module owner.
- Final PR reference: **PR #60 — Merged**.
- Mentor sign-off: **NOT APPLICABLE — no mentor assigned**.

**Release decision:** **CHK-09 — COMPLETED.** Automated checks and manual checkout acceptance tests are reported complete. The separate Product listing API issue remains outside the Checkout module's scope.
