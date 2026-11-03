PDV-04 — Product Variant Selection

Objective

Implement product variant selection so customers can choose available product options such as size or color and see the corresponding price and stock before adding the product to the cart.

Implementation

A reusable "VariantSelector" component was created in:

"frontend/src/components/VariantSelector.tsx"

The component:

- Fetches variants from the backend.
- Displays available variant options.
- Supports product attributes such as Size.
- Updates the displayed product price according to the selected variant.
- Displays inventory availability.
- Disables variants that are out of stock.
- Sends the selected variant to the Product Details page.

Backend API

Endpoint:

"GET /api/products/{product_id}/variants"

Example for product ID 2:

- Size S — price delta ₹0 — stock 5
- Size M — price delta ₹50 — stock 10
- Size L — price delta ₹50 — stock 0

Variant stock is obtained from the inventory data so that the Product Details page uses the available inventory quantity.

Cart Integration

The selected variant ID is passed to the Cart API when the customer clicks Add to Cart.

Request example:

{
  "product_id": 2,
  "quantity": 1,
  "variant_id": 2
}

The cart integration supports variant-specific pricing and inventory availability.

Out-of-Stock Handling

Variants with zero available inventory are disabled in the UI.

For example:

- S — Available
- M — Available
- L — Out of stock

Customers cannot select the unavailable L variant.

Testing

Test Case| Result
Variant API loads correctly| Pass
S variant displays correct price and stock| Pass
M variant displays correct price and stock| Pass
L variant is disabled when stock is zero| Pass
Selected variant ID is passed to Cart API| Pass
Add to Cart works for available variants| Pass
Out-of-stock variant cannot be added| Pass
Frontend production build succeeds| Pass

Build Verification

The frontend production build was successfully verified using:

"npm.cmd run build"

Result:

"✓ 33 modules transformed"

"✓ built successfully"

Files

Frontend

- "frontend/src/components/VariantSelector.tsx"
- "frontend/src/ProductDetailPage.tsx"

Backend

- "backend/app/api/routes/variant.py"
- "backend/app/routers/cart.py"
- "backend/app/main.py"

Handoff

The selected "variant_id" is passed to the shared Cart API so the cart module can handle the selected product variant.

The implementation does not create a separate cart or inventory system.