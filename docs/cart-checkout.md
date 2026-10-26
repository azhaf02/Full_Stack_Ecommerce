# Cart, Coupon & Checkout Contract

Status note: this document records the code inspected on `feature/cart` and the checkout handoff branch `feat/chk-06-checkout-handoff`. A contract being documented is not evidence that the end-to-end flow has passed runtime tests.

## 1. Requirements (CART-01)

- Logged-in carts are scoped to the authenticated user.
- The PDF also requires guest carts identified by a client-side token and a guest-to-user merge at login. The inspected `feature/cart` routes currently require an authenticated user; guest-token persistence/merge is **not verified and is not implemented by those routes**.
- Product and variant prices must be read from the server-side catalogue. Quantity must be positive and stock must be rechecked when changing quantities and before checkout.
- Coupon validation must check existence, active status, start/expiry, minimum order value, overall usage, and per-customer usage. Usage must be counted from successful persisted orders/redemptions, not merely from an apply-coupon request.
- The browser is not a source of truth for price, discount, tax, or total.

## 2. Pricing sequence

The canonical service is `backend/app/services/pricing_engine.py`.

1. Subtotal = sum of each server-priced `unit_price × quantity`.
2. Discount is clamped to the range 0 through subtotal.
3. Tax is calculated on the discounted subtotal using a percentage rate.
4. Total = discounted subtotal + tax, never below zero.

Money is represented with `Decimal` and rounded to two decimal places using half-up rounding. The single parser is `backend/app/core/pricing_config.py:get_tax_rate_percent()`, which reads `TAX_RATE_PERCENT` and defaults to `0.00`; do not read or parse the environment separately in cart, checkout, or order code. The pricing engine and cart summary use this shared function. Tax is charged on the discounted subtotal. When Anas confirms the approved rate, change only `TAX_RATE_PERCENT` in `backend/.env`. Safiya's checkout review/session must use this same function/shared pricing calculation so its displayed total matches the order total. Runtime end-to-end consistency is not confirmed until tests pass.

## 3. Cart API on `feature/cart`

All routes are registered under `/api/cart`. The inspected routes use the existing bearer-token authentication dependency (`get_current_user`) and do not currently expose guest-cart endpoints.

| Method | Path | Purpose | Request / response notes |
|---|---|---|---|
| POST | `/api/cart/items` | Add or increment an item | JSON: `{ "product_id": number, "quantity": number, "variant_id": number|null }`; rejects non-positive quantity, missing/inactive product, invalid/mismatched variant, and excess stock. |
| GET | `/api/cart` | Read current user's cart | Returns `cart_id`, `items`, and `item_count`. The inspected response currently lacks joined product image/name/variant display data. |
| PUT | `/api/cart/items/{item_id}` | Change quantity | JSON: `{ "quantity": number }`; item lookup is scoped to the user's cart and stock is checked. |
| DELETE | `/api/cart/items/{item_id}` | Remove item | Item lookup is scoped to the user's cart. |
| GET | `/api/cart/summary` | Calculate price breakdown | Returns `subtotal`, `discount`, `tax`, and `total`. |
| POST | `/api/cart/coupon` | Validate/apply coupon for current cart | JSON: `{ "code": "VIORA10" }`; returns code, discount amount, subtotal, tax, and total-after-discount. |
| GET | `/api/cart/admin/coupons` | List coupons | Requires the existing admin role. |
| POST | `/api/cart/admin/coupons` | Create coupon | Requires the existing admin role; unique code/date/type/value validation is performed. |
| PUT | `/api/cart/admin/coupons/{coupon_id}` | Update coupon | Requires the existing admin role. |
| PATCH | `/api/cart/admin/coupons/{coupon_id}/deactivate` | Deactivate coupon | Requires the existing admin role. |

Note: the PDF lists admin routes as `/api/admin/coupons`; the implementation inspected on `feature/cart` instead exposes `/api/cart/admin/coupons`. These paths need an agreed contract before integration.

## 4. Checkout handoff observed

The Cart UI route wiring in `frontend/src/App.tsx` maps `/cart` to `CartPage` and its checkout callback to `/checkout`. The `DashboardLayout` sidebar has a “Shopping Cart” action that navigates to `/cart`. A separate header cart icon was not found in the inspected `DashboardLayout` file, so a Home/header-icon click-through has not been verified.

The checkout branch `feat/chk-06-checkout-handoff` contains:

- `POST /api/checkout/review`, bearer-token authenticated with the existing customer role.
- Request fields: `address_id`, `shipping_method_id`, optional `coupon_code`.
- The review code reads the authenticated user's cart, checks stock using the `inventory` table, and validates a supplied coupon. It currently performs its own subtotal/discount calculation rather than calling `calculate_pricing`; per-user coupon usage and race-safe redemption are not evident in the inspected review route.
- The Checkout UI reads the token from `localStorage.viora_token`, sends the review request, and revalidates before creating a checkout session. The inspected checkout UI still has demo fallback totals when no review result exists.

