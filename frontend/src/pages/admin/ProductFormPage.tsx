import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  createAdminProduct,
  getAdminProduct,
  getCategories,
  updateAdminProduct,
  uploadProductImage,
  type Category,
} from "../../services/adminService";

export default function ProductFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const isEditMode = Boolean(id);

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stockQuantity, setStockQuantity] = useState("0");
  const [categoryId, setCategoryId] = useState("");
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPrimary, setIsPrimary] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (isEditMode && id) {
      loadProduct(Number(id));
    }
  }, [id, isEditMode]);

  const loadCategories = async () => {
    try {
      const data = await getCategories(true);
      setCategories(data);
    } catch (error) {
      console.error("Failed to load categories:", error);
      alert("Failed to load categories.");
    }
  };

  const loadProduct = async (productId: number) => {
    try {
      setLoading(true);

      const product = await getAdminProduct(productId);

      setName(product.name);
      setDescription(product.description || "");
      setPrice(product.price);
      setStockQuantity(String(product.stock_quantity));
      setCategoryId(String(product.category_id));
      setStatus(product.status);
    } catch (error) {
      console.error("Failed to load product:", error);
      alert("Failed to load product.");
      navigate("/admin/products");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      alert("Only JPG, PNG and WEBP images are allowed.");
      event.target.value = "";
      return;
    }

    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      alert("Image size must not exceed 5 MB.");
      event.target.value = "";
      return;
    }

    setSelectedFile(file);

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!categoryId) {
      alert("Please select a category.");
      return;
    }

    if (!name.trim()) {
      alert("Product name is required.");
      return;
    }

    if (!price || Number(price) <= 0) {
      alert("Please enter a valid price.");
      return;
    }

    if (Number(stockQuantity) < 0) {
      alert("Stock quantity cannot be negative.");
      return;
    }

    try {
      setSaving(true);

      const productData = {
        category_id: Number(categoryId),
        name: name.trim(),
        description: description.trim() || null,
        price: Number(price),
        stock_quantity: Number(stockQuantity),
        status,
      };

      let productId: number;

      if (isEditMode && id) {
        const updatedProduct = await updateAdminProduct(
          Number(id),
          productData
        );

        productId = updatedProduct.id;
      } else {
        const createdProduct = await createAdminProduct(productData);

        productId = createdProduct.id;
      }

      if (selectedFile) {
        try {
          setUploadingImage(true);

          await uploadProductImage(
            productId,
            selectedFile,
            isPrimary
          );
        } catch (imageError) {
          console.error(
            "Product saved but image upload failed:",
            imageError
          );

          alert(
            "Product was saved, but the image upload failed."
          );

          navigate("/admin/products");
          return;
        } finally {
          setUploadingImage(false);
        }
      }

      alert(
        isEditMode
          ? "Product updated successfully."
          : "Product created successfully."
      );

      navigate("/admin/products");
    } catch (error) {
      console.error("Failed to save product:", error);
      alert("Failed to save product.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-500">
        Loading product...
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <button
          type="button"
          onClick={() => navigate("/admin/products")}
          className="mb-3 text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          ← Back to Products
        </button>

        <h1 className="text-2xl font-bold text-gray-800">
          {isEditMode ? "Edit Product" : "Add Product"}
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          {isEditMode
            ? "Update product details and image."
            : "Create a new product with an optional image."}
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="max-w-3xl rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
      >
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Product Name *
            </label>

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter product name"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Description
            </label>

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter product description"
              rows={4}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Price *
            </label>

            <input
              type="number"
              min="0.01"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="1499.00"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Stock Quantity
            </label>

            <input
              type="number"
              min="0"
              value={stockQuantity}
              onChange={(e) => setStockQuantity(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Category *
            </label>

            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
              required
            >
              <option value="">Select category</option>

              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Status
            </label>

            <select
              value={status}
              onChange={(e) =>
                setStatus(
                  e.target.value as "ACTIVE" | "INACTIVE"
                )
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>

          <div className="md:col-span-2 border-t border-gray-200 pt-5">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Product Image
            </label>

            <input
              type="file"
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-600"
            />

            <p className="mt-1 text-xs text-gray-500">
              Allowed: JPG, PNG, WEBP. Maximum size: 5 MB.
            </p>
          </div>

          {previewUrl && (
            <div className="md:col-span-2">
              <p className="mb-2 text-sm font-medium text-gray-700">
                Image Preview
              </p>

              <div className="flex items-start gap-4">
                <img
                  src={previewUrl}
                  alt="Product preview"
                  className="h-40 w-40 rounded-lg border border-gray-200 object-cover"
                />

                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewUrl(null);
                  }}
                  className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                >
                  Remove Image
                </button>
              </div>

              <label className="mt-4 flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={isPrimary}
                  onChange={(e) => setIsPrimary(e.target.checked)}
                />
                Set as primary image
              </label>
            </div>
          )}
        </div>

        <div className="mt-7 flex gap-3 border-t border-gray-200 pt-5">
          <button
            type="submit"
            disabled={saving || uploadingImage}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {uploadingImage
              ? "Uploading image..."
              : saving
                ? "Saving..."
                : isEditMode
                  ? "Update Product"
                  : "Create Product"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/admin/products")}
            className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}