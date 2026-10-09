import React, { useState } from 'react';
import OrdersListView from './OrdersListView';
import NotificationCenter from './NotificationCenter';
import ReviewsList from './ReviewsList';
import CartPage from '../pages/CartPage';

function VioraLogo() {
  return (
    <svg width="34" height="38" viewBox="0 0 24 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Bag Handle */}
      <path 
        d="M8 8V6C8 3.79086 9.79086 2 12 2C14.2091 2 16 3.79086 16 6V8" 
        stroke="#ffffff" 
        strokeWidth="2" 
        strokeLinecap="round" 
      />
      {/* Bag Body */}
      <path 
        d="M4.5 8H19.5L21.2 24C21.3 25.1 20.4 26 19.3 26H4.7C3.6 26 2.7 25.1 2.8 24L4.5 8Z" 
        stroke="#ffffff" 
        strokeWidth="2" 
        strokeLinejoin="round" 
      />
      {/* Leaf Inside Bag */}
      <path 
        d="M12 14C12 14 15 14.5 15.5 17.5C16 20.5 13.5 22 12 22C10.5 22 8 20.5 8.5 17.5C9 14.5 12 14 12 14Z" 
        fill="#a3b899" 
        stroke="#ffffff" 
        strokeWidth="1.2" 
      />
      <path 
        d="M12 16V22" 
        stroke="#2f3e30" 
        strokeWidth="1.2" 
        strokeLinecap="round" 
      />
    </svg>
  );
}

const dashboardCss = `
.viora-dash {
  box-sizing: border-box;
  width: 100%;
  min-height: 100vh;
  background-color: #f7f5f0;
  font-family: 'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif;
  color: #1e241e;
}

.viora-dash *,
.viora-dash *::before,
.viora-dash *::after {
  box-sizing: border-box;
}

.viora-dash-header {
  background-color: #2f3e30;
  color: #ffffff;
  padding: 12px 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.viora-dash-main {
  width: 100%;
  max-width: 1600px;
  margin: 28px auto;
  padding: 0 24px;
  display: grid;
  grid-template-columns: 250px minmax(0, 1fr);
  gap: 28px;
  align-items: start;
}

.viora-dash-sidebar {
  position: sticky;
  top: 20px;
  min-width: 0;
}

.viora-dash-content {
  min-width: 0;
  width: 100%;
}

.viora-dash-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
  margin-bottom: 28px;
}

/* Cart inside the dashboard: no page-in-page padding/background */
.viora-dash-content .viora-cart-page {
  min-height: auto;
  padding: 0 0 40px;
  background: transparent;
}

/* ---------- Tablet ---------- */
@media (max-width: 1000px) {
  .viora-dash-main {
    grid-template-columns: minmax(0, 1fr);
    gap: 20px;
    margin: 20px auto;
  }

  .viora-dash-sidebar {
    position: static;
  }

  .viora-dash-nav {
    flex-direction: row !important;
    flex-wrap: wrap;
  }

  .viora-dash-nav button {
    width: auto !important;
    flex: 1 1 auto;
  }

  .viora-dash-profile {
    display: none !important;
  }

  .viora-dash-nav-wrap {
    margin-top: 0 !important;
  }
}

/* ---------- Mobile ---------- */
@media (max-width: 720px) {
  .viora-dash-header {
    padding: 12px 16px;
  }

  .viora-dash-tagline,
  .viora-dash-user-text {
    display: none !important;
  }

  .viora-dash-main {
    padding: 0 14px;
  }

  .viora-dash-stats {
    grid-template-columns: minmax(0, 1fr);
  }
}
`;

