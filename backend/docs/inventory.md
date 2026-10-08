# Inventory Documentation

## INV-05 — Stock Deduction on Order Confirmation

### Objective

Stock is deducted only when an order reaches the `CONFIRMED` status.

### Stock Deduction Flow

1. Customer creates an order.
2. Stock is validated before order creation.
3. COD orders are immediately moved to `CONFIRMED`.
4. Online orders remain `PLACED` until payment is successfully verified.
5. When the order becomes `CONFIRMED`, the inventory status hook calls `deduct_stock()`.
6. Stock is reduced for each order item.
7. An `inventory_history` record is created for each deduction.
8. Order creation/status change and inventory deduction are committed in the same database transaction.

### Inventory History

Each stock deduction records:

- `inventory_id`
- `product_id`
- `change_amount` (negative for deduction)
- `changed_by`
- `change_type = DEDUCTION`
- `quantity_changed`
- `previous_quantity`
- `new_quantity`
- `reason`

The current implementation stores the order reference in the reason field using:

`order:<order_id>`

### Validation

An order cannot be confirmed when requested quantity is greater than available inventory.

If stock is insufficient:

- The order confirmation fails.
- The transaction is rolled back.
- Stock cannot become negative.

### Payment Behavior

#### COD

`PLACED -> CONFIRMED`

Stock is deducted when the order is confirmed.

#### Online Payment

`PLACED -> payment SUCCESS -> CONFIRMED`

Stock is not deducted while the order is only `PLACED`. It is deducted after verified payment changes the order to `CONFIRMED`.

### Concurrency Edge Case

When multiple orders compete for the last available unit at the same time, stock should be protected using row-level locking (`SELECT ... FOR UPDATE`) or an atomic conditional stock update.

The current implementation validates and deducts within the same transaction, but does not currently use explicit row-level locking. Therefore, concurrent last-unit orders should be considered an edge case for future concurrency hardening.

### INV-05 Verification

The following scenarios were tested:

- COD order confirmation: stock deducted successfully.
- Insufficient stock: order rejected.
- Online order before payment: stock not deducted.
- Online payment success: order confirmed and stock deducted.
- Inventory history: deduction recorded with previous and new quantities.
