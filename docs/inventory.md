# Inventory Management

## Overview

The Inventory module provides the database foundation for stock management and future stock validation across Cart, Checkout, and Order processing.

## Inventory

The `inventory` table stores current stock information.

Fields:
- `id` - Primary key
- `product_id` - Product reference
- `variant_id` - Optional variant reference
- `quantity` - Current stock quantity
- `low_stock_threshold` - Threshold for low-stock status
- `location` - Optional stock location
- `status` - `IN_STOCK`, `LOW_STOCK`, or `OUT_OF_STOCK`
- `created_at`
- `updated_at`

A database check constraint prevents `quantity` from becoming negative.

## Inventory History

The `inventory_history` table records stock changes.

Required fields:
- `id`
- `product_id`
- `change_amount`
- `reason`
- `changed_by`
- `timestamp`

Additional audit fields:
- `inventory_id`
- `change_type`
- `quantity_changed`
- `previous_quantity`
- `new_quantity`
- `location`
- `created_at`

## Product and Variant Relationship

Inventory supports a product reference and an optional variant reference.

Current sample data uses product-level inventory because no product variants are currently available in the shared database.

Product and Variant ownership must remain coordinated with the respective Product and Variant modules.

## Stock Status

- `quantity <= 0` → `OUT_OF_STOCK`
- `quantity <= low_stock_threshold` → `LOW_STOCK`
- otherwise → `IN_STOCK`

## Verification

Sample inventory records were verified:

- Product 2: quantity 10 → `IN_STOCK`
- Product 3: quantity 3 → `LOW_STOCK`
- Product 4: quantity 0 → `OUT_OF_STOCK`

Three inventory history records were created and verified.

A negative quantity insertion (`-1`) was rejected by PostgreSQL using:

`check_inventory_quantity_non_negative`

## Alembic

Migration:

`bd80f21972e0_create_inventory_and_inventory_history.py`

This migration creates the Inventory and Inventory History tables with the required fields and non-negative quantity constraint.

## Integration

Cart, Checkout, and Order modules should use Inventory as the source for stock validation before stock-changing operations.
## INV-03 Stock Display & Out-of-Stock Handling

The customer-facing Product Listing and Product Detail APIs use centralized Inventory data to calculate the current stock status.

### Stock Status Service

`backend/app/services/inventory_service.py` provides reusable stock-status logic:

- `quantity <= 0` ? `out_of_stock`
- `quantity <= low_stock_threshold` ? `low_stock`
- otherwise ? `in_stock`
- Missing inventory record ? `out_of_stock`

The React frontend does not duplicate this stock-state calculation.

### Product APIs

The following APIs include `stock_status`:

- `GET /api/products/`
- `GET /api/products/{product_id}`

The `stock_status` value is calculated using the Inventory table and its configured `low_stock_threshold`.

### Customer-Facing Behaviour

- `in_stock` ? Product can be added to cart.
- `low_stock` ? Low Stock badge is displayed.
- `out_of_stock` ? Add to Cart button is disabled.
- Product Detail displays the current stock availability.

### INV-03 Verification

Three stock conditions were tested using the customer-facing Product Detail API:

- Product 2 ? `in_stock`
- Product 3 ? `low_stock`
- Product 4 ? `out_of_stock`

The Product Detail API was verified to return `stock_status` from centralized Inventory data.

Frontend production build completed successfully after integrating the Product Detail page and stock-state rendering.

### Coordination

INV-03 integrates with:

- Chandani � Product Catalog / Product Listing
- Gazala � Product Detail / Product Variants
- Zubiya � Cart integration

Inventory remains the centralized source for customer-facing stock status.
