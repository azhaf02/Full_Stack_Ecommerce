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