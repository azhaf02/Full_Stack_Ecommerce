# Order Management

Owner: Rukhsar Shaikh (`feature/orders`). Schema: see [database.md](database.md).

## Purpose

Create orders reliably and give customers visibility and control over their order lifecycle: creation from checkout and payment, status tracking, cancellation, and returns/refunds. Admins progress orders through the lifecycle.

## Order statuses

Main flow: `PLACED` → `CONFIRMED` → `PROCESSING` → `PACKED` → `SHIPPED` → `OUT_FOR_DELIVERY` → `DELIVERED`

Additional: `CANCELLED`, `RETURN_REQUESTED`, `RETURN_APPROVED`, `RETURNED`, `REFUND_PENDING`, `REFUNDED`

## Allowed transitions

Only these changes are accepted. Anything else is rejected by the backend (never trusted from the client), and every accepted change is written to `order_status_history`.

| From | To |
|---|---|
| PLACED | CONFIRMED, CANCELLED |
| CONFIRMED | PROCESSING, CANCELLED |
| PROCESSING | PACKED, CANCELLED |
| PACKED | SHIPPED |
| SHIPPED | OUT_FOR_DELIVERY |
| OUT_FOR_DELIVERY | DELIVERED |
| DELIVERED | RETURN_REQUESTED |
| RETURN_REQUESTED | RETURN_APPROVED, DELIVERED (return rejected) |
| RETURN_APPROVED | RETURNED |
| RETURNED | REFUND_PENDING |
| CANCELLED | REFUND_PENDING (only if paid online) |
| REFUND_PENDING | REFUNDED |

```
PLACED → CONFIRMED → PROCESSING → PACKED → SHIPPED → OUT_FOR_DELIVERY → DELIVERED
   │         │            │                                                │
   └─────────┴────────────┴──→ CANCELLED ──(paid online)──┐               ↓
                                                          │        RETURN_REQUESTED → RETURN_APPROVED → RETURNED
                                                          ↓                │ (rejected)                    │
                                                    REFUND_PENDING ←───────┼───────────────────────────────┘
                                                          ↓                ↓
                                                      REFUNDED         DELIVERED
```

## Payment, order and inventory rules

Agreed with Payment (Aaliya) and Inventory (Rehan) in the Payment-Order-Inventory integration guide.

- An online-paid order is confirmed **only after the backend has verified** a payment `SUCCESS`. The frontend saying it succeeded is not enough.
- Payment `FAILED` or `CANCELLED`: the order is not confirmed and stock is not deducted.
- Stock is deducted **exactly once**, when the order is confirmed, in the same database transaction.
- Stock is restored when an order is cancelled after it was confirmed, and when a return reaches `RETURNED`.
- Payment statuses: `PENDING`, `SUCCESS`, `FAILED`, `CANCELLED`, `REFUND_PENDING`, `REFUNDED`.
- The order keeps `payment_status` consistent with the payment record. Payment updates it through the order module.

## Cancellation

A customer can cancel only while the order is `PLACED`, `CONFIRMED` or `PROCESSING`. Once `PACKED` or later it is blocked with a clear message. Cancelling moves the order to `CANCELLED`, restocks inventory if stock had been deducted, and starts a refund if the order was paid online.

## Returns and refunds

Customer requests a return → admin approves or rejects → product returned → refund processed.

- Only `DELIVERED` orders inside the return window can request a return. The return window is **7 days from delivery**, counted from the time the order entered `DELIVERED` in `order_status_history`.
- An order can have **one** return request. A rejected return puts the order back to `DELIVERED` and cannot be requested again; the customer contacts support instead.
- A customer can return some of the items in an order. The refund is the price paid for the returned items, not shipping.
- `RETURNED` restocks inventory and starts the refund (`REFUND_PENDING` → `REFUNDED`). If nothing was paid (an unpaid COD order), there is nothing to refund and the order stays `RETURNED`.
- Stored in `returns` (one per request) and `return_items` (which order items, and how many, so partial returns work). See [database.md](database.md).

## Access rules

- Customers see only their own orders and cannot view another customer's order id.
- Status changes by admin require the admin role.
- Customers change status only through cancel and return requests, never directly.

## Shared contracts

| Contract | Owner | Used for |
|---|---|---|
| `get_current_user`, `require_role` | Madeeha | Ownership and admin checks |
| `validate_stock`, `deduct_stock`, `restock` | Rehan | Stock checks, deduction on confirm, restore on cancel/return |
| `create_notification(user_id, type, message)` | Aliza | Order status notifications |
| `log_action` | Faeeza | Audit trail for admin actions |
| `order_service.update_status()` | Rukhsar | The only way to change an order's status |

## API

Code: `backend/app/routers/orders.py`, schemas in `backend/app/schemas/order.py`. Live reference: `/docs` (Swagger UI). Send `Authorization: Bearer <token>` from `POST /api/auth/login`.

