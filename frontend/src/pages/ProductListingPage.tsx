
import { useEffect, useState } from "react";
import Breadcrumb from "../components/Breadcrumb";
import ProductFilter, {
  type ProductFilters,
} from "../components/ProductFilter";
import SearchBar from "../components/SearchBar.tsx";

type Product = {
  id: number;
  name: string;
  description?: string;
  price: string | number;
  stock_quantity: number;
  stock_status: "IN_STOCK" | "OUT_OF_STOCK";
  status: "ACTIVE" | "INACTIVE";
  image_url?: string | null;
  images?: {
    id: number;
    image_url: string;
    is_primary: boolean;
  }[];
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

  const [filters, setFilters] = useState<ProductFilters>({
    category_id: "",
    min_price: "",
    max_price: "",
    in_stock: null,
  });

  const [sort, setSort] = useState<
    "newest" | "price_asc" | "price_desc"
  >("newest");

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

    const params = new URLSearchParams({
      page: String(page),
      page_size: String(pageSize),
      sort,
    });

    if (filters.category_id !== "") {
      params.set("category_id", String(filters.category_id));
    } else if (selectedCategory !== null) {
      params.set("category_id", String(selectedCategory));
    }

    if (filters.min_price !== "") {
      params.set("min_price", filters.min_price);
    }

    if (filters.max_price !== "") {
      params.set("max_price", filters.max_price);
    }

    if (filters.in_stock !== null) {
      params.set("in_stock", String(filters.in_stock));
    }

    fetch(
      `http://127.0.0.1:8000/api/products/?${params.toString()}`
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
  }, [page, selectedCategory, filters, sort]);

  const handleCategoryChange = (categoryId: number | null) => {
    setSelectedCategory(categoryId);
    setFilters((prev) => ({
      ...prev,
      category_id: categoryId ?? "",
    }));
    setPage(1);
  };

  const getProductImageUrl = (product: Product) => {
    const imageUrl =
      product.image_url ||
      product.images?.find((image) => image.is_primary)?.image_url ||
      product.images?.[0]?.image_url;

    return getImageUrl(imageUrl);
  };

  const handleFilterChange = (updatedFilters: ProductFilters) => {
    setFilters(updatedFilters);
    setSelectedCategory(
      updatedFilters.category_id === ""
        ? null
        : Number(updatedFilters.category_id)
    );
    setPage(1);
  };

  return (
    <main className="min-h-screen bg-[#F8F7F2] px-4 py-7 sm:px-6 lg:px-8">
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

        {/* Page Heading */}
        <section className="relative mb-8 mt-5 overflow-hidden rounded-3xl bg-[#343A20] px-6 py-9 text-white shadow-sm sm:px-10 sm:py-12">
          <div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full border-[35px] border-white/5" />
          <div className="pointer-events-none absolute -bottom-28 right-40 h-56 w-56 rounded-full bg-[#7A8450]/20 blur-2xl" />

          <div className="relative z-10 max-w-2xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-[#D8DDBE]">
              Discover something beautiful
            </p>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              Explore Our Collection
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-7 text-[#E4E6D9] sm:text-base">
              Find your favourites from our thoughtfully curated collection.
              Browse, discover, and choose what you love.
            </p>

            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-medium text-[#F0F1E9]">
              <span className="h-2 w-2 rounded-full bg-[#C6D19A]" />
              Explore the VIORA collection
            </div>
          </div>
        </section>

        {/* Category Navigation */}
        <section className="mb-7">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#7A8450]">
                Browse by category
              </p>
              <h2 className="mt-1 text-xl font-bold text-[#252A20]">
                Find your style
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => handleCategoryChange(null)}
              className={`rounded-full border px-5 py-2.5 text-sm font-semibold transition ${
                selectedCategory === null
                  ? "border-[#5F6B3A] bg-[#5F6B3A] text-white shadow-sm"
                  : "border-[#E5E2D8] bg-white text-[#343A20] hover:border-[#7A8450] hover:bg-[#E8EAD9]"
              }`}
            >
              All Products
            </button>

            {categories.map((category) => (
              <button
                type="button"
                key={category.id}
                onClick={() => handleCategoryChange(category.id)}
                className={`rounded-full border px-5 py-2.5 text-sm font-semibold transition ${
                  selectedCategory === category.id
                    ? "border-[#5F6B3A] bg-[#5F6B3A] text-white shadow-sm"
                    : "border-[#E5E2D8] bg-white text-[#343A20] hover:border-[#7A8450] hover:bg-[#E8EAD9]"
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </section>

        {/* Search */}
        <section className="mb-6 rounded-2xl border border-[#E5E2D8] bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-3">
            <h2 className="font-bold text-[#252A20]">Looking for something?</h2>
            <p className="mt-1 text-sm text-[#6C7065]">
              Search products by name or description.
            </p>
          </div>
          <SearchBar />
        </section>

        {/* Filters and Sorting */}
        <section className="mb-8">
          <ProductFilter
            filters={filters}
            onChange={handleFilterChange}
          />

          <div className="mt-4 flex flex-col justify-between gap-3 rounded-2xl border border-[#E5E2D8] bg-white px-5 py-4 shadow-sm sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-bold text-[#252A20]">
                Make it yours
              </p>
              <p className="mt-1 text-xs text-[#6C7065]">
                Arrange products the way you like.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <label
                htmlFor="product-sort"
                className="text-sm font-semibold text-[#343A20]"
              >
                Sort by
              </label>

              <select
                id="product-sort"
                value={sort}
                onChange={(event) => {
                  setSort(
                    event.target.value as
                      | "newest"
                      | "price_asc"
                      | "price_desc"
                  );
                  setPage(1);
                }}
                className="min-w-52 rounded-xl border border-[#E5E2D8] bg-[#FDFCFA] px-4 py-3 text-sm text-[#252A20] outline-none transition focus:border-[#5F6B3A] focus:ring-2 focus:ring-[#5F6B3A]/15"
              >
                <option value="newest">Newest First</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>
          </div>
        </section>

        {/* Product Section Heading */}
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#7A8450]">
              The VIORA edit
            </p>
            <h2 className="mt-1 text-2xl font-bold text-[#252A20]">
              Our Products
            </h2>
          </div>

          {!loading && !error && (
            <p className="text-sm text-[#6C7065]">
              Showing {products.length} product{products.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-2xl border border-[#E5E2D8] bg-white"
              >
                <div className="h-56 animate-pulse bg-[#E8EAD9]" />
                <div className="space-y-3 p-5">
                  <div className="h-4 w-3/4 animate-pulse rounded bg-[#E8EAD9]" />
                  <div className="h-4 w-1/3 animate-pulse rounded bg-[#E8EAD9]" />
                  <div className="h-5 w-1/2 animate-pulse rounded bg-[#E8EAD9]" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="rounded-2xl border border-[#DC3545]/20 bg-[#FFE6E6] px-6 py-12 text-center">
            <h2 className="text-lg font-bold text-[#842029]">
              Something went wrong
            </h2>
            <p className="mt-2 text-sm text-[#842029]">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && products.length === 0 && (
          <div className="rounded-2xl border border-[#E5E2D8] bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#E8EAD9] text-3xl">
              ♡
            </div>
            <h2 className="mt-5 text-xl font-bold text-[#252A20]">
              No products found
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#6C7065]">
              We couldn't find products matching your selection. Try changing
              your filters or exploring another category.
            </p>
            <button
              type="button"
              onClick={() => handleCategoryChange(null)}
              className="mt-6 rounded-xl bg-[#5F6B3A] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#4D572F]"
            >
              Explore all products
            </button>
          </div>
        )}

        {/* Product Grid */}
        {!loading && !error && products.length > 0 && (
          <>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => {
                const imageUrl = getProductImageUrl(product);
                const inStock = product.stock_status === "IN_STOCK";

                return (
                  <article
                    key={product.id}
                    className="group overflow-hidden rounded-2xl border border-[#E5E2D8] bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#343A20]/10"
                  >
                    <div className="relative h-60 overflow-hidden bg-[#F0EFE8]">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={product.name}
                          loading="lazy"
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full flex-col items-center justify-center gap-2 text-[#9A9C92]">
                          <span className="text-4xl">♡</span>
                          <span className="text-xs font-medium">
                            Image coming soon
                          </span>
                        </div>
                      )}

                      <span
                        className={`absolute left-3 top-3 rounded-full px-3 py-1.5 text-[11px] font-bold ${
                          inStock
                            ? "bg-[#D1E7DD] text-[#146C43]"
                            : "bg-[#FFE6E6] text-[#B02A37]"
                        }`}
                      >
                        {inStock ? "IN STOCK" : "OUT OF STOCK"}
                      </span>
                    </div>

                    <div className="p-5">
                      {product.category_name && (
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#7A8450]">
                          {product.category_name}
                        </p>
                      )}

                      <h3 className="line-clamp-1 text-base font-bold text-[#252A20] transition group-hover:text-[#5F6B3A]">
                        {product.name}
                      </h3>

                      {product.description && (
                        <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-[#6C7065]">
                          {product.description}
                        </p>
                      )}

                      <div className="mt-4 flex items-center justify-between border-t border-[#E5E2D8] pt-4">
                        <div>
                          <p className="text-xs text-[#6C7065]">Price</p>
                          <p className="mt-1 text-xl font-bold text-[#343A20]">
                            ₹{product.price}
                          </p>
                        </div>

                        <span className="rounded-xl bg-[#E8EAD9] px-3 py-2 text-xs font-semibold text-[#5F6B3A]">
                          View product
                        </span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Pagination */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page === 1}
                className="rounded-xl border border-[#E5E2D8] bg-white px-5 py-2.5 text-sm font-semibold text-[#343A20] transition hover:border-[#5F6B3A] hover:bg-[#E8EAD9] disabled:cursor-not-allowed disabled:opacity-40"
              >
                ← Previous
              </button>

              <span className="rounded-xl bg-[#343A20] px-5 py-2.5 text-sm font-semibold text-white">
                Page {page}
              </span>

              <button
                type="button"
                onClick={() => {
                  if (products.length === pageSize) {
                    setPage((prev) => prev + 1);
                  }
                }}
                disabled={products.length < pageSize}
                className="rounded-xl border border-[#E5E2D8] bg-white px-5 py-2.5 text-sm font-semibold text-[#343A20] transition hover:border-[#5F6B3A] hover:bg-[#E8EAD9] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
