# Order module: regression status

Run on branch `feature/orders` (includes main as of the CHK-06 review). Date of run: 2026-10-19.

## Results

| Suite | Result |
|---|---|
| Order backend tests (`test_order_service`, `test_order_workflow`, `test_order_api`, `test_order_create`) | 160 passed |
| Whole backend suite | 199 passed, 18 failed |
| Frontend (Vitest) | 70 passed (6 files) |
| `vite build` | succeeds |

The 18 backend failures are all in the authentication tests (`test_login.py`, `test_register.py`). They fail with
`ValueError: password cannot be longer than 72 bytes` because the `passlib` and `bcrypt` versions installed on the
test machine do not match (`bcrypt` has no `__about__`). They do not touch the order code.

Trial merge of Rehan's PR #28 (stock hook) with this branch: 209 passed, same 18 auth failures.

## What the order tests cover

- Status allow-list, invalid transitions (for example DELIVERED to PLACED), history rows with who and when.
- Order creation priced on the server, COD confirmed at creation, online confirmed only after verified payment.
- Order from a checkout session: owner check, expiry, one use, price-changed refusal, discount applied and capped.
- Customer cancel and the refund start, 7-day return window, one return per order, admin approve, reject and refund.
- Admin routes: `PUT /api/admin/orders/{id}/status`, `GET /api/admin/orders/{id}`, returns routes, role checks.
- Order pages: list, tracking, cancel, return form, and the login guard (visitors go to /login, admins go to /).

## Still to verify once the other modules are on main

| Item | Waiting for |
|---|---|
| Stock deducted exactly once on CONFIRMED, restocked on cancel and return | Rehan, PR #28 |
| Coupon recorded on the order, tax, cart cleared after an order | Zubiya, PR #22 (needs a rebase on main) |
| Checkout page sends only `checkout_reference_id` and `payment_method` | Safiya, PR #39 / #47 |
| Admin order detail page uses `GET /api/admin/orders/{id}` | Rishi |
| Order notifications | Aliza |
