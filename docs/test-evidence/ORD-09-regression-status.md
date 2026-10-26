# Order module: regression status

Run on branch `feature/orders` merged with main after Rehan's inventory PR #28 (stock hook). Date of run: 2026-10-26.

## Results

| Suite | Result |
|---|---|
| Whole backend suite | 243 passed, 18 failed, 0 skipped |
| Checkpoint 4 (order + payment + inventory), COD hook and inventory integration tests | 22 passed |
| Frontend (Vitest) | 70 passed (6 files) |
| `vite build` | succeeds |
| Alembic | one head (`e7a1b9c4d602`) |
| Status hooks registered in `app/main.py` | stock (`on_order_status_change`) and COD payment (`on_cod_order_change`) |

The 18 backend failures are all in the authentication tests (`test_login.py`, `test_register.py`). They fail with
`ValueError: password cannot be longer than 72 bytes` because the `passlib` and `bcrypt` versions installed on the
test machine do not match (`bcrypt` has no `__about__`). They do not touch the order code and are unchanged by it.

## What the order tests cover

- Status allow-list, invalid transitions (for example DELIVERED to PLACED), history rows with who and when.
- Order creation priced on the server, COD confirmed at creation, online confirmed only after verified payment.
- Order from a checkout session: owner check, expiry, one use, price-changed refusal, discount applied and capped, cart emptied.
- Customer cancel and the refund start, 7-day return window, one return per order, admin approve, reject and refund.
- Admin routes: `PUT /api/admin/orders/{id}/status`, `GET /api/admin/orders/{id}`, returns routes, role checks.
- Order pages: list, tracking, cancel, return form, and the login guard.
- Checkpoint 4: stock is deducted exactly once on CONFIRMED, never again, restored on cancel, refused when there is not enough, and an online order is not confirmed or deducted until payment succeeds.
- Payment follows the order: COD gets a payments row when confirmed and is paid on delivery; a cancelled unpaid order has its payment cancelled; a paid online order keeps SUCCESS and follows the refund flow.

## Still to verify with other modules

| Item | Waiting for |
|---|---|
| Order notifications (checkpoint 5) | Aliza |
| Tax (rate is 0 until the team agrees a rule) | Team decision |