export default function DashboardLayout() {
  const [activeTab, setActiveTab] = useState('overview');
  const [unreadCount, setUnreadCount] = useState(1);
  const [reviewsVersion, setReviewsVersion] = useState(0);

  const handleReviewSubmitted = () => {
    setReviewsVersion((prev) => prev + 1);
    setActiveTab('reviews');
  };

  return (
    <div className="viora-dash">
      <style>{dashboardCss}</style>

      {/* HEADER */}
      <header className="viora-dash-header">
        {/* VIORA BRAND */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            minWidth: 0,
          }}
        >
          <VioraLogo />

          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: '23px',
                fontWeight: '700',
                letterSpacing: '4px',
                fontFamily: "'Playfair Display', Georgia, serif",
                color: '#ffffff',
              }}
            >
              VIORA
            </div>

            <div
              className="viora-dash-tagline"
              style={{
                fontSize: '10px',
                color: '#c5d3c1',
                letterSpacing: '0.8px',
                textTransform: 'uppercase',
                marginTop: '2px',
              }}
            >
              Everything You Need, All in One Place
            </div>
          </div>
        </div>

        {/* HEADER RIGHT */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            flexShrink: 0,
          }}
        >
          {/* Notifications */}
          <button
            onClick={() => setActiveTab('notifications')}
            style={{
              position: 'relative',
              background: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.18)',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '16px',
            }}
          >
            🔔

            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-2px',
                  right: '-2px',
                  background: '#d9534f',
                  color: '#fff',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  borderRadius: '50%',
                  width: '18px',
                  height: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid #2f3e30',
                }}
              >
                {unreadCount}
              </span>
            )}
          </button>

          {/* USER */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: 'rgba(255,255,255,0.08)',
              padding: '6px 14px 6px 8px',
              borderRadius: '30px',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: '#a3b899',
                color: '#1e241e',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
              }}
            >
              A
            </div>

            <div className="viora-dash-user-text">
              <div
                style={{
                  fontSize: '13px',
                  fontWeight: '600',
                }}
              >
                Hi, Aliza
              </div>

              <div
                style={{
                  fontSize: '11px',
                  color: '#c5d3c1',
                }}
              >
                Member
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="viora-dash-main">
        {/* SIDEBAR */}
        <aside className="viora-dash-sidebar">
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '18px',
              padding: '24px 18px',
              border: '1px solid #e8e5de',
              boxShadow: '0 8px 30px rgba(0,0,0,0.03)',
            }}
          >
            {/* PROFILE */}
            <div
              className="viora-dash-profile"
              style={{
                textAlign: 'center',
                paddingBottom: '20px',
                borderBottom: '1px solid #f0ede6',
              }}
            >
              <div
                style={{
                  width: '70px',
                  height: '70px',
                  margin: '0 auto 12px',
                  borderRadius: '50%',
                  background:
                    'linear-gradient(135deg, #3b4d3c 0%, #526b54 100%)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '28px',
                }}
              >
                👤
              </div>

              <h3
                style={{
                  margin: '0 0 4px',
                  fontSize: '16px',
                  fontWeight: '700',
                }}
              >
                Aliza Fayyaz Khan
              </h3>

              <p
                style={{
                  margin: 0,
                  fontSize: '12px',
                  color: '#6e776e',
                  overflowWrap: 'anywhere',
                }}
              >
                aliza@example.com
              </p>
            </div>
