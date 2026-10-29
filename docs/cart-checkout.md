# Cart and Checkout

## Shipping method selection

The checkout flow loads active shipping methods from the backend:

`GET /api/shipping-methods`

Shipping methods are stored in the `shipping_methods` database table.

The documented options are:

- Standard Delivery
- Express Delivery
- Same Day Delivery

Confirm availability and the current charge from the API response rather than assuming a fixed charge in documentation.

## Shipping validation

A shipping method must be selected before the customer can continue to checkout review. When no shipping method is selected, the frontend should display a clear validation message, such as:

`Please select a shipping method.`

## Server-side pricing

Checkout prices and totals must be calculated or validated by the backend. Do not trust prices, discounts, shipping costs, tax amounts, or totals supplied by the browser.

Expected contract only—not verified as implemented on `origin/integration-v2`: a checkout review/session flow should validate relevant cart items, stock, address, shipping method, coupon and pricing data, with a server-generated snapshot used for handoff. The singular routes `POST /api/checkout/review` and `POST /api/checkout/session` were not found in the inspected source, so this expected behavior must not be treated as a verified implementation on that branch.

Tax and discount behavior must follow the active shared pricing configuration and the applicable backend path. Older notes stating that tax and discount are always zero are not authoritative after the shared pricing configuration changes. Do not document a fixed rate unless it has been verified against the active configuration.

## Checkout API flow

### Review route — unverified reference

`POST /api/checkout/review` is an intended route reference, not a verified implementation in the inspected `origin/integration-v2` source. Its request fields, authentication, validation, and response contract have not been verified on that branch. Do not treat the route as available until its implementation is located and reviewed.

### Create checkout session — unverified reference

`POST /api/checkout/session` was not found in the inspected `origin/integration-v2` source. Its authentication, validation, response fields, expiry behavior, and snapshot contract therefore remain unverified on that branch.
### Payment/order handoff

The frontend should retain and pass `checkout_reference_id` only when required by the verified target API contract. The singular checkout handoff route was not found in the inspected `origin/integration-v2` source, so its implementation and snapshot behavior remain unverified. The receiving module must follow the actual implementation and must not trust browser-supplied totals.

`POST /api/orders` is also part of the project order API. See the Order creation section below for the source-inspected request contract and the distinction between checkout-reference and direct-items order paths. This documentation does not replace runtime or manual acceptance evidence.

## CHK-06: Checkout-to-order handoff

The intended checkout-session contract would carry validated checkout information from review to the next stage, using server-generated data rather than browser-supplied prices or totals. However, the singular checkout-session route was not found in the inspected `origin/integration-v2` source; the existence and contents of a snapshot for that handoff are not verified on this branch.

Any changes to the handoff contract should be coordinated with the responsible module owner. Do not describe the intended snapshot handoff as implemented until its actual route and behavior are verified.

## CHK-07: Checkpoint 3 integration - Cart, Checkout, Address and Shipping

### Expected customer flow

Cart -> Coupon -> Address -> Shipping -> Review -> Order handoff

### Verification status

- Frontend production build: previously reported successful; not rerun in this documentation review.
- No-coupon checkout/order flow: previously documented as manually verified; the evidence was not independently rechecked here.
- Coupon application and discounted checkout: **PENDING VERIFICATION**.
- Full Cart-to-Checkout integration: **PENDING FINAL VERIFICATION**.
- Mentor sign-off: **PENDING**.

### Integration requirements

- Checkout must use actual cart items, not hard-coded demo items.
- Address and shipping selections must be retained through review.
- Prices, discounts, shipping costs and totals must be validated server-side.
- Order handoff must use the server-generated checkout reference as required by the current API contract.
- Cart implementation remains the responsibility of the Cart module owner.

Do not mark Checkpoint 3 complete until the outstanding checks are confirmed with supporting evidence.

## CHK-09: Final testing, bug fixing and documentation

### Historical automated regression results

The following results were previously recorded. They were not rerun during this documentation review.

- Full backend regression: **238 passed, 0 failed**; warning count not recorded.
- Targeted checkout/order regression: **176 passed, 0 failed, 6 warnings**.
- Frontend production build: previously reported successful.
- Frontend lint: previously reported successful.

The targeted suite is a subset of the full backend suite; do not add its count to the full-suite count. A historical result is not evidence of a fresh run.

### Manual acceptance and outstanding work

The complete browser journey has not been independently verified in this documentation review. The following remain pending:

- Cart loading and expected quantities.
- Coupon apply/remove and discount verification.
- Address selection and invalid-address rejection.
- Shipping method selection and charge verification.
- Review subtotal, discount, shipping, tax and final total.
- Server-side pricing behavior during checkout.
- COD order creation and cart clearing.
- Authentication rejection and error/recovery behavior.
- Applicable final bug/PR reference verification.
- Mentor sign-off confirmation.