The `feature/cart` version of `backend/app/main.py` registers the cart router but does not register the checkout-review router. The checkout-review file is on a separate branch, and the branch comparison shows `feature/cart` is 84 commits behind and 10 commits ahead of `main` (diverged). Do not blindly merge or rebase this history. Safiya's checkout must be integrated through a reviewed, minimal shared-branch change before the complete flow can be accepted.

## 5. Database / migrations

- Cart models and the `0004_cart_coupons.py` migration exist on `feature/cart`.
- The migration creates `carts`, `cart_items`, and `coupons`, with foreign keys to users/products/product_variants and unique coupon codes.
- The model has a `guest_token`, but the inspected migration does not add that column. This model/migration mismatch must be reconciled with a forward-only migration before guest carts are claimed as working.
- Do not run migrations against production/shared Supabase without checking the configured database and current Alembic heads first. Never reset or drop existing tables.

## 6. Known gaps / acceptance status

- **CART-01:** Requirements and current API contract documented; guest persistence/merge and checkout agreement remain open.
- **CART-02:** Models/migration exist, but guest-token column mismatch and cross-branch migration graph need verification.
- **CART-03:** Authenticated add-to-cart and variant/quantity checks exist; guest cart and login merge are not verified.
- **CART-04:** Read/update/remove routes and Cart UI exist; joined product image/name/variant data is not returned by the inspected cart GET endpoint.
- **CART-05:** Central pricing function exists and uses Decimal; checkout reuse and live database/runtime tests are not verified.
- **CART-06:** Validation functions and persisted-order usage counting exist in the cart route; atomic redemption/overuse protection at order creation is not verified.
- **CART-07:** Admin CRUD routes and a CouponsPage file exist; frontend build and server authorization tests are not run.
- **Cart-to-order coupon handoff:** `CartPage.tsx` now stores the successfully applied coupon code in `localStorage.viora_coupon_code` and clears it when the coupon becomes invalid or a cart item is removed. The existing checkout order request sends that code as `coupon_code` to `POST /api/orders`; the backend `OrderCreate` schema and `order_pricing.price_order()` support server-side coupon pricing. This change is committed on `feature/cart`, but browser/API integration tests have not been run.
- **CART-08:** **Blocked pending integration.** Cart's `/checkout` route points to a checkout UI, but the checkout review API is on a separate branch and does not yet consume the shared pricing engine contract.
- **CART-09:** **Not signed off.** Runtime end-to-end tests, regression tests, frontend build, migration validation, and shared-branch integration have not been run from this environment.

## 7. Verification log

Repository inspection was performed through GitHub file/branch/PR APIs and the uploaded internship-plan PDF. No local checkout of the repository, configured Supabase connection, browser session, or runnable project environment was available in this tool session. Therefore no pytest, TypeScript build, browser navigation, database migration, or live API test is claimed as passed.


## 8. Follow-up inspection (2026-10-21)

- Added forward migration `backend/alembic/versions/0005_cart_guest_token.py` after `0004_cart_coupons` to add the model's nullable unique `guest_token` column/index without dropping existing rows. This migration has **not** been run against any database; validate the Alembic graph and target database before applying it.
- Safiya's PR #48 is open and not merged. It targets `feat/chk-06-checkout-handoff` from `feat/chk-07-checkpoint3`. The PR description says the frontend production build and no-coupon checkout review/order creation were manually verified by its author; coupon checkout and full Cart-to-Checkout integration remain pending. These are reported PR claims, not independently reproduced tests in this session.
- The Cart PR branch diverges from `main` (14 commits ahead, 84 behind at the latest comparison). Avoid merging/rebasing without a deliberate integration plan.


## CART-05: Central tax-rate setting

- The single setting is `TAX_RATE_PERCENT`, read by `backend/app/services/pricing_engine.py`.
- It is a percentage value, not a decimal fraction (for example, `5.00` means 5%).
- Until Anas confirms the project-approved rate, the default remains `0.00` (0%); do not assume a rate.
- `calculate_pricing` applies tax to the discounted subtotal: `tax = (subtotal - discount) × TAX_RATE_PERCENT / 100`, rounded to two decimal places using half-up rounding.
- The cart summary calls the shared pricing function and therefore uses this setting when no explicit rate is passed.
- Checkout review/session and order pricing must use this same setting/shared calculation before end-to-end totals can be considered consistent. The order-side integration is still pending; do not claim this alone completes Cart-to-Checkout tax consistency.
- No database migration is needed for this setting. Set `TAX_RATE_PERCENT` in the backend environment only after the approved rate is confirmed.
