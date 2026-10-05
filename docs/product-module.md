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
