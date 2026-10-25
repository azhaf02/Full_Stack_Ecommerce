# CHK-09 — Final Checkout Test Case Sheet

**Project:** TLT Ecommerce  
**Module owner:** Safiya Shaikh — Checkout, Address & Shipping  
**Plan reference:** TLT Ecommerce Internship Project Plan v2.0, CHK-09  
**Verification date:** 2026-10-24

## A. Automated regression evidence

| ID | Test/check | Result | Evidence |
|---|---|---|---|
| AUTO-01 | Full backend regression suite | PASS | 229 passed, 0 failed; 60 warnings |
| AUTO-02 | Targeted checkout/order suite | PASS | 176 passed, 0 failed; 6 warnings |
| AUTO-03 | Frontend production build | PASS | `npm.cmd --prefix frontend run build` completed |
| AUTO-04 | Frontend lint | PASS | `npm.cmd --prefix frontend run lint` completed |

The targeted suite is a subset of the full suite; its count must not be added to the full-suite count.

## B. Manual checkout acceptance matrix

Mark PASS only after personally verifying the flow in the browser. Record failures and bug IDs in the final column.

| ID | Acceptance test | Status | Bug ID / notes |
|---|---|---|---|
| MAN-01 | Cart loads and displays the expected items and quantities | NOT VERIFIED | |
| MAN-02 | Apply a valid coupon and verify the discount | NOT VERIFIED | |
| MAN-03 | Remove the coupon and verify the discount is removed | NOT VERIFIED | |
| MAN-04 | Select or add a valid delivery address | NOT VERIFIED | |
| MAN-05 | Verify invalid or incomplete address data is rejected | NOT VERIFIED | |
| MAN-06 | Select each available shipping method and verify its charge | NOT VERIFIED | |
| MAN-07 | Review subtotal, discount, shipping, tax, and final total | NOT VERIFIED | |
| MAN-08 | Verify checkout uses server-calculated prices and totals | AUTOMATED SECURITY TESTS PASS; BROWSER NOT VERIFIED | |
| MAN-09 | Place a COD order and verify successful order creation | NOT VERIFIED IN THIS FINAL RUN | |
| MAN-10 | Verify the cart is empty after successful order creation | NOT VERIFIED | |
| MAN-11 | Verify unauthenticated checkout is rejected | AUTOMATED TEST COVERAGE REPORTED; BROWSER NOT VERIFIED | |
| MAN-12 | Verify checkout errors are displayed clearly and allow recovery | NOT VERIFIED | |

## C. Final status

- Automated regression and frontend checks: PASS, based on the recorded runs above.
- Manual end-to-end acceptance: PENDING.
- QA bug fixes and closed bug IDs: PENDING verification.
- Final PR reference: PENDING.
- Mentor sign-off: PENDING.

**Release decision:** Do not mark CHK-09 COMPLETED until all applicable acceptance criteria are verified, QA issues are resolved and referenced, and required sign-off is obtained.
