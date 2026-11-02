
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_URL = "http://127.0.0.1:8000";

interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number | string;
  image_url?: string | null;
}

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const navigate = useNavigate();

  // Fetch matching products while typing
  useEffect(() => {
    const searchText = query.trim();

    if (!searchText) {
      setProducts([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    const timer = setTimeout(async () => {
      try {
        setLoading(true);

        const response = await fetch(
          `${API_URL}/api/products/search?q=${encodeURIComponent(searchText)}`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error("Search failed");
        }

        const data = await response.json();
        setProducts(data);
      } catch (error) {
        if (error instanceof Error && error.name !== "AbortError") {
          console.error(error);
          setProducts([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!query.trim()) return;

    setIsOpen(false);
    navigate(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <div className="relative w-full">
      <form onSubmit={handleSearch} className="flex w-full gap-2">

        <input
          type="text"
          placeholder="search for product "
          value={query}
          maxLength={100}
          onChange={(e) => {
  console.log("Typed:", e.target.value);
  setQuery(e.target.value);
  setIsOpen(true);
}}
          onFocus={() => setIsOpen(true)}
          className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 outline-none focus:border-viora-olive focus:ring-1 focus:ring-viora-olive"
        />

        <button
          type="submit"
          className="rounded-lg bg-viora-olive px-4 py-2 text-sm font-semibold text-white hover:bg-viora-olive-dark"
        >
          Search
        </button>
      </form>

      {/* Live Search Suggestions */}
      {isOpen && query.trim() && (
        <div className="absolute left-0 right-0 top-full z-[9999] mt-2 max-h-96 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-xl">

          {loading && (
            <p className="p-4 text-sm text-gray-500">
              Searching products...
            </p>
          )}

          {!loading && products.length === 0 && (
            <p className="p-4 text-sm text-gray-500">
              No products found.
            </p>
          )}

          {!loading && products.map((product) => (
            <Link
              key={product.id}
              to={`/product/${product.id}`}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 border-b border-gray-100 p-3 text-gray-900 no-underline transition hover:bg-gray-50"
            >
              {product.image_url ? (
                <img
                  src={
                    product.image_url.startsWith("http")
                      ? product.image_url
                      : `${API_URL}${product.image_url}`
                  }
                  alt={product.name}
                  className="h-12 w-12 rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 text-xs text-gray-400">
                  No Image
                </div>
              )}

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {product.name}
                </p>

                <p className="text-sm font-medium text-viora-olive">
                  ₹{Number(product.price).toFixed(2)}
                </p>
              </div>
            </Link>
          ))}

          {!loading && products.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                navigate(`/search?q=${encodeURIComponent(query.trim())}`);
              }}
              className="w-full p-3 text-center text-sm font-semibold text-viora-olive hover:bg-gray-50"
            >
              View all search results →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