Refer to `docs/chk-09-final-test-case-sheet.md` for the complete 12-case matrix and `docs/test-evidence/CHK-09-final-regression.md` for the summarized evidence status.

### Scope limitations

A Product listing API Internal Server Error was reported in earlier project documentation as a separate Product-module issue. Its current status was not verified here, and this checkout documentation does not claim it is fixed.

PR #60 is referenced in earlier documentation as merged. Independent verification of its merge status was not performed in this review.

### Final status

- Automated results: **HISTORICAL - NOT RERUN IN THIS REVIEW**.
- Manual checkout acceptance: **PENDING VERIFICATION**.
- Mentor sign-off: **PENDING CONFIRMATION**.
- Overall CHK-09 status: **NOT COMPLETE - pending verification**.

Do not mark CHK-09 complete until manual acceptance evidence and the required sign-off are confirmed.

## CHK-09 API contract reference

The following route findings were checked against `origin/integration-v2` source. They describe source inspection only, not successful runtime or browser testing.

### Checkout review and singular handoff routes

The inspected `integration-v2` source did not contain the singular routes `POST /api/checkout/review` or `POST /api/checkout/session`. Therefore, this document does not claim that these endpoints are implemented on that branch. The checkout-reference snapshot handoff contract must be verified against the actual target implementation before it is documented as available.

### Plural checkout-session lifecycle API

The router is mounted at `/api/checkout/sessions`:

- `POST /api/checkout/sessions` accepts a `customer_id` in its request body and returns `session_id`, `customer_id`, `status`, `created_at` and `expires_at`.
- The inspected `POST` handler has no customer-authentication dependency.
- `GET /api/checkout/sessions/{session_id}` fetches a session by its ID. The inspected handler has no owner check and no customer-authentication dependency.
- The `GET` handler returns 404 when the session is missing and 410 when its status is inactive or its expiry has passed.
- The checkout-session model sets a default expiry 30 minutes after creation.

Do not describe these plural lifecycle handlers as authenticated or owner-scoped; the inspected source does not support those claims. Although the router defines `customer_only`, neither plural session handler declares that dependency. These routes are distinct from the singular checkout handoff routes, which were not found on `integration-v2`.

### Verification boundary

These are source-review findings only. They do not establish that any endpoint, manual acceptance case, or end-to-end journey executed successfully. Keep all manual cases pending until evidence is captured.

## Historical backend test-count discrepancy

Historical documentation contains conflicting full-suite figures: an earlier record reports
229 passed and 60 warnings, while a later summary reports 238 passed and does not record
the warning count. The original test logs have not been independently reviewed here, so
this discrepancy cannot currently be reconciled and neither figure is presented as a fresh
verified run. The targeted result of 176 passed and 6 warnings is documented as a subset
of the full suite; the counts must not be added together. Before final sign-off, compare the
original run logs or perform a fresh full-suite run and record its actual output.

## Additional verified API details

### Active shipping methods

`GET /api/shipping-methods` returns active shipping methods. The inspected response schema contains:

- `id`: shipping method identifier
- `name`: display name
- `cost`: shipping charge
- `estimated_days`: estimated delivery duration in days
- `status`: active/inactive flag

The inspected handler filters for active methods and orders results by identifier. Confirm current charges from the API response; do not hard-code them.

### Order creation

`POST /api/orders`

Authentication: the inspected order route requires a customer bearer token. The endpoint returns HTTP `201 Created` with an order detail response.

The inspected direct-order request accepts `payment_method` (`ONLINE` or `COD`) and an `items` list. Each item contains `product_id`, optional `variant_id`, and `quantity` from 1 to 100; the direct path also requires `address_id` and `shipping_method_id`. The inspected `integration-v2` source did not show the documented `checkout_reference_id` snapshot handoff contract; do not present that path as implemented on this branch without additional source evidence.

Client-supplied prices, discounts, shipping charges, taxes and totals must not be trusted.

According to the inspected order-service logic, COD orders are confirmed after creation. Online orders remain `PLACED` until the payment module reports verified `SUCCESS`, at which point confirmation is allowed. These are source-contract details, not evidence of a successful manual test.

## CHK-09 Documentation Scope

These CHK-09 documents are supplemental documentation deliverables. They do not replace the existing docs/final_test_case_sheet.csv, docs/generated/integration_test_log.txt, or docs/test-evidence/ORD-04-order-status-transitions.md. Those remain separate project artifacts; their historical contents are not treated as newly verified CHK-09 acceptance evidence.
