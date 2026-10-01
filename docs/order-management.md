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
- A rejected return puts the order back to `DELIVERED`; the decision is stored on the `returns` record.
- `RETURNED` restocks inventory and starts the refund (`REFUND_PENDING` → `REFUNDED`).
- The `returns` table is added in ORD-07.

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

## Open questions

1. **COD acceptance.** COD is a supported payment option. Proposal, still to be confirmed with Aaliya: a COD order is confirmed straight away without an online `SUCCESS`; its payment stays `PENDING` until an admin marks it paid. The order needs to know the payment method, either via a `payment_method` column on `orders` or by looking it up in `payments`.
2. **Payment status values.** Confirm the six statuses above with Aaliya before adding a database check on `orders.payment_status`.
3. **Foreign keys.** `user_id`, `address_id`, `coupon_id`, `product_id` and `variant_id` are plain integers until those tables exist.