| Method and path | Who | What it does |
|---|---|---|
| `POST /api/orders` | customer | Place an order. Body `{"address_id": 1, "shipping_method_id": 2, "payment_method": "ONLINE" or "COD", "items": [{"product_id": 4, "variant_id": null, "quantity": 2}]}`. Returns `201` with the order and its Order ID (`order_number`). A COD order comes back `CONFIRMED`; an online order comes back `PLACED` until the payment module reports a verified `SUCCESS`. **Do not send prices, totals or shipping cost**: the server reads them from the database and rejects any extra field with `422`. |
| `GET /api/account/orders?page=&page_size=` | customer | My orders, newest first (page size 1 to 100) |
| `GET /api/account/orders/{id}` | customer | One of my orders: items, status timeline, returns, and `actions` (`can_cancel`, `can_request_return`, `return_deadline`) so the page knows which buttons to show |
| `POST /api/account/orders/{id}/cancel` | customer | Body `{"reason": "..."}` (optional). A paid order moves on to a refund. |
| `POST /api/account/orders/{id}/return` | customer | Body `{"reason": "...", "items": [{"order_item_id": 1, "quantity": 1}]}`. Returns `201`. |
| `PUT /api/admin/orders/{id}/status` | admin | Body `{"status": "PROCESSING", "remarks": "..."}`. Return steps (`RETURN_*`, `RETURNED`) are refused here and go through the returns route. |
| `GET /api/admin/returns?status=&page=&page_size=` | admin | Return requests, newest first |
| `PUT /api/admin/returns/{id}` | admin | Body `{"action": "approve" \| "reject" \| "mark_returned" \| "complete_refund", "remarks": "..."}` |

Errors: `401` no or bad token, `403` wrong role, `404` order or return not found (also used for someone else's order), `409` the step is not allowed right now (wrong status, window closed, not paid, out of stock), `422` bad input (including a product, variant, address or shipping method that isn't available).

### How an order is priced

`services/order_pricing.py` turns the request into a fully priced order: the price comes from `products` (plus `price_delta` of the chosen variant), shipping cost from `shipping_methods`, and the address must belong to the logged-in customer. The same product and variant listed twice becomes one line. The product must be `ACTIVE`, the shipping method switched on, and a variant is required when the product has variants. A later price change does not change an existing order, because the price is copied onto the order item.

Tax, discount and coupon are `0` for now. When Safiya's checkout session and Zubiya's pricing engine are merged, `price_order()` is the one function to replace; `create_order()` and everything after it stay the same.

Stock is not checked at this step. The inventory hook (below) raises `order_service.OutOfStock` when it can't deduct, which cancels the whole creation and returns `409`.

## Services

Code: `backend/app/services/order_service.py` and `return_service.py`. Neither commits; the caller (route) commits, so a status change, stock deduction and refund all land in one transaction. Tests: `backend/tests` (`pip install -r requirements-dev.txt`, then `python -m pytest` from `backend/`).

| Function | Used by | What it does |
|---|---|---|
| `create_order(db, OrderInput)` | `POST /api/orders` (via `order_pricing.price_order`) | Validates items and totals, creates a `PLACED` order with its first history row. A COD order is moved straight to `CONFIRMED`. |
| `apply_payment_result(db, order, payment_status)` | Payment (Aaliya) | Pass the backend-verified result. `SUCCESS` confirms a `PLACED` order; `FAILED`, `CANCELLED` and `PENDING` leave it unconfirmed. Calling `SUCCESS` twice confirms once. |
| `update_status(db, order, new_status, changed_by, remarks)` | Admin, other services | The only way to change status. Rejects moves outside the allowed table. |
| `cancel_order`, `get_order_for_user`, `list_orders_for_user` | Customer routes | Cancellation and "only my own orders" access. |
| `request_return`, `review_return`, `mark_returned`, `complete_refund` | Customer and admin routes | The return workflow above. |

`OrderInput` carries the checkout result: `user_id`, `address_id`, `shipping_method_id`, `payment_method`, `items` (`product_id`, `quantity`, `unit_price`, optional `variant_id`), `subtotal`, `discount_amount`, `tax_amount`, `shipping_cost`, `total_amount`, optional `coupon_id`. Totals must add up (`subtotal - discount + tax + shipping = total`) and match the items, or the order is refused. Checkout must compute them server-side.

### Hooks (stock and notifications)

`order_service.register_status_hook(fn)` registers `fn(db, order, previous_status, new_status)`. Hooks run inside `update_status()`, after the rules pass and before the caller commits. If a hook raises, roll back and the status change is undone with it.

- **Inventory (Rehan):** deduct stock when `new_status == "CONFIRMED"` (raise `order_service.OutOfStock("...")` if there isn't enough, which undoes the order); restore it when `new_status == "CANCELLED"` and `stock_was_deducted(order)` is true, and when `new_status == "RETURNED"` (the returned items are in `order.returns[-1].items`). Because an order is confirmed only once, stock is deducted once.
- **Notifications (Aliza):** notify the customer on any status change.

## Open questions

1. **Hook signatures with Rehan.** Waiting for his `deduct_stock` and `restock` signatures. They will be wired in as hooks above.
2. **Notification function with Aliza.** `create_notification` is not in `main` yet (the notification service is a mock).
3. **Checkout handoff with Safiya.** Confirm she can supply the `OrderInput` fields above.
4. **One return per order.** Proposed rule; confirm with the mentor.
5. **Foreign keys.** `user_id`, `address_id`, `coupon_id`, `product_id` and `variant_id` are plain integers until those tables exist.

Settled: COD orders are confirmed at creation and stay `PENDING` until paid; the payment statuses match Aaliya's migration; the return window is 7 days.
