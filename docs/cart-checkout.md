# Cart, Coupon, Checkout & Shipping Contract

## 1. Purpose and Status

This document records the Cart, Coupon, Checkout, Address, Shipping and Order API contracts inspected during branch integration.

Documented functionality is not proof that the complete end-to-end flow has passed runtime tests. Verify the current branch and database before claiming acceptance.

## 2. Core Requirements

- Logged-in carts must be scoped to the authenticated user.
- Guest carts and guest-to-user merging require separate verification.
- Product and variant prices must come from the server-side catalogue.
- Quantity must be positive and stock must be rechecked when updating quantities and before order creation.
- Coupon validation must check existence, active status, start/expiry, minimum order value, overall usage and per-customer usage.
- Coupon usage must be based on successful persisted orders/redemptions.
- The browser must not be trusted for product prices, discounts, tax or totals.
- Address selection and shipping methods must be validated before order creation.
- Checkout must use the shared pricing implementation rather than introducing a separate pricing formula.

## 3. Cart API

Cart routes are registered under `/api/cart`.

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/cart/items` | Add or increment a cart item |
| GET | `/api/cart` | Read the current user's cart |
| PUT | `/api/cart/items/{item_id}` | Change item quantity |
| DELETE | `/api/cart/items/{item_id}` | Remove an item |
| GET | `/api/cart/summary` | Calculate cart price breakdown |
| POST | `/api/cart/coupon` | Validate/apply a coupon |
| GET | `/api/cart/admin/coupons` | List coupons (admin) |
| POST | `/api/cart/admin/coupons` | Create a coupon (admin) |
| PUT | `/api/cart/admin/coupons/{coupon_id}` | Update a coupon (admin) |
| PATCH | `/api/cart/admin/coupons/{coupon_id}/deactivate` | Deactivate a coupon (admin) |

### Cart Request and Response Notes

- Add item JSON: `product_id`, `quantity`, and optional `variant_id`.
- Quantity must be positive.
- Product and variant must exist and be valid.
- Stock must be checked before accepting the requested quantity.
- Cart reads return the cart ID, items and item count.
- Cart summary returns subtotal, discount, tax and total.
- Coupon application accepts a code and returns the validated discount and updated price breakdown.

The inspected Cart implementation did not expose guest-cart endpoints. Guest persistence and login merging must not be claimed as complete without verification.

The admin coupon paths above are the paths documented for the inspected Cart implementation. An earlier project contract listed `/api/admin/coupons`; confirm the agreed route contract before changing either implementation.

## 4. Shared Pricing Rules

The canonical pricing service is:

`backend/app/services/pricing_engine.py`

Pricing sequence:

1. Subtotal = sum of server-priced unit price multiplied by quantity.
2. Discount is clamped between zero and subtotal.
3. Tax is calculated on the discounted subtotal.
4. Total = discounted subtotal + tax.

Money must use `Decimal` and be rounded to two decimal places using half-up rounding.

### Tax Rate

- The shared setting is `TAX_RATE_PERCENT`.
- It represents a percentage, not a decimal fraction.
- For example, `5.00` means 5%.
- The default is `0.00` (0%) until the project-approved rate is confirmed.
- Tax is calculated on the discounted subtotal.
- Checkout review, checkout session and order pricing must use the same shared calculation.

Do not assume or configure a tax rate without project approval.

## 5. Address and Checkout Handoff

The Cart UI navigates to `/checkout` through its checkout action.

The Checkout flow must:

- Identify the authenticated customer.
- Load the customer's saved addresses.
- Allow a new address.
- Validate the address.
- Load actual cart items and quantities.
- Obtain server prices.
- Load shipping methods.
- Validate shipping.
- Revalidate before submission.

The UI must not rely on demo products or fallback totals.

## 6. Checkout Review and Order Handoff

The inspected checkout handoff has POST `/api/checkout/review`, bearer token, customer role, `address_id`, `shipping_method_id` and optional `coupon_code`.

Cart, stock and coupon validation must happen on the backend.

Historical issue: separate checkout review pricing logic needed alignment with shared pricing. Verify the current merged implementation.

Coupon code handoff uses `localStorage.viora_coupon_code`. Backend must validate and reprice; browser data is not trusted.

## 7. Shipping Methods

- API: GET `/api/shipping-methods`
- Database table: `shipping_methods`
- Fields: `id`, `name`, `cost`, `estimated_days`, `status`
- Only active methods should be returned.

Standard, Express and Same Day are examples. Actual database records control available methods.

Shipping must be selected before review. If no method is selected, show:

`Please select a shipping method.`

Frontend may display an estimated total; backend independently calculates and validates the final amount.

## 8. Order Creation and Pricing

The order request may include:

- `address_id`
- `shipping_method_id`
- `payment_method`
- `items`
- Optional coupon code, if supported by the current API.

The frontend must not send trusted prices or totals.

The backend must verify:

- Customer authentication.
- Address ownership.
- Active shipping method.
- Product, variant and quantity validity.
- Stock availability.
- Database product prices.
- Coupon validity.
- Shared pricing calculation.

The backend must persist the order and order items and return the order details.

## 9. Database and Migrations

Cart tables include:

- `carts`
- `cart_items`
- `coupons`

There was a historical `guest_token` migration mismatch. Verify the current migrations and database schema.

Before migration work:

- Check the database connection.
- Check current Alembic heads and migration graph.
- Use forward-only migrations.
- Never reset or drop shared database data.
- Do not run shared Supabase migrations without approval.

## 10. Known Gaps and Acceptance Checks

The following require verification against the current merged implementation:

- Guest cart and guest-to-user merging.
- Joined cart display data.
- Shared pricing consistency.
- Coupon usage and race safety.
- Coupon redemption persistence after order creation.
- Tax consistency.
- Checkout review, session and order API registration.
- Full login-to-order-confirmation flow.
- Database migrations.
- Frontend and backend regression tests.

Do not treat documentation or earlier branch results as proof of current acceptance.

## 11. Shipping and Checkout API Flow

Customer Login → Saved Addresses → Cart → Summary/Coupon → Shipping Methods → Address and Shipping Selection → Checkout Review → Server Validation → Order Creation → Final Server Pricing → Order Persistence → Confirmation.

## 12. Verification Record

Earlier notes are historical.

For final acceptance, record actual observed results for:

- Backend tests.
- Frontend build.
- Cart and checkout API integration.
- Address and shipping functionality.
- Coupon and pricing validation.
- Order creation and confirmation.
- Regression testing.

Only record checks that were actually executed and verified.