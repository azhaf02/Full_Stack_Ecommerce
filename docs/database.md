# Database

## Migrations

Migrations live in `backend/alembic/versions/`. `alembic/env.py` reads `DATABASE_URL` from `backend/.env` and uses `Base.metadata` from `app.models`, so from `backend/`:

```bash
python -m alembic current       # revision the database is at
python -m alembic upgrade head  # apply pending migrations
```

`6658707a12a7_baseline.py` is a no-op placeholder for the revision the shared Supabase database was already stamped at (its original file was never committed). New migrations should chain from the current head.

## Orders (Order Management, Rukhsar, migrations `0007_orders`, `0008_order_payment_method`, `0009_returns`)

### `orders`
| Column | Type | Notes |
|---|---|---|
| id | integer PK | |
| order_number | varchar(30) | unique, human-readable Order ID |
| user_id | integer | indexed; FK to `users` once that table exists |
| address_id | integer | FK to `addresses` once that table exists |
| shipping_method_id | integer | FK to `shipping_methods.id` |
| coupon_id | integer, nullable | FK to `coupons` once that table exists |
| status | varchar(30) | indexed; default `PLACED`; check constraint limits it to the order lifecycle statuses |
| payment_method | varchar(20) | `ONLINE` or `COD`; required, no default, so the order code must state it |
| payment_status | varchar(20) | default `PENDING`; check constraint limits it to `PENDING`, `SUCCESS`, `FAILED`, `CANCELLED`, `REFUND_PENDING`, `REFUNDED` |
| subtotal, discount_amount, tax_amount, shipping_cost, total_amount | numeric(10,2) | `total_amount >= 0` |
| created_at, updated_at | timestamp | |

### `order_items`
| Column | Type | Notes |
|---|---|---|
| id | integer PK | |
| order_id | integer | FK to `orders.id`, cascade delete |
| product_id | integer | indexed; FK to `products` once that table exists |
| variant_id | integer, nullable | FK to `product_variants` once that table exists |
| quantity | integer | `> 0` |
| unit_price | numeric(10,2) | `>= 0`; price at time of purchase |

### `order_status_history`
| Column | Type | Notes |
|---|---|---|
| id | integer PK | |
| order_id | integer | FK to `orders.id`, cascade delete |
| previous_status | varchar(30), nullable | null for the initial `PLACED` entry |
| new_status | varchar(30) | |
| changed_by | integer, nullable | user who made the change; null for system changes |
| remarks | text, nullable | |
| changed_at | timestamp | |

Order statuses: `PLACED`, `CONFIRMED`, `PROCESSING`, `PACKED`, `SHIPPED`, `OUT_FOR_DELIVERY`, `DELIVERED`, `CANCELLED`, `RETURN_REQUESTED`, `RETURN_APPROVED`, `RETURNED`, `REFUND_PENDING`, `REFUNDED`.

### `returns`
| Column | Type | Notes |
|---|---|---|
| id | integer PK | |
| order_id | integer | FK to `orders.id`, cascade delete |
| user_id | integer | the customer who asked for the return; FK to `users` once that table exists |
| reason | text | |
| status | varchar(20) | indexed; default `REQUESTED`; one of `REQUESTED`, `APPROVED`, `REJECTED`, `RETURNED`, `REFUND_PENDING`, `REFUNDED` |
| admin_remarks, reviewed_by, reviewed_at | text, integer, timestamp (nullable) | the admin's decision |
| refund_amount | numeric(10,2), nullable | `>= 0` |
| requested_at, updated_at | timestamp | |

### `return_items`
| Column | Type | Notes |
|---|---|---|
| id | integer PK | |
| return_id | integer | FK to `returns.id`, cascade delete |
| order_item_id | integer | FK to `order_items.id` |
| quantity | integer | `> 0`; an order item can appear only once per return |

`0009_returns` chains after Aaliya's payments/invoices migration (`0d01fe9783e7`), so her `feature/payment` branch must be merged first.
