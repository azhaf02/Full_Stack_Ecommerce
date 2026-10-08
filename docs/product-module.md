# Product Module

## Admin Product Management

The admin product module provides product CRUD operations with image upload support.

### Product Management

* Create a product with name, description, price, category, stock quantity and status.
* Edit existing product details.
* Search products by name.
* Filter products by category and status.
* Deactivate products instead of permanently deleting them.

### Image Upload Rules

* Allowed image formats: JPG, PNG and WEBP.
* Maximum image size: 5 MB.
* Images are uploaded through the FastAPI `UploadFile` endpoint.
* Uploaded files are stored in the `/uploads` directory.
* A unique filename is generated for each uploaded image.
* Image path is stored in the `product_images` table.
* One product image can be marked as the primary image.
* When a new image is marked as primary, the previous primary image is unmarked.

### API Endpoints

* `GET /api/admin/products/` — List/search/filter products.
* `POST /api/admin/products/` — Create product.
* `GET /api/admin/products/{id}` — Get product.
* `PUT /api/admin/products/{id}` — Update product.
* `DELETE /api/admin/products/{id}` — Deactivate product.
* `POST /api/admin/products/{id}/images` — Upload product image.

### Validation

* Product name and required fields are validated.
* Price must be greater than zero.
* Stock quantity cannot be negative.
* Only JPG, PNG and WEBP images are accepted.
* Image size must not exceed 5 MB.
## CAT-05 — Public Product Listing

Implemented the customer-facing product listing page with:

- Public category navigation
- Active products only
- Product listing by category
- Responsive product grid
- Product image, name, price and status
- Pagination using page and page_size
- Empty category state
- Query parameter validation for page, page_size and category_id

### Public APIs

GET /api/catalog/categories

GET /api/catalog/products?page=1&page_size=8

GET /api/catalog/products?page=1&page_size=8&category_id=4

### Validation

- page must be greater than or equal to 1
- page_size must be between 1 and 50
- category_id must be greater than or equal to 1

### Testing

- All Products listing tested
- Category filtering tested
- Active product filtering verified
- Empty category state implemented
- Pagination implemented
- Invalid page and page_size validation verified

## CAT-06 — Category-Based Navigation & Breadcrumbs

Implemented category-aware navigation and reusable breadcrumbs for the public product listing page.

### Navigation

- Added reusable `Breadcrumb` component.
- Breadcrumb displays `Home > Products` for the main product listing.
- Breadcrumb displays `Home > Category` when a category is selected.
- Category navigation highlights the currently selected category.
- Clicking `Home` resets the category filter and returns to All Products.
- Category selection resets pagination to page 1.

### Testing

- Breadcrumb navigation tested on the product listing page.
- Category selection and active category highlighting tested.
- Home navigation tested.
- Category filtering with breadcrumbs tested.
- Pagination reset after category selection verified.

## CAT-07 — Catalog, Inventory & Cart Integration

Implemented stock availability signals for the public product listing.

### Integration Notes

- Listing response includes stable `id`, `price`, `stock_quantity`, and `stock_status` fields for Cart integration.
- `stock_status` is `IN_STOCK` when stock quantity is greater than zero.
- `stock_status` is `OUT_OF_STOCK` when stock quantity is zero.
- Product price continues to use the catalog product price returned by the API.
- The current branch uses the existing product stock quantity for the stock-status signal.
- Inventory source-of-truth join will be aligned with Rehan's Inventory module when the Inventory schema/service is available on the shared branch.
- Cart can use the stable product `id` from the listing response when referencing catalog products.

### Testing

- Verified products with available stock return `IN_STOCK`.
- Temporarily set product ID 6 stock to zero and verified the `Out of Stock` badge on the public listing.
- Restored product ID 6 stock to its original quantity of 50.
## CAT-08 — Checkpoint 1 Authentication & Authorization

Catalog authentication and authorization regression testing completed.

### Checkpoint Testing

