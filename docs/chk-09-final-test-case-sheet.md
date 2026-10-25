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

| ID | Acceptance test | Status | Bug ID / notes |
|---|---|---|---|
| MAN-01 | Cart loads and displays expected items and quantities | NOT VERIFIED | Cart-to-checkout flow confirmed; item and quantity checks not individually confirmed |
| MAN-02 | Apply a valid coupon and verify the discount | NOT VERIFIED | Coupon-specific verification pending |
| MAN-03 | Remove the coupon and verify the discount is removed | NOT VERIFIED | Coupon-removal verification pending |
| MAN-04 | Select or add a valid delivery address | NOT VERIFIED | Address step was part of the confirmed flow; individual validation not confirmed |
| MAN-05 | Verify invalid or incomplete address data is rejected | NOT VERIFIED | Specific validation cases not confirmed |
| MAN-06 | Select each available shipping method and verify its charge | NOT VERIFIED | Shipping step was part of the confirmed flow; each method and charge not individually confirmed |
| MAN-07 | Review subtotal, discount, shipping, tax, and final total | NOT VERIFIED | Review step was part of the confirmed flow; all totals not individually confirmed |
| MAN-08 | Verify checkout uses server-calculated prices and totals | AUTOMATED SECURITY TESTS PASS; BROWSER NOT VERIFIED | Server-side calculation browser verification pending |
| MAN-09 | Place a COD order and verify successful order creation | NOT VERIFIED | Successful COD order not individually confirmed |
| MAN-10 | Verify the cart is empty after successful order creation | NOT VERIFIED | Post-order cart check pending |
| MAN-11 | Verify unauthenticated checkout is rejected | AUTOMATED TEST COVERAGE REPORTED; BROWSER NOT VERIFIED | Browser-specific authentication check pending |
| MAN-12 | Verify checkout errors are displayed clearly and allow recovery | NOT VERIFIED | Error and recovery cases not individually confirmed |

**Manual flow confirmation:** Safiya confirmed that the Cart → Checkout → Shipping → Review flow was tested successfully in the browser. This does not independently confirm every acceptance test listed above.

## C. Final Status

- Automated regression and frontend checks: **PASS**, based on recorded results.
- Core browser checkout flow: **PASS**, based on the module owner's confirmation.
- Additional acceptance tests: **PENDING** where not individually verified.
- Product listing API: An `Internal Server Error` was reported during testing. Track separately if still reproducible; this issue has not been confirmed resolved here.
- Final PR reference: **PR #60 — Merged**.
- Mentor sign-off: **PENDING**, if required.

**Release decision:** Core checkout flow and automated checks are confirmed. Do not represent all CHK-09 acceptance criteria as complete until remaining applicable tests, any outstanding issues, and required sign-off have been verified.
