# Product Details, Variants, Search, Filter & Wishlist

## 1. Product Details

The product detail page allows customers to view complete information about a product.

The page will display:
- Product name
- Product description
- Product images
- Price
- Category
- Availability
- Available variants
- Selected variant details

## 2. Product Variants

Products may have different variants such as size and color.

Each variant will contain:
- Size
- Color
- Price
- Stock quantity

When a customer selects a variant, the system will display the corresponding price and availability.

## 3. Search

Customers can search products using:
- Product name
- Product description

The search should return products matching the entered search text.

## 4. Filters

Customers can filter products using:
- Category
- Price range
- Availability

Multiple filters may be applied together.

## 5. Sorting

Products can be sorted by:
- Price: Low to High
- Price: High to Low
- Newest
- Popularity

## 6. Wishlist

Customers can:
- Add a product to their wishlist
- Remove a product from their wishlist
- View their saved products

Each customer's wishlist will be separate. Duplicate products should not be added to the same wishlist.

Guests must log in or register before using wishlist functionality.

## 7. Database Models

### ProductVariant

Draft fields:

- id
- product_id
- size
- color
- price
- stock

### Wishlist

Draft fields:

- id
- customer_id
- product_id
- created_at

## 8. Dependencies

This module depends on the Product Catalog module for base product and category data.

It interacts with:
- Cart module for adding selected variants to cart
- Product Catalog module for product information
- Customer Dashboard module for displaying wishlist information