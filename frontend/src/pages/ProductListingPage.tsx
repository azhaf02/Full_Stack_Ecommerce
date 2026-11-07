import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

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
  stock_status: "in_stock" | "low_stock" | "out_of_stock";
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
  if (imageUrl.startsWith("http")) return imageUrl;
  return `http://127.0.0.1:8000${imageUrl}`;
};

export default function ProductListingPage() {
  const navigate = useNavigate();

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

    fetch(`http://127.0.0.1:8000/api/products/?${params.toString()}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load products");
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

  const openProduct = (productId: number) => {
    navigate(`/product/${productId}`);
  };

  return (
    <main className="min-h-screen bg-[#F8F7F2] px-4 py-7 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">

        {/* Breadcrumb */}
        <Breadcrumb
          items={[
            {
              label: "Home",
              onClick: () => navigate("/"),
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

        {/* Hero Section */}
        <section className="relative mb-12 mt-6 overflow-hidden rounded-[2rem] border border-[#4D572F] bg-[#343A20] px-7 py-12 text-white shadow-md sm:px-12 sm:py-16">
          <div className="pointer-events-none absolute -right-16 -top-24 h-80 w-80 rounded-full border border-[#D9DFC2]/15" />
          <div className="pointer-events-none absolute -right-4 -top-12 h-56 w-56 rounded-full border border-[#D9DFC2]/10" />
          <div className="pointer-events-none absolute bottom-0 right-1/4 h-px w-1/2 bg-gradient-to-r from-transparent via-[#D9DFC2]/30 to-transparent" />

          <div className="relative z-10 max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#D9DFC2]">
              Welcome to Grabby
            </p>

            <h1 className="mt-6 font-serif text-4xl font-medium leading-tight tracking-wide sm:text-5xl lg:text-6xl">
              A little something
              <br />
              <span className="italic text-[#D9DFC2]">for everyone.</span>
            </h1>

            <p className="mt-5 max-w-lg text-sm leading-7 text-[#E5E6DC] sm:text-base">
              Discover thoughtfully selected products, explore your favourites
              and find something worth bringing home.
            </p>

            <button
              type="button"
              onClick={() =>
                document.getElementById("grabby-products")?.scrollIntoView({
                  behavior: "smooth",
                })
              }
              className="mt-8 rounded-full border border-[#D9DFC2] px-7 py-3 text-sm font-semibold tracking-wide text-[#F8F7F2] transition duration-300 hover:bg-[#F8F7F2] hover:text-[#343A20]"
            >
              Discover the collection <span className="ml-2">→</span>
            </button>
          </div>
        </section>

        {/* Category Navigation */}
        <section className="mb-11">
          <div className="mb-5 flex items-end justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#7A8450]">
                Discover more
              </p>
              <h2 className="mt-2 font-serif text-3xl text-[#252A20]">
                Shop by Category
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => handleCategoryChange(null)}
              className={`rounded-full border px-5 py-2.5 text-sm transition duration-300 ${
                selectedCategory === null
                  ? "border-[#343A20] bg-[#343A20] text-white"
                  : "border-[#DCDACF] bg-transparent text-[#343A20] hover:border-[#5F6B3A] hover:bg-[#E8EAD9]"
              }`}
            >
              All Products
            </button>

            {categories.map((category) => (
              <button
                type="button"
                key={category.id}
                onClick={() => handleCategoryChange(category.id)}
                className={`rounded-full border px-5 py-2.5 text-sm transition duration-300 ${
                  selectedCategory === category.id
                    ? "border-[#343A20] bg-[#343A20] text-white"
                    : "border-[#DCDACF] bg-transparent text-[#343A20] hover:border-[#5F6B3A] hover:bg-[#E8EAD9]"
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </section>

        {/* Search */}
        <section className="mb-7 border-y border-[#E5E2D8] py-6">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#7A8450]">
              Find your favourite
            </p>
            <h2 className="mt-1 font-serif text-2xl text-[#252A20]">
              What are you looking for?
            </h2>
          </div>
          <SearchBar />
        </section>

        {/* Filters and Sorting */}
        <section className="mb-12">
          <ProductFilter
            filters={filters}
            onChange={handleFilterChange}
          />

          <div className="mt-5 flex flex-col justify-between gap-3 border-y border-[#E5E2D8] py-5 sm:flex-row sm:items-center">
            <div>
              <p className="font-semibold text-[#343A20]">
                Refine your selection
              </p>
              <p className="mt-1 text-xs text-[#77796F]">
                Arrange the collection to your preference.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <label
                htmlFor="product-sort"
                className="text-sm font-medium text-[#343A20]"
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
                className="min-w-52 rounded-xl border border-[#DCDACF] bg-white px-4 py-3 text-sm text-[#343A20] outline-none transition focus:border-[#5F6B3A] focus:ring-2 focus:ring-[#5F6B3A]/15"
              >
                <option value="newest">Newest First</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>
          </div>
        </section>

        {/* Product Heading */}
        <div
          id="grabby-products"
          className="mb-7 flex flex-wrap items-end justify-between gap-3"
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#7A8450]">
              The Grabby edit
            </p>
            <h2 className="mt-2 font-serif text-3xl text-[#252A20] sm:text-4xl">
              Our Collection
            </h2>
            <div className="mt-3 h-px w-16 bg-[#7A8450]" />
          </div>

          {!loading && !error && (
            <p className="text-sm text-[#77796F]">
              {products.length} products
            </p>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="overflow-hidden border border-[#E5E2D8] bg-white"
              >
                <div className="h-64 animate-pulse bg-[#E8EAD9]" />
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
          <div className="border border-[#DC3545]/20 bg-[#FFE6E6] px-6 py-12 text-center">
            <h2 className="font-serif text-2xl text-[#842029]">
              Something went wrong
            </h2>
            <p className="mt-2 text-sm text-[#842029]">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && products.length === 0 && (
          <div className="border border-[#E5E2D8] bg-white px-6 py-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#E8EAD9] text-3xl text-[#5F6B3A]">
              ♡
            </div>

            <h2 className="mt-5 font-serif text-2xl text-[#252A20]">
              No products found
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#6C7065]">
              We couldn't find products matching your selection. Try changing
              your filters or exploring another category.
            </p>

            <button
              type="button"
              onClick={() => handleCategoryChange(null)}
              className="mt-6 rounded-full bg-[#343A20] px-7 py-3 text-sm font-semibold text-white transition hover:bg-[#5F6B3A]"
            >
              Explore all products
            </button>
          </div>
        )}

        {/* Product Grid */}
        {!loading && !error && products.length > 0 && (
          <>
            <div className="grid grid-cols-1 gap-x-6 gap-y-9 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => {
                const imageUrl = getProductImageUrl(product);
                const inStock = product.stock_status !== "out_of_stock";

                return (
                  <article
                    key={product.id}
                    onClick={() => openProduct(product.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        openProduct(product.id);
                      }
                    }}
                    role="link"
                    tabIndex={0}
                    aria-label={`View ${product.name}`}
                    className="group cursor-pointer border border-[#E5E2D8] bg-white transition duration-300 hover:-translate-y-1 hover:border-[#B8BEA2] hover:shadow-xl hover:shadow-[#343A20]/10 focus:outline-none focus:ring-2 focus:ring-[#5F6B3A]"
                  >
                    {/* Product Image */}
                    <div className="relative h-64 overflow-hidden bg-[#F0EFE8]">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={product.name}
                          loading="lazy"
                          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full flex-col items-center justify-center gap-2 text-[#9A9C92]">
                          <span className="text-5xl">♡</span>
                          <span className="text-xs">
                            Image coming soon
                          </span>
                        </div>
                      )}

                      <span
                        className={`absolute left-3 top-3 px-3 py-1.5 text-[10px] font-bold tracking-wider ${
                          inStock
                            ? "bg-[#E2E9D8] text-[#46502D]"
                            : "bg-[#FFE6E6] text-[#B02A37]"
                        }`}
                      >
                        {inStock ? "IN STOCK" : "OUT OF STOCK"}
                      </span>

                      <div className="absolute inset-x-0 bottom-0 translate-y-full bg-[#343A20]/90 px-4 py-3 text-center text-xs font-semibold tracking-wider text-white transition-transform duration-300 group-hover:translate-y-0">
                        DISCOVER PRODUCT →
                      </div>
                    </div>

                    {/* Product Details */}
                    <div className="p-5">
                      {product.category_name && (
                        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#7A8450]">
                          {product.category_name}
                        </p>
                      )}

                      <h3 className="line-clamp-1 font-serif text-xl text-[#252A20] transition group-hover:text-[#5F6B3A]">
                        {product.name}
                      </h3>

                      {product.description && (
                        <p className="mt-2 line-clamp-2 min-h-10 text-xs leading-5 text-[#77796F]">
                          {product.description}
                        </p>
                      )}

                      <div className="mt-5 flex items-center justify-between border-t border-[#EAE8DF] pt-4">
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-[#77796F]">
                            Price
                          </p>
                          <p className="mt-1 text-xl font-semibold text-[#343A20]">
                            ₹{product.price}
                          </p>
                        </div>

                        <span className="border-b border-[#7A8450] pb-1 text-xs font-semibold text-[#5F6B3A] transition group-hover:border-[#343A20] group-hover:text-[#343A20]">
                          View Details →
                        </span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Pagination */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page === 1}
                className="rounded-full border border-[#DCDACF] bg-white px-6 py-3 text-sm font-medium text-[#343A20] transition hover:border-[#5F6B3A] hover:bg-[#E8EAD9] disabled:cursor-not-allowed disabled:opacity-40"
              >
                ← Previous
              </button>

              <span className="rounded-full bg-[#343A20] px-6 py-3 text-sm font-medium text-white">
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
                className="rounded-full border border-[#DCDACF] bg-white px-6 py-3 text-sm font-medium text-[#343A20] transition hover:border-[#5F6B3A] hover:bg-[#E8EAD9] disabled:cursor-not-allowed disabled:opacity-40"
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
