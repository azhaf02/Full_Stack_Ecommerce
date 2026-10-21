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


PDV-05: Product Search

1. Overview

The Product Search feature allows customers to search for products by entering keywords. It searches product names and descriptions and displays matching results.

2. Backend Implementation

- Created a product search API endpoint: "GET /api/products/search"
- Accepted a search keyword through the "q" query parameter.
- Implemented case-insensitive searching using SQLAlchemy "ILIKE".
- Searched both product names and product descriptions.
- Used parameterized ORM queries.
- Returned matching products through the API.
- Added input validation for search requests.
- Restricted search results to active products.

API Endpoint

"GET /api/products/search?q=headphone"

Example request:

GET http://localhost:8000/api/products/search?q=headphone

3. Frontend Implementation

- Created a reusable "SearchBar.tsx" component.
- Allowed customers to enter product keywords.
- Connected the search interface to the backend API.
- Displayed matching products in a results grid.
- Handled empty search results with a no-results message.
- Added search functionality to the dashboard interface.
- Updated the search results page to display products returned by the API.

4. Testing

The following cases were checked:

- Searching for an existing product.
- Searching with a keyword such as "headphone".
- Searching with an empty query.
- Searching with an invalid query.
- Searching with special characters.
- Checking the API response.
- Verifying the frontend production build.

5. Error Encountered

During development, the search API returned a "500 Internal Server Error" related to a "KeyError: 'Category'" after changes to the database imports. This was investigated during backend integration.

6. Build Verification

The frontend production build was run using:

npm.cmd run build

The build completed successfully after the implementation.

7. Outcome

The Product Search feature was implemented with a backend API and frontend search interface. Customers can search for products by name or description and view matching results.

Task: PDV-05 — Product Search
Commit message: "feat: implement product search API"

PDV-06: Product Filtering & Sorting

1. Overview

The Product Filtering and Sorting feature allows customers to narrow down the product list based on their preferences and arrange products using supported sorting options.

2. Backend Implementation

- Added product filtering and sorting support to the backend API.
- Implemented category-based filtering.
- Implemented minimum price filtering.
- Implemented maximum price filtering.
- Added an in-stock filter to display products that are available.
- Added sorting options for arranging products.
- Restricted results to active products.
- Used an allow-list of supported sorting fields to avoid unsafe SQL ordering.

3. API Functionality

The filtering API supports the following parameters:

Parameter| Purpose
"category"| Filters products by category
"min_price"| Sets the minimum price
"max_price"| Sets the maximum price
"in_stock"| Filters products based on stock availability
"sort"| Arranges products using a supported sorting option

Example request:

GET /api/products?category=Electronics&min_price=100&max_price=1000&in_stock=true&sort=price_asc

Note: The example shows the intended query structure. Use the actual parameter names and supported sort values from your implementation.

4. Frontend Implementation

- Created the "ProductFilter.tsx" component.
- Added controls for filtering products.
- Provided category and price filtering options.
- Added an in-stock filter.
- Included supported sorting options.
- Connected the filtering interface to the product API.

5. Testing

The feature should be verified for:

- Filtering by category.
- Filtering using a minimum price.
- Filtering using a maximum price.
- Displaying only in-stock products.
- Sorting products using supported options.
- Combining multiple filters.
- Handling cases where no products match the selected filters.

6. Security and Validation

- Used an allow-list for supported sorting fields.
- Avoided accepting arbitrary SQL ordering expressions.
- Applied filters through the backend query logic.

7. Build Verification

Run the frontend production build from the frontend directory:

npm.cmd run build

Record the build as successful only after confirming that it completes without errors.

8. Outcome

PDV-06 adds product filtering and sorting capabilities to help customers find products based on category, price, stock availability, and supported sorting options.

Task: PDV-06 — Product Filtering & Sorting

PDV-07: Customer Wishlist

1. Overview

The Wishlist feature allows customers to save products they are interested in and view them later. Customers can add products to their wishlist, view saved products, and remove products when they no longer need them.

2. Backend Implementation

Created the wishlist API routes in:

"backend/app/api/routes/wishlist.py"

Implemented the following functionality:

- Add a product to the wishlist.
- Retrieve the customer's wishlist.
- Remove a product from the wishlist.
- Associate wishlist entries with the authenticated customer.
- Prevent duplicate entries for the same product.
- Validate product IDs before processing requests.
- Use database operations to manage wishlist records.

3. API Endpoints

Method| Endpoint| Purpose
POST| "/api/wishlist/"| Add a product to the wishlist
GET| "/api/wishlist/"| Retrieve wishlist products
DELETE| "/api/wishlist/?product_id={id}"| Remove a product from the wishlist

These endpoints require customer authentication.

4. Frontend Implementation

Wishlist Page

Created:

"frontend/src/pages/WishlistPage.tsx"

The page uses the "WishlistListView" component to display saved products.

Product Listing and Detail Pages

- Added wishlist heart buttons to product listing cards.
- Added wishlist functionality to the product detail page.
- Used the API client to send wishlist requests to the backend.
- Updated the heart button state when products are added or removed.

Routing

Updated the active "frontend/src/App.jsx" router to include:

"/wishlist"

Customers can open the Wishlist page at "/wishlist".

5. API Testing

The following API operations were tested:

- POST: Added a product to the wishlist.
- GET: Retrieved the wishlist products.
- DELETE: Removed a product from the wishlist.
- Duplicate prevention: Verified that adding the same product again does not create duplicate wishlist entries.

6. Authentication

- Wishlist API endpoints use the authenticated customer.
- Unauthenticated requests receive a "401 Unauthorized" response.
- The frontend currently redirects guests to "/login" when they click a wishlist heart button.
- The login route is not configured in the active router, so this redirection currently leads to a blank page.

The guest login flow remains pending verification.

7. Known Limitations

- The complete wishlist flow through the frontend has not yet been confirmed with an authenticated customer session.
- The guest redirection and login page need further verification.

8. Outcome

The backend wishlist functionality has been implemented and its main API operations have been tested. The frontend wishlist page, product buttons, and routing have also been added. End-to-end frontend verification remains pending.

Task: PDV-07 — Implement Customer Wishlist

Commit message: "feat: implement customer wishlist"