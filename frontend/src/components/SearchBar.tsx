import { useState } from 'react';
import axios from 'axios';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock_quantity: number;
  status: string;
}

function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    const searchQuery = query.trim();

    if (!searchQuery) {
      setResults([]);
      setSearched(false);
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      const response = await axios.get(
        'http://localhost:8000/api/products/search',
        {
          params: { q: searchQuery },
        }
      );

      setResults(response.data);
    } catch (error) {
      console.error('Search failed:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '420px',
        maxWidth: '40vw',
      }}
    >
      {/* Search Form */}
      <form
        onSubmit={handleSearch}
        style={{
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
        }}
      >
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products..."
          maxLength={100}
          style={{
            flex: 1,
            height: '38px',
            padding: '0 14px',
            borderRadius: '6px',
            border: '1px solid rgba(255,255,255,0.25)',
            backgroundColor: '#FAF8F5',
            color: '#1A211B',
            outline: 'none',
            fontSize: '13px',
          }}
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            height: '38px',
            padding: '0 16px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: '#9EAA96',
            color: '#1B241C',
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '1px',
            textTransform: 'uppercase',
            cursor: loading ? 'default' : 'pointer',
          }}
        >
          {loading ? '...' : 'Search'}
        </button>
      </form>

      {/* Floating Search Results */}
      {(searched || loading) && (
        <div
          style={{
            position: 'absolute',
            top: '46px',
            left: 0,
            right: 0,
            backgroundColor: '#FFFFFF',
            border: '1px solid #E5DFD5',
            borderRadius: '8px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
            zIndex: 1000,
            maxHeight: '320px',
            overflowY: 'auto',
          }}
        >
          {loading && (
            <div
              style={{
                padding: '16px',
                fontSize: '13px',
                color: '#768572',
              }}
            >
              Searching...
            </div>
          )}

          {!loading && results.length === 0 && (
            <div
              style={{
                padding: '18px',
              }}
            >
              <div
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#232F24',
                }}
              >
                No products found.
              </div>

              <div
                style={{
                  fontSize: '11px',
                  color: '#768572',
                  marginTop: '4px',
                }}
              >
                Try another keyword.
              </div>
            </div>
          )}

          {!loading &&
            results.map((product) => (
              <div
                key={product.id}
                style={{
                  padding: '14px 16px',
                  borderBottom: '1px solid #E5DFD5',
                  cursor: 'pointer',
                }}
              >
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: 700,
                    color: '#232F24',
                  }}
                >
                  {product.name}
                </div>

                <div
                  style={{
                    fontSize: '11px',
                    color: '#768572',
                    marginTop: '4px',
                  }}
                >
                  {product.description}
                </div>

                <div
                  style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    color: '#232F24',
                    marginTop: '7px',
                  }}
                >
                  ₹{product.price}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

export default SearchBar;