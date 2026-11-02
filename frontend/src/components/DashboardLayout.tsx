import { useState, useEffect } from 'react';
import OrdersListView from './OrdersListView';
import NotificationCenter from './NotificationCenter';
import { ReviewsList } from './ReviewsList';
import NewTicketPage from '../pages/support/NewTicketPage';
import { SupportChatbot } from './SupportChatbot';
import apiClient, { getErrorMessage } from '../services/apiClient';

interface WishlistProduct {
  id: number;
  name: string;
  price: number | string;
  images: {
    id: number;
    image_url: string;
    is_primary: boolean;
  }[];
}

interface WishlistItem {
  id: number;
  product_id: number;
  product: WishlistProduct;
}

function VioraBrandBag() {
  return (
    <svg width="26" height="30" viewBox="0 0 24 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 7V5C8 2.79 9.79 1 12 1C14.21 1 16 2.79 16 5V7" stroke="#FAF8F5" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M4 7H20L21.4 25C21.45 25.8 20.8 26.5 20 26.5H4C3.2 26.5 2.55 25.8 2.6 25L4 7Z" stroke="#FAF8F5" strokeWidth="1.8" strokeLinejoin="round" />
      <circle cx="12" cy="17" r="3" stroke="#FAF8F5" strokeWidth="1.4" />
      <path d="M12 14.8V17" stroke="#FAF8F5" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

// Wishlist component
function WishlistContent() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [error, setError] = useState('');

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await apiClient.get('/api/wishlist');

      setItems(response.data.items || []);
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load your wishlist.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  const handleRemove = async (productId: number) => {
    try {
      setRemovingId(productId);

      await apiClient.delete(`/api/wishlist/items/${productId}`);

      setItems((currentItems) =>
        currentItems.filter(
          (item) => item.product_id !== productId
        )
      );
    } catch (err) {
      alert(getErrorMessage(err, 'Unable to remove this product.'));
    } finally {
      setRemovingId(null);
    }
  };

  if (loading) {
    return (
      <div style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #E5DFD5',
        padding: '50px',
        textAlign: 'center',
        color: '#768572'
      }}>
        Loading your wishlist...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #E5DFD5',
        padding: '35px',
        textAlign: 'center'
      }}>
        <p style={{ color: '#9E4E42' }}>{error}</p>
        <button
          type="button"
          onClick={fetchWishlist}
          style={{
            backgroundColor: '#232F24',
            color: '#FAF8F5',
            border: 'none',
            padding: '10px 20px',
            cursor: 'pointer'
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #E5DFD5',
        padding: '55px 25px',
        textAlign: 'center'
      }}>
        <div style={{
          fontSize: '42px',
          color: '#8E9E86',
          marginBottom: '12px'
        }}>
          ♡
        </div>

        <h3 style={{
          fontFamily: "'Cinzel', Georgia, serif",
          color: '#232F24',
          fontSize: '21px',
          marginBottom: '10px'
        }}>
          Your Wishlist is Empty
        </h3>

        <p style={{
          color: '#768572',
          fontSize: '13px',
          margin: 0
        }}>
          Save your favourite products and find them here anytime.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '22px',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <div>
          <div style={{
            fontSize: '10px',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            color: '#768572',
            fontWeight: 600
          }}>
            Saved Collection
          </div>

          <h2 style={{
            fontFamily: "'Cinzel', Georgia, serif",
            fontSize: '24px',
            color: '#232F24',
            margin: '5px 0 0'
          }}>
            My Wishlist
          </h2>
        </div>

        <span style={{
          fontSize: '12px',
          color: '#768572'
        }}>
          {items.length} saved {items.length === 1 ? 'product' : 'products'}
        </span>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: '20px'
      }}>
        {items.map((item) => {
          const product = item.product;

          const primaryImage =
            product.images?.find((image) => image.is_primary) ||
            product.images?.[0];

          return (
            <div
              key={item.id}
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E5DFD5',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <div style={{
                height: '190px',
                backgroundColor: '#F8F7F2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                marginBottom: '14px'
              }}>
                {primaryImage?.image_url ? (
                  <img
                    src={primaryImage.image_url}
                    alt={product.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      padding: '10px'
                    }}
                  />
                ) : (
                  <span style={{
                    color: '#8E9E86',
                    fontSize: '13px'
                  }}>
                    No image available
                  </span>
                )}
              </div>

              <h3 style={{
                color: '#232F24',
                fontSize: '15px',
                fontWeight: 600,
                margin: '0 0 8px',
                lineHeight: 1.5
              }}>
                {product.name}
              </h3>

              <p style={{
                color: '#5F6B3A',
                fontSize: '17px',
                fontWeight: 700,
                margin: '0 0 16px'
              }}>
                ₹{Number(product.price).toFixed(2)}
              </p>

              <button
                type="button"
                onClick={() => handleRemove(item.product_id)}
                disabled={removingId === item.product_id}
                style={{
                  marginTop: 'auto',
                  width: '100%',
                  padding: '11px',
                  border: '1px solid #9E4E42',
                  backgroundColor: '#FFFFFF',
                  color: '#9E4E42',
                  fontSize: '11px',
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                  cursor: removingId === item.product_id
                    ? 'not-allowed'
                    : 'pointer',
                  opacity: removingId === item.product_id ? 0.6 : 1
                }}
              >
                {removingId === item.product_id
                  ? 'Removing...'
                  : 'Remove from Wishlist'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function DashboardLayout() {
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'wishlist' | 'notifications' | 'reviews' | 'support-form'>('overview');
  const [unreadCount, setUnreadCount] = useState<number>(1);
  const [reviewsVersion, setReviewsVersion] = useState<number>(0);
  const [customerName, setCustomerName] = useState<string>('Customer');
  const [customerInitial, setCustomerInitial] = useState<string>('C');

  useEffect(() => {
    // 1. Pehle localStorage se check karein agar auth user stored hai
    try {
      const storedUser = localStorage.getItem('user') || localStorage.getItem('currentUser') || localStorage.getItem('auth');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        const name = parsed.name || parsed.user?.name || parsed.full_name;
        if (name && name.trim()) {
          setCustomerName(name.trim());
          setCustomerInitial(name.trim().charAt(0).toUpperCase());
          return;
        }
      }
    } catch {
      // Ignore json parse error
    }

    // 2. Fallback: Backend /profile ya /dashboard endpoint se logged-in user details fetch karein
    const token = localStorage.getItem('token') || localStorage.getItem('access_token');
    fetch('http://localhost:8000/api/account/profile', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          const name = data.name || data.full_name || (data.email ? data.email.split('@')[0] : 'Customer');
          setCustomerName(name);
          setCustomerInitial(name.charAt(0).toUpperCase());
        }
      })
      .catch(() => {});
  }, []);

  const handleReviewSubmitted = () => {
    setReviewsVersion((prev) => prev + 1);
    setActiveTab('reviews');
  };

  const navItems = [
    { id: 'overview', label: 'Overview' },
    { id: 'orders', label: 'My Orders' },
    { id: 'wishlist', label: 'Wishlist' },
    { id: 'notifications', label: 'Notifications', count: unreadCount },
    { id: 'reviews', label: 'Product Reviews' },
    { id: 'support-form', label: 'Support Form' },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#FAF8F5',
      color: '#1A211B',
      fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif"
    }}>
      {/* Top Banner */}
      <div style={{
        backgroundColor: '#1B241C',
        color: '#C2CDC0',
        fontSize: '11px',
        letterSpacing: '2.5px',
        textTransform: 'uppercase',
        textAlign: 'center',
        padding: '9px 16px',
        fontWeight: 500,
        borderBottom: '1px solid rgba(255,255,255,0.08)'
      }}>
        Complimentary Express Shipping on Orders Above ₹5,000 | Member Privileges
      </div>

      {/* Signature Navbar */}
      <header style={{
        backgroundColor: '#232F24',
        borderBottom: '1px solid #1A241B',
        padding: '0 48px',
        height: '74px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <VioraBrandBag />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{
              fontFamily: "'Cinzel', 'Playfair Display', Georgia, serif",
              fontSize: '22px',
              letterSpacing: '5px',
              fontWeight: 700,
              color: '#FAF8F5',
              lineHeight: 1
            }}>
              VIORA
            </span>
            <span style={{
              fontSize: '9px',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              color: '#9EB09A',
              marginTop: '4px'
            }}>
              Everything You Need, All In One Place
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '22px' }}>
          <button
            onClick={() => setActiveTab('notifications')}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.25)',
              borderRadius: '20px',
              color: '#FAF8F5',
              fontSize: '11px',
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px'
            }}
          >
            <span>Alerts</span>
            {unreadCount > 0 && (
              <span style={{
                backgroundColor: '#9E4E42',
                color: '#FAF8F5',
                fontSize: '10px',
                fontWeight: 700,
                padding: '1px 6px',
                borderRadius: '10px'
              }}>
                {unreadCount}
              </span>
            )}
          </button>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            borderLeft: '1px solid rgba(255,255,255,0.18)',
            paddingLeft: '22px'
          }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: '#8FA89B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 600,
                fontSize: '13px',
                color: '#1A211B',
                letterSpacing: 0,
              }}
            >
              {customerInitial}
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#FAF8F5' }}>
                {customerName}
              </div>
              <div style={{ fontSize: '9px', letterSpacing: '1.2px', color: '#9EB09A', textTransform: 'uppercase' }}>
                Private Member
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main style={{
        maxWidth: '1360px',
        margin: '0 auto',
        padding: '44px 48px 80px',
        display: 'grid',
        gridTemplateColumns: '230px 1fr',
        gap: '48px'
      }}>
        <aside>
          <div style={{
            fontSize: '10px',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            color: '#768572',
            fontWeight: 700,
            marginBottom: '16px'
          }}>
            Navigation
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '12px 14px',
                    background: isActive ? '#232F24' : 'transparent',
                    color: isActive ? '#FAF8F5' : '#334032',
                    border: 'none',
                    borderRadius: '2px',
                    fontSize: '12px',
                    letterSpacing: '1.2px',
                    textTransform: 'uppercase',
                    fontWeight: isActive ? 600 : 500,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span>{item.label}</span>
                  {typeof item.count === 'number' && item.count > 0 && (
                    <span style={{
                      fontSize: '10px',
                      backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : '#232F24',
                      color: '#FAF8F5',
                      padding: '1px 6px',
                      borderRadius: '8px'
                    }}>
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        <section>
          {activeTab === 'overview' && (
            <div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                border: '1px solid #E5DFD5',
                backgroundColor: '#FFFFFF',
                marginBottom: '36px'
              }}>
                {[
                  { tag: 'Acquisitions', title: 'Orders Placed', value: '02', note: '1 in transit, 1 delivered' },
                  { tag: 'Activity', title: 'Unread Alerts', value: String(unreadCount).padStart(2, '0'), note: 'Order & payment alerts' },
                  { tag: 'Privilege', title: 'Viora Rewards', value: '₹450', note: 'Usable at checkout' },
                ].map((stat, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '26px 24px',
                      borderRight: i < 2 ? '1px solid #E5DFD5' : 'none'
                    }}
                  >
                    <div style={{ fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', color: '#768572', fontWeight: 600 }}>
                      {stat.tag}
                    </div>
                    <div style={{
                      fontFamily: "'Cinzel', Georgia, serif",
                      fontSize: '30px',
                      fontWeight: 700,
                      color: '#232F24',
                      margin: '10px 0 4px',
                      letterSpacing: '-0.5px'
                    }}>
                      {stat.value}
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#2B392C' }}>
                      {stat.title}
                    </div>
                    <div style={{ fontSize: '11px', color: '#768572', marginTop: '6px' }}>
                      {stat.note}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ border: '1px solid #E5DFD5', backgroundColor: '#FFFFFF', padding: '32px' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-end',
                  paddingBottom: '16px',
                  borderBottom: '1px solid #E5DFD5',
                  marginBottom: '20px'
                }}>
                  <div>
                    <div style={{ fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', color: '#768572', fontWeight: 600 }}>
                      Recent History
                    </div>
                    <h3 style={{
                      fontFamily: "'Cinzel', Georgia, serif",
                      fontSize: '20px',
                      fontWeight: 700,
                      color: '#232F24',
                      margin: '4px 0 0'
                    }}>
                      Fulfilled & Active Orders
                    </h3>
                  </div>
                  <button
                    onClick={() => setActiveTab('orders')}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '11px',
                      letterSpacing: '1.5px',
                      textTransform: 'uppercase',
                      color: '#232F24',
                      fontWeight: 600,
                      cursor: 'pointer',
                      borderBottom: '1px solid #232F24',
                      paddingBottom: '2px'
                    }}
                  >
                    View All
                  </button>
                </div>
                <OrdersListView onReviewSubmitted={handleReviewSubmitted} />
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div style={{ border: '1px solid #E5DFD5', backgroundColor: '#FFFFFF', padding: '36px' }}>
              <div style={{ paddingBottom: '18px', borderBottom: '1px solid #E5DFD5', marginBottom: '24px' }}>
                <div style={{ fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', color: '#768572', fontWeight: 600 }}>
                  Client Ledger
                </div>
                <h2 style={{
                  fontFamily: "'Cinzel', Georgia, serif",
                  fontSize: '24px',
                  fontWeight: 700,
                  color: '#232F24',
                  margin: '4px 0 0'
                }}>
                  Order History & Fulfillment
                </h2>
              </div>
              <OrdersListView onReviewSubmitted={handleReviewSubmitted} />
            </div>
          )}

          {activeTab === 'wishlist' && <WishlistContent />}

          {activeTab === 'notifications' && (
            <NotificationCenter onClearBadge={() => setUnreadCount(0)} />
          )}

          {activeTab === 'reviews' && (
            <div style={{ border: '1px solid #E5DFD5', backgroundColor: '#FFFFFF', padding: '36px' }}>
              <div style={{ paddingBottom: '18px', borderBottom: '1px solid #E5DFD5', marginBottom: '24px' }}>
                <div style={{ fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', color: '#768572', fontWeight: 600 }}>
                  Feedback
                </div>
                <h2 style={{
                  fontFamily: "'Cinzel', Georgia, serif",
                  fontSize: '24px',
                  fontWeight: 700,
                  color: '#232F24',
                  margin: '4px 0 0'
                }}>
                  Product Reviews & Ratings
                </h2>
              </div>
              <ReviewsList productId={1} key={reviewsVersion} />
            </div>
          )}

          {activeTab === 'support-form' && (
            <NewTicketPage onBackToHub={() => setActiveTab('overview')} />
          )}
        </section>
      </main>

      <SupportChatbot />
    </div>
  );
}
