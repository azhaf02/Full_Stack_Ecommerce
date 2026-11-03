# Inventory Management

## 1. Overview

The Inventory module manages product and variant stock, validates stock availability, records stock changes, and supports customer-facing and admin inventory features.

Inventory is integrated with Product, Cart, Order, Payment, and Admin workflows.

Main implementation:
- `backend/app/services/inventory_service.py`
- `backend/app/services/order_service.py`
- `backend/app/api/routes/inventory.py`
- `frontend/src/pages/admin/InventoryPage.tsx`
- `frontend/src/services/adminService.ts`

## 2. Inventory Data Model

The `inventory` table stores current stock information.

Main fields:
- `id` - Primary key
- `product_id` - Product reference
- `variant_id` - Optional product variant reference
- `quantity` - Current available stock
- `low_stock_threshold` - Threshold used for low-stock status
- `location` - Optional stock location
- `status` - Stock status
- `created_at`
- `updated_at`

A database check constraint is intended to prevent negative inventory quantities.

## 3. Inventory History

The `inventory_history` table records stock changes for auditing.

Main fields include:
- `id`
- `inventory_id`
- `product_id`
- `order_id`
- `change_amount`
- `quantity_changed`
- `previous_quantity`
- `new_quantity`
- `change_type`
- `reason`
- `changed_by`
- `location`
- `created_at`

History records are created for operations such as:
- Order stock deduction
- Cancellation restocking
- Return restocking
- Admin stock adjustments

The service records the previous and new quantities so that stock changes can be traced.

## 4. Product and Variant Relationship

Inventory supports both product-level and variant-level stock through:
- `product_id`
- Optional `variant_id`

When a variant is supplied, inventory operations use the matching product and variant record. When no variant is supplied, the product-level inventory record is used.

Product and variant references must remain consistent with the Product and Variant modules.

## 5. Stock Status

The centralized function `get_stock_status()` in `inventory_service.py` calculates stock status.

| Condition | Internal status |
|---|---|
| Quantity is zero or below | `out_of_stock` |
| Quantity is at or below the low-stock threshold | `low_stock` |
| Quantity is above the threshold | `in_stock` |

A missing inventory record is treated as out of stock by the stock-status service.

The admin inventory API presents status values in uppercase:
- `IN_STOCK`
- `LOW_STOCK`
- `OUT_OF_STOCK`

Customer-facing product APIs use lowercase status values.

## 6. INV-03: Stock Display and Out-of-Stock Handling

The customer-facing Product Listing and Product Detail APIs use centralized inventory data to calculate stock status.

### Product APIs

- `GET /api/products/`
- `GET /api/products/{product_id}`

The API responses include `stock_status`.

### Customer-facing behaviour

- `in_stock` - Product can be added to cart.
- `low_stock` - Low Stock status can be displayed.
- `out_of_stock` - Add to Cart is disabled.
- Missing inventory - Treated as out of stock.

The frontend uses the API stock status rather than duplicating the stock calculation.

## 7. INV-04: Stock Validation

`inventory_service.py` provides:

`validate_stock(db, product_id, requested_quantity, variant_id=None)`

The function:
- Checks the requested quantity.
- Rejects zero or negative requested quantities.
- Finds the matching product or variant inventory record.
- Rejects requests when inventory is missing.
- Rejects requests when available stock is insufficient.
- Returns the matching inventory record when sufficient stock is available.

Insufficient stock is represented by `InsufficientStockError`.

Validation checks availability; it does not itself deduct stock.

## 8. INV-05: Stock Deduction on Order Confirmation

The `deduct_stock()` function handles stock deduction when an order is confirmed.

Process:
1. Validate the stock required by all order items.
2. Stop if any item has insufficient stock.
3. Deduct the required quantities.
4. Create inventory history records for the deductions.

Order deductions use:
- `change_type`: `DEDUCTION`
- `reason`: `order`
- `order_id`: The related order ID

The order service uses status hooks to call inventory logic when the order status changes to `CONFIRMED`.

The inventory service does not commit independently. The order workflow controls the transaction so that order status and stock changes can be committed or rolled back together.

## 9. INV-06: Cancellation and Return Restocking

The `restock()` function adds stock back to inventory.

### Cancellation

When an order changes to `CANCELLED`, stock is restored only if the order's stock was previously deducted.

The history reason is `cancel`.

### Return

When an order changes to `RETURNED`, the service uses the returned items and their quantities to restore stock.

The history reason is `return`.

Restocking creates history records with:
- `change_type`: `RESTOCK`
- Previous quantity
- New quantity
- Quantity restored
- Related order and inventory references

