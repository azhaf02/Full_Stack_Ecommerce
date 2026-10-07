import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";

const API_URL = "http://127.0.0.1:8000";

function SearchResultsPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      if (!query.trim()) {
        setProducts([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const response = await fetch(
          `${API_URL}/api/products/search?q=${encodeURIComponent(query)}`
        );

        if (!response.ok) {
          throw new Error("Search failed");
        }

        const data = await response.json();
        setProducts(data);
      } catch (error) {
        console.error(error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [query]);

  if (loading) {
    return <div className="container mt-4">Searching products...</div>;
  }

  return (
    <div className="container mt-4">
      <h2>Search Results</h2>

      {query && (
        <p className="text-muted">
          Results for: <strong>{query}</strong>
        </p>
      )}

      {products.length === 0 ? (
        <div className="alert alert-info mt-4">
          No products found. Try another keyword.
        </div>
      ) : (
        <div className="row mt-3">
          {products.map((product) => (
            <div className="col-md-4 mb-4" key={product.id}>
              <div className="card h-100">
                <div className="card-body">
                  <h5 className="card-title">{product.name}</h5>

                  <p className="card-text">
                    {product.description}
                  </p>

                  <p className="fw-bold">
                    ₹{Number(product.price).toFixed(2)}
                  </p>

                  <Link
                    to={`/products/${product.id}`}
                    className="btn btn-primary"
                  >
                    View Product
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SearchResultsPage;