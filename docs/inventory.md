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