The order status hook invokes the restocking logic as part of the order status workflow.

## 10. INV-07: Admin Inventory Management

The admin inventory router is protected by:

`require_role("admin")`

### Backend endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/admin/inventory` | List inventory records |
| PUT | `/api/admin/inventory/{inventory_id}` | Adjust stock quantity |
| GET | `/api/admin/inventory/low-stock` | List low-stock and out-of-stock records |

### Stock adjustment

The adjustment request contains:
- `quantity_change`
- `reason`

A positive quantity adds stock. A negative quantity removes stock.

The reason is required and must contain 1 to 500 characters after trimming whitespace.

The backend rejects:
- Unknown inventory IDs
- Adjustments that would make stock negative
- Blank adjustment reasons

Successful adjustments create an `ADMIN_ADJUSTMENT` history record containing the previous quantity, new quantity, reason, and admin ID.

### Frontend

The admin page is:

`frontend/src/pages/admin/InventoryPage.tsx`

It is registered at:

`/admin/inventory`

The page is included in `frontend/src/config/adminNav.ts`.

The page provides:
- Inventory record listing
- Product and variant information
- Quantity, threshold, status, and location
- Manual stock adjustment
- Required adjustment reason
- Low-stock report
- Low-stock and out-of-stock summary counts
- Refresh action
- Success and error messages

The frontend API functions are in `frontend/src/services/adminService.ts`:
- `getInventory()`
- `getLowStockInventory()`
- `adjustInventory()`

### Known admin UI limitation

The backend records inventory history, but the current `InventoryPage.tsx` does not display a history table or history list.

Therefore, history recording is implemented in the backend, but history viewing is not currently provided by this page.

## 11. INV-08: Payment and Inventory Integration

Successful payment verification updates the payment/order workflow.

When payment succeeds for a placed order:
1. The payment result is applied.
2. The order is moved to `CONFIRMED`.
3. The order status hook runs.
4. Inventory stock is deducted.
5. Inventory history is recorded.

Failed or cancelled payment results do not confirm the order and therefore do not trigger confirmation-based stock deduction.

The automated payment integration test verifies the successful mock-payment path:
- Initial inventory quantity: 10
- Ordered quantity: 5
- Final inventory quantity: 5
- History change amount: -5
- History change type: `DEDUCTION`

This verifies the mock payment workflow in the automated test environment. It does not establish that a real payment gateway transaction has been tested.

## 12. Alembic Migration

The inventory migration documented for this module is:

`bd80f21972e0_create_inventory_and_inventory_history.py`

It creates the Inventory and Inventory History database structures, including the non-negative quantity constraint.

The existence of a migration file does not by itself confirm that the migration has been applied to a particular database.

The current target database's migration revision and schema compatibility must be verified separately before any database upgrade is performed.

## 13. Verification Results

### Backend automated tests

Latest recorded full backend test run:

- **251 passed**
- 56 warnings
- No test failures

Additional focused test results:
- Inventory validation and order inventory integration: 15 passed.
- Payment integration tests: 18 passed.
- Mock payment success and inventory deduction test: 1 passed.

These test results are from the automated test environment using SQLite test databases. They do not prove that the shared Supabase database or a live payment gateway has been tested.

### Frontend checks

The frontend production build completed successfully.

The frontend lint check also completed successfully after the reported cleanup.

A non-blocking large-chunk warning was observed during the production build.

### Scope of verification

The automated checks cover application behaviour in the test environment. The following must not be treated as verified solely from these test results:
- Live shared Supabase migration compatibility
- Live payment gateway processing
- Production database stock deduction and restocking
- Admin inventory history display, which is not implemented in the current page

## 14. Known Limitations and Follow-up

1. The admin inventory page does not currently display inventory history.
2. Some visible text in `InventoryPage.tsx` contains incorrectly encoded dash and separator characters and should be corrected.
3. The target database migration revision and schema compatibility require separate verification.
4. Live payment gateway and shared database workflows require separate environment-level testing.

## 15. Main Implementation Files

| File | Responsibility |
|---|---|
| `backend/app/services/inventory_service.py` | Stock status, validation, deduction, restocking, and history |
| `backend/app/services/order_service.py` | Order status changes and inventory status hooks |
| `backend/app/api/routes/inventory.py` | Admin inventory endpoints |
| `frontend/src/pages/admin/InventoryPage.tsx` | Admin inventory interface |
| `frontend/src/services/adminService.ts` | Frontend inventory API functions |
| `frontend/src/config/adminNav.ts` | Admin navigation entry |
| `frontend/src/AdminApp.tsx` | Admin inventory route |
