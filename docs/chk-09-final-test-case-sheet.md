# CHK-09 - Final Checkout Test Case Sheet

**Project:** TLT Ecommerce
**Module owner:** Safiya Shaikh - Checkout, Address & Shipping
**Plan reference:** TLT Ecommerce Internship Project Plan v2.0, CHK-09
**Historical evidence date recorded in source:** 2026-10-24
**Documentation review:** 2026-10-28

> **Evidence limitation:** This documentation correction does not rerun application tests or verify a browser checkout journey. Automated results below are previously recorded results, not fresh results from this review.

## A. Automated Regression Evidence

| ID | Test/check | Previously recorded result | Evidence status |
|---|---|---|---|
| AUTO-01 | Full backend regression suite | 238 passed, 0 failed; warning count not recorded | Historical result; not rerun in this review |
| AUTO-02 | Targeted checkout/order suite | 176 passed, 0 failed, 6 warnings | Historical result; not rerun in this review |
| AUTO-03 | Frontend production build | Previously reported successful | Historical result; not rerun in this review |
| AUTO-04 | Frontend lint | Previously reported successful | Historical result; not rerun in this review |

The targeted checkout/order suite is a subset of backend coverage. Do not add its count to the full-suite count. The original run output and complete evidence artifacts were not re-collected during this documentation review. A historical PASS is not a claim of a fresh run.

## B. Manual Checkout Acceptance Matrix

No supporting manual execution record was provided for independent verification during this review. Therefore, the 12 cases below remain pending.

| ID | Acceptance test | Expected result (criteria to verify; not an observed result) | Status | Evidence required |
|---|---|---|---|---|
| MAN-01 | Cart loads expected items and quantities | Current customer's cart items and quantities appear; no hard-coded demo items are shown. | PENDING | Recorded browser evidence |
| MAN-02 | Apply a valid coupon and verify the discount | Backend accepts the eligible coupon and review displays the corresponding server-calculated discount. | PENDING | Recorded browser evidence and review response |
| MAN-03 | Remove the coupon and verify the discount is removed | After recalculation, the coupon is no longer applied and its discount is removed from the review total. | PENDING | Recorded browser evidence and review response |
| MAN-04 | Select or add a valid delivery address | A saved address owned by the customer can be selected, or a valid new address can be added and selected. | PENDING | Recorded browser evidence |
| MAN-05 | Verify invalid or incomplete address data is rejected | Invalid/incomplete address data is rejected with a clear error; the customer can correct the data. | PENDING | Recorded browser evidence and API response |
| MAN-06 | Select available shipping methods and verify charges | An active shipping method can be selected and the displayed shipping charge matches the backend response. | PENDING | Recorded browser evidence and API response |
| MAN-07 | Review subtotal, discount, shipping, tax and final total | Review values match the server response; subtotal, discount, shipping, tax and total are recorded and reconciled. | PENDING | Recorded browser evidence, response and expected-value comparison |
| MAN-08 | Verify checkout uses server-calculated prices and totals | Browser-supplied prices/totals cannot override server calculations; schema-forbidden extra fields are rejected where applicable. | PENDING | Recorded end-to-end evidence; automated tests alone do not establish manual completion |
| MAN-09 | Place a COD order and verify successful order creation | A valid COD submission creates an order and provides an order reference without trusting client-supplied totals. | PENDING | Recorded browser evidence and resulting order reference |
| MAN-10 | Verify the cart is cleared after successful order creation | After confirmed successful order creation, the customer's cart is cleared according to the implemented contract. | PENDING | Recorded browser evidence before and after order |
| MAN-11 | Verify unauthenticated checkout is rejected | Checkout endpoints requiring a customer reject unauthenticated requests and do not create an order/session. | PENDING | Recorded browser evidence and API response |
| MAN-12 | Verify checkout errors are displayed clearly and allow recovery | Errors are understandable, no false success is shown, and the customer can correct input or retry safely. | PENDING | Recorded browser evidence |

Do not mark a case PASS until its evidence has been captured and reviewed. No manual flow completion is asserted by this document.

## C. Overall Status and Limitations

- Full backend regression: historical result of 238 passed and 0 failed; not freshly rerun in this review.
- Targeted checkout/order regression: historical result of 176 passed and 0 failed, with 6 warnings; not freshly rerun in this review.
- Frontend production build and lint: previously reported successful; not freshly rerun in this review.
- Manual acceptance cases MAN-01 through MAN-12: **PENDING**.
- Full browser checkout journey: **PENDING VERIFICATION**.
- Mentor sign-off: **PENDING CONFIRMATION**.
- Overall CHK-09 acceptance/release status: **NOT COMPLETE - pending verification**.

A Product listing API Internal Server Error was reported in earlier documentation as a separate Product-module issue. This review does not verify its current status or claim it is fixed.

PR #60 is referenced in earlier documentation as merged. Its independent merge status was not verified as part of this documentation-only review.

## D. Review Boundary

This document records the historical evidence currently available and identifies outstanding verification. It does not assert that application tests were rerun, manual acceptance was completed, or mentor approval was obtained.
## Historical backend test-count discrepancy

Historical documentation contains conflicting full-suite figures: an earlier record reports
229 passed and 60 warnings, while a later summary reports 238 passed and does not record
the warning count. The original test logs have not been independently reviewed here, so
this discrepancy cannot currently be reconciled and neither figure is presented as a fresh
verified run. The targeted result of 176 passed and 6 warnings is documented as a subset
of the full suite; the counts must not be added together. Before final sign-off, compare the
original run logs or perform a fresh full-suite run and record its actual output.
