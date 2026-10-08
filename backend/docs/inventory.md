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


## INV-06 — Stock Restock on Cancellation and Return

### Objective

Stock is restored to inventory when a confirmed order is cancelled or when returned items are marked as `RETURNED`.

### Cancellation Restock Flow

1. An order reaches `CONFIRMED` and stock is deducted.
2. The customer cancels the order while cancellation is allowed.
3. The order changes to `CANCELLED`.
4. The inventory status hook checks whether stock was previously deducted.
5. `restock()` restores the quantity for each order item.
6. An `inventory_history` record is created for each restock.
7. The restock and order status change are handled in the same database transaction.

### Return Restock Flow

1. A delivered order enters the return process.
2. The return request is approved.
3. The product is received and the return is marked `RETURNED`.
4. The inventory status hook calls `restock()` for the returned items.
5. Only the returned item quantities are restored.
6. An `inventory_history` record is created for each returned item.

### Inventory History

Each restock records:

- `inventory_id`
- `product_id`
- `change_amount` (positive for restock)
- `changed_by`
- `change_type = RESTOCK`
- `quantity_changed`
- `previous_quantity`
- `new_quantity`
- `reason`

Cancellation restocks use:

`reason = cancel`

Return restocks use:

`reason = return`

### Validation

Stock is restored only when appropriate:

- Cancelled orders are restocked only if stock was previously deducted.
- Returned orders restore only the quantities included in the return.
- Inventory quantity cannot become negative.
- Missing inventory records cause the transaction to fail rather than silently creating incorrect stock.

### INV-06 Verification

The following scenarios were tested:

- Confirmed order cancellation: stock restored successfully.
- Cancellation history: restock recorded with the correct quantity and reason.
- Returned item: returned quantity restored successfully.
- Return history: restock recorded with `change_type = RESTOCK`.
- Relevant cancellation and return workflow tests passed successfully.