\
            <nav style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { id: 'overview', label: 'Dashboard Overview', icon: '📊' },
                { id: 'orders', label: 'My Orders', icon: '📦' },
                { id: 'notifications', label: 'Notifications', icon: '🔔', badge: unreadCount },
                { id: 'reviews', label: 'Product Reviews', icon: '⭐' },
              ].map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: 'none',
                      backgroundColor: isActive ? '#3b4d3c' : 'transparent',
                      color: isActive ? '#ffffff' : '#455045',
                      fontWeight: isActive ? '600' : '500',
                      fontSize: '14px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: isActive ? '0 4px 12px rgba(59,77,60,0.2)' : 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '16px' }}>{tab.icon}</span>
                      {tab.label}
                    </div>
                    {tab.badge > 0 && (
                      <span style={{
                        backgroundColor: isActive ? '#ffffff' : '#d4a373',
                        color: isActive ? '#3b4d3c' : '#ffffff',
                        fontSize: '11px',
                        fontWeight: '700',
                        padding: '2px 8px',
                        borderRadius: '20px'
                      }}>
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* NAVIGATION */}
            <div
              className="viora-dash-nav-wrap"
              style={{ marginTop: '20px' }}
            >
              <nav
                className="viora-dash-nav"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                {[
                  {
                    id: 'overview',
                    label: 'Dashboard Overview',
                    icon: '📊',
                  },
                  {
                    id: 'orders',
                    label: 'My Orders',
                    icon: '📦',
                  },
                  {
                    id: 'cart',
                    label: 'Shopping Cart',
                    icon: '🛒',
                  },
                  {
                    id: 'notifications',
                    label: 'Notifications',
                    icon: '🔔',
                    badge: unreadCount,
                  },
                ].map((tab) => {
                  const isActive = activeTab === tab.id;

                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
  if (tab.id === 'cart') {
    window.location.href = '/cart';
  } else {
    setActiveTab(tab.id);
  }
}}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '8px',
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: '12px',
                        border: 'none',
                        backgroundColor: isActive
                          ? '#3b4d3c'
                          : 'transparent',
                        color: isActive ? '#ffffff' : '#455045',
                        fontWeight: isActive ? '600' : '500',
                        fontSize: '14px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        textAlign: 'left',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                        }}
                      >
                        <span>{tab.icon}</span>
                        {tab.label}
                      </div>

                      {tab.badge > 0 && (
                        <span
                          style={{
                            backgroundColor: isActive
                              ? '#ffffff'
                              : '#d4a373',
                            color: isActive ? '#3b4d3c' : '#ffffff',
                            fontSize: '11px',
                            fontWeight: '700',
                            padding: '2px 8px',
                            borderRadius: '20px',
                          }}
                        >
                          {tab.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

          </div>
        </aside>

        {/* CONTENT */}
        <section className="viora-dash-content">
          {/* DASHBOARD */}
          {activeTab === 'overview' && (
            <div>
              <div className="viora-dash-stats">
                {[
                  {
                    label: 'Total Orders Placed',
                    val: '2',
                    sub: '1 in transit, 1 delivered',
                    icon: '🛍️',
                  },
                  {
                    label: 'Unread Alerts',
                    val: unreadCount,
                    sub: 'Updates regarding orders',
                    icon: '🔔',
                  },
                  {
                    label: 'VIORA Rewards',
                    val: '₹450',
                    sub: 'Usable at checkout',
                    icon: '✨',
                  },
                ].map((stat, idx) => (
                  <div
                    key={idx}
                    style={{
                      backgroundColor: '#ffffff',
                      padding: '22px',
                      borderRadius: '18px',
                      border: '1px solid #e8e5de',
                      boxShadow: '0 6px 20px rgba(0,0,0,0.02)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      minWidth: 0,
                    }}
                  >
                    <div
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '14px',
                        backgroundColor: '#f2eee6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '22px',
                        flexShrink: 0,
                      }}
                    >
                      {stat.icon}
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: '12px',
                          color: '#6e776e',
                          fontWeight: '600',
                          textTransform: 'uppercase',
                        }}
                      >
                        {stat.label}
                      </div>

                      <div
                        style={{
                          fontSize: '24px',
                          fontWeight: '800',
                          color: '#2f3e30',
                          margin: '4px 0 2px',
                        }}
                      >
                        {stat.val}
                      </div>

                      <div
                        style={{
                          fontSize: '11px',
                          color: '#8a948a',
                        }}
                      >
                        {stat.sub}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Recent Orders Preview */}
              <OrdersListView onReviewSubmitted={handleReviewSubmitted} />
            </div>
          )}

          {activeTab === 'orders' && <OrdersListView onReviewSubmitted={handleReviewSubmitted} />}

          {/* NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <NotificationCenter
              onClearBadge={() => setUnreadCount(0)}
            />
          )}

          {activeTab === 'reviews' && (
            <div style={{ backgroundColor: '#ffffff', borderRadius: '18px', padding: '24px', border: '1px solid #e8e5de' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px', color: '#1e241e' }}>
                Product Reviews & Ratings
              </h2>
              <p style={{ fontSize: '13px', color: '#6e776e', marginBottom: '20px' }}>
                Real-time customer feedback fetched from the backend API.
              </p>
              <ReviewsList productId={1} refreshTrigger={reviewsVersion} />
            </div>
          )}
        </section>
      </main>
    </div>
  );
}