- Public product listing endpoint was verified without authentication and returned active catalog products successfully.
- Public category navigation endpoint is available for storefront access.
- Admin product management routes are protected by `require_role("admin")`.
- Unauthenticated access to `/api/admin/products/` was blocked with `Not authenticated`.
- The `require_role()` implementation returns HTTP 403 `Not enough permissions` when an authenticated user does not have the required role.
- Admin catalog operations including product listing, creation, retrieval, update, deactivation, and image upload inherit the admin-only dependency from the catalog router.
- No missing admin authorization dependency was identified during the catalog route review.

### Checkpoint 1 Result

Catalog authentication and authorization checks passed for the available test scenarios. Customer-role verification should be included when an authenticated non-admin test account/token is available.

## CAT-09 — Final Testing, Bug Fixing & Documentation

Final functional testing, regression testing, demo data seeding, bug fixing, and documentation were completed for the Product Catalog module.

### Final Testing

* Public product listing was tested using the Catalog API.
* Pagination was tested with `page=1` and `page_size=50`.
* All active catalog products were successfully returned.
* Category listing was verified through `/api/catalog/categories`.
* Category-based navigation and breadcrumbs were tested on the frontend.
* All Products and individual category views were verified.
* Product price, category, stock quantity, stock status, image and active status were verified.
* Public catalog access was verified without authentication.
* Admin catalog routes were reviewed for authentication and authorization protection.
* Unauthenticated access to admin product and category routes was blocked.
* Product listing bug was identified where only the last product was returned due to incorrect indentation in the result-building loop.
* The indentation issue was fixed and the public catalog listing was re-tested successfully.

### Final Validation Matrix

| Test Case                      | Result |
| ------------------------------ | ------ |
| Public product listing         | PASS   |
| Public category listing        | PASS   |
| Active products displayed      | PASS   |
| Category filtering             | PASS   |
| Category navigation            | PASS   |
| Breadcrumb navigation          | PASS   |
| Pagination                     | PASS   |
| Product price display          | PASS   |
| Stock quantity display         | PASS   |
| Stock status signal            | PASS   |
| Admin route authentication     | PASS   |
| Admin authorization dependency | PASS   |
| Demo category seed data        | PASS   |
| Demo product seed data         | PASS   |
| Supabase PostgreSQL seed       | PASS   |
| Catalog listing bug fix        | PASS   |

### Demo Data

A PostgreSQL-compatible catalog seed script was added in `backend/seed_supabase.py`.

The seed script inserts demo categories and products into Supabase PostgreSQL without duplicating existing demo records.

#### Demo Categories

* Clothing — Everyday clothing and fashion products
* Home & Kitchen — Useful products for home and kitchen
* Accessories — Everyday personal and tech accessories

#### Demo Products

* Classic Cotton T-Shirt — ₹599 — Stock 25
* Stainless Steel Water Bottle — ₹799 — Stock 20
* Wireless Mouse — ₹999 — Stock 30

Seed execution was verified successfully against the Supabase PostgreSQL database.

### API Documentation

Catalog endpoints were cross-checked against the FastAPI OpenAPI documentation.

#### Public Catalog APIs

* `GET /api/catalog/categories` — List active categories.
* `GET /api/catalog/products` — List active products.
* `GET /api/catalog/products?page=1&page_size=8` — Paginated product listing.
* `GET /api/catalog/products?page=1&page_size=8&category_id={category_id}` — Category-filtered product listing.

#### Admin Product APIs

* `GET /api/admin/products/` — List/search/filter products.
* `POST /api/admin/products/` — Create product.
* `GET /api/admin/products/{product_id}` — Get product.
* `PUT /api/admin/products/{product_id}` — Update product.
* `DELETE /api/admin/products/{product_id}` — Deactivate product.
* `POST /api/admin/products/{product_id}/images` — Upload product image.

### Authentication & Authorization

* Public catalog endpoints are available for storefront access.
* Admin product management routes inherit `require_role("admin")`.
* Unauthenticated requests to admin catalog routes are rejected.
* Authenticated non-admin users are expected to receive HTTP 403 from the role dependency.
* Full admin CRUD execution requires an available admin test account/token.

### Final Result

The Product Catalog module passed the available final regression checks and is documented for deployment.

**CAT-09 Status: COMPLETED**
