import { useEffect, useState } from "react";
import Breadcrumb from "../components/Breadcrumb";
type Product = {
  id: number;
  name: string;
  description?: string;
  price: string | number;
  stock_quantity: number;
  stock_status: "IN_STOCK" | "OUT_OF_STOCK";
  status: "ACTIVE" | "INACTIVE";
  image_url?: string | null;
  category_id: number;
  category_name?: string | null;
};

type Category = {
  id: number;
  name: string;
};
const getImageUrl = (imageUrl?: string | null) => {
  if (!imageUrl) return null;

  if (imageUrl.startsWith("http")) {
    return imageUrl;
  }

  return `http://127.0.0.1:8000${imageUrl}`;
};

export default function ProductListingPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const pageSize = 8;

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/catalog/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    setLoading(true);
    setError("");

    const categoryParam = selectedCategory
      ? `&category_id=${selectedCategory}`
      : "";

    fetch(
  `http://127.0.0.1:8000/api/products/?page=${page}&page_size=${pageSize}${categoryParam}`
)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to load products");
        }
        return res.json();
      })
      .then((data) => {
        setProducts(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Unable to load products.");
        setProducts([]);
        setLoading(false);
      });
  }, [page, selectedCategory]);

  const handleCategoryChange = (categoryId: number | null) => {
    setSelectedCategory(categoryId);
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-7xl">
  <Breadcrumb
    items={[
      {
        label: "Home",
        onClick: () => handleCategoryChange(null),
      },
      ...(selectedCategory !== null
        ? [
            {
              label:
                categories.find(
                  (category) => category.id === selectedCategory
                )?.name || "Category",
            },
          ]
        : []),
    ]}
  />

  <h1 className="mb-6 text-3xl font-bold text-gray-900">
    Products
  </h1>

        {/* Category Navigation */}
<div
  style={{
    display: "flex",
    flexWrap: "wrap",
    gap: "12px",
    marginBottom: "32px",
    paddingBottom: "20px",
    borderBottom: "1px solid #e5e5e5",
  }}
>
  <button
    type="button"
    onClick={() => handleCategoryChange(null)}
    style={{
      padding: "11px 22px",
      borderRadius: "999px",
      border: "1px solid #222",
      background: selectedCategory === null ? "#222" : "#fff",
      color: selectedCategory === null ? "#fff" : "#222",
      fontSize: "14px",
      fontWeight: 600,
      cursor: "pointer",
      minWidth: "110px",
    }}
  >
    All Products
  </button>

  {categories.map((category) => (
    <button
      type="button"
      key={category.id}
      onClick={() => handleCategoryChange(category.id)}
      style={{
        padding: "11px 22px",
        borderRadius: "999px",
        border: "1px solid #d5d5d5",
        background:
          selectedCategory === category.id ? "#222" : "#fff",
        color:
          selectedCategory === category.id ? "#fff" : "#333",
        fontSize: "14px",
        fontWeight: 600,
        cursor: "pointer",
        minWidth: "100px",
      }}
    >
      {category.name}
    </button>
  ))}
</div>

        {/* Loading */}
        {loading && (
          <p className="py-10 text-center text-gray-600">
            Loading products...
          </p>
        )}

        {/* Error */}
        {!loading && error && (
          <p className="py-10 text-center text-red-600">
            {error}
          </p>
        )}

        {/* Empty State */}
        {!loading && !error && products.length === 0 && (
          <div className="rounded-lg bg-white py-16 text-center shadow-sm">
            <h2 className="text-xl font-semibold text-gray-800">
              No products found
            </h2>
            <p className="mt-2 text-gray-500">
              No active products are available in this category.
            </p>
          </div>
        )}

        {/* Product Grid */}
        {!loading && !error && products.length > 0 && (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="overflow-hidden rounded-xl bg-white shadow-sm transition hover:shadow-md"
                >
                  <div className="h-52 bg-gray-100">
                    {getImageUrl(product.image_url) ? (
  <img
    src={getImageUrl(product.image_url)!}
    alt={product.name}
    className="h-full w-full object-cover"
  />
) : (
                      <div className="flex h-full items-center justify-center text-gray-400">
                        No Image
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <h2 className="font-semibold text-gray-900">
                        {product.name}
                      </h2>

                      <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                        {product.status}
                      </span>
                    </div>
                    {product.stock_status === "OUT_OF_STOCK" && (
                      <span className="mt-2 inline-block rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700">
                        Out of Stock
                      </span>
                    )}

                    {product.category_name && (
                      <p className="mb-2 text-sm text-gray-500">
                        {product.category_name}
                      </p>
                    )}

                    <p className="text-lg font-bold text-gray-900">
                      ₹{product.price}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="mt-8 flex items-center justify-center gap-4">
              <button
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page === 1}
                className="rounded-lg border bg-white px-4 py-2 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>

              <span className="font-medium text-gray-700">
                Page {page}
              </span>

              <button
                onClick={() => {
                  if (products.length === pageSize) {
                    setPage((prev) => prev + 1);
                  }
                }}
                disabled={products.length < pageSize}
                className="rounded-lg border bg-white px-4 py-2 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}