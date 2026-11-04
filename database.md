# Database Documentation

## Cart & Coupon Module

### Cart

The `carts` table stores shopping cart information.

Planned fields:

- `id`
- `user_id`

A cart may be associated with a logged-in user. Guest cart identification will be handled through the application-level guest cart token.

### Cart Items

The `cart_items` table stores products/variants added to a cart.

Planned fields:

- `id`
- `cart_id`
- `product_id`
- `variant_id`
- `quantity`
- `unit_price`

Relationships:

- `cart_id` references `carts.id`.
- `product_id` references the Product table.
- `variant_id` references the Product Variant table.

The final foreign-key definitions will follow the schemas provided by the Product and Product Variant module owners.

### Coupons

The `coupons` table stores coupon and discount rules.

Planned fields:

- `id`
- `code`
- `discount_type`
- `discount_value`
- `min_order_value`
- `max_discount`
- `start_date`
- `expiry_date`
- `usage_limit`
- `per_user_limit`
- `status`

### Validation

- Coupon codes must be unique.
- Coupon discount values must be positive.
- Coupon date range must be valid.
- Cart item quantity must be greater than zero.
- Cart item quantity must not exceed available stock.
- Coupon validity and usage limits must be checked server-side.

### Dependencies

The Cart module depends on:

- Users/Auth module
- Product module
- Product Variant module
- Inventory module
- Checkout module

The final foreign keys will be added after the respective dependency schemas are available and confirmed by their module owners.