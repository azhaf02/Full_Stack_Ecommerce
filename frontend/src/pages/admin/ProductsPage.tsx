import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  deactivateAdminProduct,
  getAdminProducts,
  getCategories,
  type Category,
  type Product,
} from "../../services/adminService";

export default function ProductsPage() {
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<number | undefined>();
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE" | undefined>();
  const [loading, setLoading] = useState(true);

  const loadProducts = async () => {
    try {
      setLoading(true);

      const data = await getAdminProducts({
        search: search || undefined,
        category_id: categoryId,
        status,
      });

      setProducts(data);
    } catch (error) {
      console.error("Failed to load products:", error);
      alert("Failed to load products.");
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await getCategories(true);
      setCategories(data);
    } catch (error) {
      console.error("Failed to load categories:", error);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadProducts();
  }, [search, categoryId, status]);

  const handleDeactivate = async (productId: number) => {
    const confirmed = window.confirm(
      "Are you sure you want to deactivate this product?"
    );

    if (!confirmed) {
      return;
    }

    try {
      await deactivateAdminProduct(productId);
      await loadProducts();
    } catch (error) {
      console.error("Failed to deactivate product:", error);
      alert("Failed to deactivate product.");
    }
  };

  const getCategoryName = (id: number) => {
    const category = categories.find((item) => item.id === id);
    return category?.name || `Category #${id}`;
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Products
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage products, prices, stock and product images.
          </p>
        </div>

        <button
          onClick={() => navigate("/admin/products/new")}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Add Product
        </button>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Search
          </label>

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search product name..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Category
          </label>

          <select
            value={categoryId ?? ""}
            onChange={(e) =>
              setCategoryId(
                e.target.value ? Number(e.target.value) : undefined
              )
            }
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
          >
            <option value="">All Categories</option>

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
            value={status ?? ""}
            onChange={(e) => {
              const value = e.target.value;

              setStatus(
                value === "ACTIVE" || value === "INACTIVE"
                  ? value
                  : undefined
              );
            }}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
          >
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            Loading products...
          </div>
        ) : products.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No products found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Product</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Price</th>
                  <th className="px-6 py-4">Stock</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      #{product.id}
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-800">
                        {product.name}
                      </div>

                      {product.description && (
                        <div className="mt-1 max-w-xs truncate text-xs text-gray-500">
                          {product.description}
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      {getCategoryName(product.category_id)}
                    </td>

                    <td className="px-6 py-4 font-medium">
                      ₹{product.price}
                    </td>

                    <td className="px-6 py-4">
                      {product.stock_quantity}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          product.status === "ACTIVE"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {product.status}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            navigate(`/admin/products/${product.id}/edit`)
                          }
                          className="rounded-md border border-blue-200 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50"
                        >
                          Edit
                        </button>

                        {product.status === "ACTIVE" && (
                          <button
                            onClick={() =>
                              handleDeactivate(product.id)
                            }
                            className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                          >
                            Deactivate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}