import { useState, useEffect } from 'react';

export interface WishlistItem {
  id: number;
  product_id: number;
  name: string;
  category: string;
  price: string;
  originalPrice?: string;
  inStock: boolean;
  imageIcon: string;
}

const DEFAULT_WISHLIST: WishlistItem[] = [
  {
    id: 1,
    product_id: 1,
    name: 'Bluetooth Noise-Cancelling Headphones',
    category: 'Electronics / Audio',
    price: '₹7,499',
    originalPrice: '₹9,999',
    inStock: true,
    imageIcon: '🎧',
  },
  {
    id: 2,
    product_id: 2,
    name: 'Smart Fitness Watch v2',
    category: 'Wearables / Fitness',
    price: '₹2,499',
    originalPrice: '₹3,999',
    inStock: true,
    imageIcon: '⌚',
  },
  {
    id: 3,
    product_id: 3,
    name: 'Ergonomic Mechanical Keyboard',
    category: 'Peripherals / Office',
    price: '₹4,199',
    originalPrice: '₹5,499',
    inStock: false,
    imageIcon: '⌨️',
  },
];

export default function WishlistListView() {
  const [items, setItems] = useState<WishlistItem[]>(DEFAULT_WISHLIST);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Reuses GET /api/wishlist with fallback
  useEffect(() => {
    let isMounted = true;
    const fetchWishlist = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/wishlist');
        if (res.ok) {
          const data = await res.json();
          if (isMounted && Array.isArray(data) && data.length > 0) {
            setItems(data);
          }
        }
      } catch (err) {
        // Fallback to default mock list if endpoint is offline
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchWishlist();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleRemove = (id: number, name: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    setNotification(`Removed "${name}" from your wishlist.`);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleAddToCart = (name: string) => {
    setNotification(`Added "${name}" to your shopping bag!`);
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        borderRadius: '18px',
        padding: '28px',
        border: '1px solid #e8e5de',
        boxShadow: '0 8px 30px rgba(0,0,0,0.03)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '22px',
          borderBottom: '1px solid #f0ede6',
          paddingBottom: '16px',
        }}
      >
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1e241e', margin: '0 0 4px 0' }}>
            My Wishlist ({items.length})
          </h2>
          <p style={{ margin: 0, fontSize: '13px', color: '#6e776e' }}>
            Saved items you love. Move them to your cart or purchase anytime.
          </p>
        </div>
        <span
          style={{
            fontSize: '12px',
            fontWeight: '600',
            backgroundColor: '#eef2e6',
            color: '#5F6B3A',
            padding: '6px 14px',
            borderRadius: '20px',
          }}
        >
          Viora Curated List
        </span>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          style={{
            padding: '10px 16px',
            backgroundColor: '#eef2e6',
            color: '#343A20',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: '600',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span>✓</span> {notification}
        </div>
      )}

      {/* Loading & Empty State Handling */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6e776e' }}>
          <div className="spinner-border spinner-border-sm me-2" role="status"></div>
          Loading your wishlist...
        </div>
      ) : items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 20px', color: '#8a948a' }}>
          <div style={{ fontSize: '42px', marginBottom: '12px' }}>🤍</div>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#2f3e30' }}>Your wishlist is empty</h3>
          <p style={{ fontSize: '13px', marginTop: '4px' }}>Explore products and save what catches your eye.</p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '20px',
          }}
        >
          {items.map((item) => (
            <div
              key={item.id}
              style={{
                border: '1px solid #e8e5de',
                borderRadius: '14px',
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'box-shadow 0.2s ease',
                backgroundColor: '#faf9f5',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div
                    style={{
                      fontSize: '36px',
                      padding: '12px',
                      backgroundColor: '#ffffff',
                      borderRadius: '12px',
                      border: '1px solid #edebe4',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '60px',
                      height: '60px',
                    }}
                  >
                    {item.imageIcon || '🛍️'}
                  </div>
                  <button
                    onClick={() => handleRemove(item.id, item.name)}
                    title="Remove item"
                    aria-label="Remove item"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#a0a8a0',
                      fontSize: '18px',
                      padding: '4px',
                      lineHeight: '1',
                    }}
                  >
                    ✕
                  </button>
                </div>

                <div style={{ marginTop: '14px' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      color: '#5F6B3A',
                      fontWeight: '700',
                    }}
                  >
                    {item.category}
                  </span>
                  <h3
                    style={{
                      fontSize: '15px',
                      fontWeight: '600',
                      color: '#1e241e',
                      margin: '4px 0 8px 0',
                      lineHeight: '1.3',
                    }}
                  >
                    <a
                      href={`/products/${item.product_id}`}
                      style={{ color: 'inherit', textDecoration: 'none' }}
                      title="View product details"
                    >
                      {item.name}
                    </a>
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '16px', fontWeight: '700', color: '#2f3e30' }}>{item.price}</span>
                    {item.originalPrice && (
                      <span style={{ fontSize: '13px', color: '#a0a8a0', textDecoration: 'line-through' }}>
                        {item.originalPrice}
                      </span>
                    )}
                  </div>
                  <div>
                    {item.inStock ? (
                      <span
                        style={{
                          fontSize: '11px',
                          color: '#2d7a3e',
                          fontWeight: '600',
                          backgroundColor: '#e2f4e6',
                          padding: '3px 8px',
                          borderRadius: '6px',
                        }}
                      >
                        In Stock
                      </span>
                    ) : (
                      <span
                        style={{
                          fontSize: '11px',
                          color: '#b23b3b',
                          fontWeight: '600',
                          backgroundColor: '#fde8e8',
                          padding: '3px 8px',
                          borderRadius: '6px',
                        }}
                      >
                        Out of Stock
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '18px', display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  disabled={!item.inStock}
                  onClick={() => handleAddToCart(item.name)}
                  style={{
                    flex: 1,
                    backgroundColor: item.inStock ? '#5F6B3A' : '#cccccc',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: item.inStock ? 'pointer' : 'not-allowed',
                    transition: 'background-color 0.2s',
                  }}
                >
                  Move to Bag
                </button>
                <a
                  href={`/products/${item.product_id}`}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #dcd7cb',
                    backgroundColor: '#ffffff',
                    color: '#343A20',
                    fontSize: '12px',
                    fontWeight: '600',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  View
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}