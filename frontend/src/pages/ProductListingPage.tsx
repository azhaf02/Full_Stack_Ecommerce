import { useEffect, useState } from "react";
import apiClient from '../services/apiClient';
import { useNavigate } from 'react-router-dom';
import Breadcrumb from "../components/Breadcrumb";
import ProductFilter, {
  type ProductFilters,
} from "../components/ProductFilter";

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

type SortOption = "newest" | "price_asc" | "price_desc";

const API_URL = "http://127.0.0.1:8000";

const initialFilters: ProductFilters = {
  category_id: "",
  min_price: "",
  max_price: "",
  in_stock: null,
};

const getImageUrl = (imageUrl?: string | null) => {
  if (!imageUrl) return null;

  if (imageUrl.startsWith("http")) {
    return imageUrl;
  }

  return `${API_URL}${imageUrl}`;
};

export default function ProductListingPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(
    null
  );
  const [filters, setFilters] = useState<ProductFilters>(initialFilters);
  const [sort, setSort] = useState<SortOption>("newest");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const pageSize = 8;

  useEffect(() => {
    fetch(`${API_URL}/api/catalog/categories`)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Failed to load categories");
        }
        return res.json();
      })
      .then((data) => setCategories(data))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    setLoading(true);
    setError("");

    const params = new URLSearchParams({
      page: String(page),
      page_size: String(pageSize),
      sort,
    });

    const categoryId =
      filters.category_id !== ""
        ? filters.category_id
        : selectedCategory;

    if (categoryId !== null && categoryId !== null) {
      params.set("category_id", String(categoryId));
    }

    if (filters.min_price.trim() !== "") {
      params.set("min_price", filters.min_price);
    }

    if (filters.max_price.trim() !== "") {
      params.set("max_price", filters.max_price);
    }

    if (filters.in_stock !== null) {
      params.set("in_stock", String(filters.in_stock));
    }

    fetch(`${API_URL}/api/products/?${params.toString()}`)
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
  }, [page, pageSize, selectedCategory, filters, sort]);

  const handleCategoryChange = (categoryId: number | null) => {
    setSelectedCategory(categoryId);
    setFilters((current) => ({
      ...current,
      category_id: "",
    }));
    setPage(1);
  };

  const handleFilterChange = (nextFilters: ProductFilters) => {
    setFilters(nextFilters);
    setPage(1);
  };

  const handleSortChange = (value: SortOption) => {
    setSort(value);
    setPage(1);
  };

  const handleClearFilters = () => {
    setFilters(initialFilters);
    setSelectedCategory(null);
    setSort("newest");
    setPage(1);
  };

  const displayedCategory =
    filters.category_id !== ""
      ? filters.category_id
      : selectedCategory;

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-7xl">
        <Breadcrumb
          items={[
            {
              label: "Home",
              onClick: () => handleCategoryChange(null),
            },
            ...(displayedCategory !== null
              ? [
                  {
                    label:
                      categories.find(
                        (category) => category.id === displayedCategory
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
              background:
                selectedCategory === null &&
                filters.category_id === ""
                  ? "#222"
                  : "#fff",
              color:
                selectedCategory === null &&
                filters.category_id === ""
                  ? "#fff"
                  : "#222",
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
                  displayedCategory === category.id ? "#222" : "#fff",
                color:
                  displayedCategory === category.id ? "#fff" : "#333",
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

        {/* Filters and Sorting */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
          <div className="rounded-xl bg-white p-5 shadow-sm md:col-span-1">
            <ProductFilter
              filters={{
                ...filters,
                category_id:
                  filters.category_id !== ""
                    ? filters.category_id
                    : selectedCategory ?? "",
              }}
              onChange={handleFilterChange}
            />
          </div>

          <div className="md:col-span-3">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-gray-900">
                Browse Products
              </h2>

              <div className="flex items-center gap-2">
                <label
                  htmlFor="product-sort"
                  className="text-sm font-medium text-gray-700"
                >
                  Sort by:
                </label>

                <select
                  id="product-sort"
                  value={sort}
                  onChange={(event) =>
                    handleSortChange(event.target.value as SortOption)
                  }
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="newest">Newest</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClearFilters}
              className="mb-5 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Clear All Filters
            </button>

            {/* Loading */}
            {loading && (
              <p className="py-10 text-center text-gray-600">
                Loading products...
              </p>
            )}

            {/* Error */}
            {!loading && error && (
              <p className="py-10 text-center text-red-600">{error}</p>
            )}

            {/* Empty State */}
            {!loading && !error && products.length === 0 && (
              <div className="rounded-lg bg-white py-16 text-center shadow-sm">
                <h2 className="text-xl font-semibold text-gray-800">
                  No products found
                </h2>
                <p className="mt-2 text-gray-500">
                  Try changing or clearing your filters.
                </p>
              </div>
            )}

            {/* Product Grid */}
            {!loading && !error && products.length > 0 && (
              <>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      className="overflow-hidden rounded-xl bg-white shadow-sm transition hover:shadow-md"
                    >
                      <div className="relative h-52 bg-gray-100">
  <button
    type="button"
    aria-label="Add to wishlist"
    className="absolute right-3 top-3 z-10 rounded-full bg-white px-3 py-2 text-xl shadow hover:bg-pink-50"
    onClick={async (event) => {
      event.stopPropagation();

      if (!localStorage.getItem('token')) {
        navigate('/login');
        return;
      }

      try {
        await apiClient.post('/api/wishlist/', {
          product_id: product.id,
        });
        alert('Product added to wishlist!');
      } catch (error) {
        console.error('Wishlist update failed:', error);
        alert('Could not add product. It may already be in your wishlist.');
      }
    }}
  >
    ♡
  </button>
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
                    disabled={page === 1 || loading}
                    className="rounded-lg border bg-white px-4 py-2 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Previous
                  </button>

                  <span className="font-medium text-gray-700">
                    Page {page}
                  </span>

                  <button
                    onClick={() => setPage((prev) => prev + 1)}
                    disabled={products.length < pageSize || loading}
                    className="rounded-lg border bg-white px-4 py-2 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}