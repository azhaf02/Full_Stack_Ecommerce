# Inventory Management

## Overview

The Inventory module provides the database foundation for stock management and future stock validation across Cart, Checkout, and Order processing.

## Inventory Table

The `inventory` table stores current stock information.

Fields:

- `id` - Primary key
- `product_id` - Reference to `products.id`
- `variant_id` - Optional reference to `product_variants.id`
- `quantity` - Current available stock
- `low_stock_threshold` - Minimum quantity before low-stock status
- `location` - Optional stock location
- `status` - `IN_STOCK`, `LOW_STOCK`, or `OUT_OF_STOCK`
- `created_at` - Record creation time
- `updated_at` - Last update time

The `quantity` field has a database constraint that prevents negative values.

## Inventory History

The `inventory_history` table records stock changes.

Required fields:

- `id`
- `product_id`
- `change_amount`
- `reason`
- `changed_by`
- `timestamp`

Additional audit fields are also maintained:

- `inventory_id`
- `change_type`
- `quantity_changed`
- `previous_quantity`
- `new_quantity`
- `location`
- `created_at`

## Product and Variant Relationship

Inventory supports both product-level and variant-level stock references.

- `product_id` references the Product table.
- `variant_id` is optional and references Product Variant.
- Existing Product and Product Variant stock fields are not duplicated or removed.

Current sample data uses product-level inventory because no product variants are currently present in the shared database.

## Stock Status

Stock status is calculated as:

- Quantity `<= 0` → `OUT_OF_STOCK`
- Quantity `<= low_stock_threshold` → `LOW_STOCK`
- Quantity above threshold → `IN_STOCK`

## Sample Verification

Sample inventory records were inserted for:

- Product 2: quantity 10 → `IN_STOCK`
- Product 3: quantity 3 → `LOW_STOCK`
- Product 4: quantity 0 → `OUT_OF_STOCK`

Three corresponding inventory history records were inserted.

## Validation

A negative stock test was performed by attempting to insert quantity `-1`.

PostgreSQL rejected the operation with:

`check_inventory_quantity_non_negative`

This confirms that inventory quantity cannot become negative.

## Alembic

Inventory migrations include:

- `bd80f21972e0` - creates Inventory and Inventory History
- `40775ba06905` - merges migration branches
- `b33b24df7806` - adds Inventory Product/Variant foreign keys and required History fields

The latest inventory migration was successfully applied to PostgreSQL.

## Module Integration

Cart, Checkout, and Order modules should use the Inventory record to validate available stock before confirming or processing stock-changing operations.