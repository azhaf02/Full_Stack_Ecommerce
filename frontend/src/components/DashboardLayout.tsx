import React, { useState } from 'react';
import OrdersListView from './OrdersListView';
import NotificationCenter from './NotificationCenter';
import ReviewsList from './ReviewsList';
import WishlistListView from './WishlistListView';

// SVG matching the circled VIORA icon (Shopping Bag with Leaf)
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

export default function DashboardLayout() {
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'wishlist' | 'notifications' | 'reviews'>('overview');
  const [unreadCount, setUnreadCount] = useState<number>(1);
  const [reviewsVersion, setReviewsVersion] = useState<number>(0);

  const handleReviewSubmitted = () => {
    setReviewsVersion((prev) => prev + 1);
    setActiveTab('reviews');
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f7f5f0', fontFamily: "'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif", color: '#1e241e' }}>
      {/* Top VIORA Branded Header */}
      <header style={{
        backgroundColor: '#2f3e30',
        color: '#ffffff',
        padding: '12px 40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
      }}>
        {/* Brand Logo & Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <VioraLogo />
          </div>
          <div>
            <div style={{
              margin: 0,
              fontSize: '22px',
              fontWeight: '800',
              letterSpacing: '2.5px',
              fontFamily: "'Cinzel', 'Playfair Display', serif, sans-serif",
              color: '#ffffff'
            }}>
              VIORA
            </div>
            <div style={{ fontSize: '10px', color: '#c5d3c1', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
              Everything You Need, All in One Place
            </div>
          </div>
        </div>

        {/* Right Section: Alerts + User Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
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
              transition: 'all 0.2s ease'
            }}
          >
            🔔
            {unreadCount > 0 && (
              <span style={{
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
                border: '2px solid #2f3e30'
              }}>
                {unreadCount}
              </span>
            )}
          </button>

          {/* User Profile Capsule */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'rgba(255,255,255,0.08)',
            padding: '6px 14px 6px 8px',
            borderRadius: '30px',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: '#a3b899',
              color: '#1e241e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: '14px'
            }}>
              A
            </div>
            <div style={{ textAlign: 'left', lineHeight: '1.2' }}>
              <div style={{ fontSize: '13px', fontWeight: '600' }}>Hi, Aliza</div>
              <div style={{ fontSize: '11px', color: '#c5d3c1' }}>Member</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Portal Container */}
      <main style={{ maxWidth: '1280px', margin: '32px auto', padding: '0 24px', display: 'grid', gridTemplateColumns: '260px 1fr', gap: '28px' }}>
        {/* Navigation Sidebar */}
        <aside>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '18px',
            padding: '24px 18px',
            border: '1px solid #e8e5de',
            boxShadow: '0 8px 30px rgba(0,0,0,0.03)'
          }}>
            <div style={{ textAlign: 'center', paddingBottom: '20px', borderBottom: '1px solid #f0ede6' }}>
              <div style={{
                width: '70px',
                height: '70px',
                margin: '0 auto 12px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #3b4d3c 0%, #526b54 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px',
                boxShadow: '0 6px 16px rgba(59,77,60,0.25)'
              }}>
                👤
              </div>
              <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: '700' }}>Aliza Fayyaz Khan</h3>
              <p style={{ margin: 0, fontSize: '12px', color: '#6e776e' }}>aliza@example.com</p>
            </div>

            <nav style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { id: 'overview', label: 'Dashboard Overview', icon: '📊' },
                { id: 'orders', label: 'My Orders', icon: '📦' },
                { id: 'wishlist', label: 'My Wishlist', icon: '🤍' },      
                { id: 'notifications', label: 'Notifications', icon: '🔔', badge: unreadCount },
                { id: 'reviews', label: 'Product Reviews', icon: '⭐' },
              ].map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
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
                    {typeof tab.badge === 'number' && tab.badge > 0 && (
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
          </div>
        </aside>

        {/* Content View Area */}
        <section>
          {activeTab === 'overview' && (
            <div>
              {/* Quick Stat Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '28px' }}>
                {[
                  { label: 'Total Orders Placed', val: '2', sub: '1 in transit, 1 delivered', icon: '🛍️' },
                  { label: 'Unread Alerts', val: unreadCount, sub: 'Updates regarding orders', icon: '🔔' },
                  { label: 'VIORA Rewards', val: '₹450', sub: 'Usable at checkout', icon: '✨' },
                ].map((stat, idx) => (
                  <div key={idx} style={{
                    backgroundColor: '#ffffff',
                    padding: '22px',
                    borderRadius: '18px',
                    border: '1px solid #e8e5de',
                    boxShadow: '0 6px 20px rgba(0,0,0,0.02)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px'
                  }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '14px',
                      backgroundColor: '#f2eee6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '22px'
                    }}>
                      {stat.icon}
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#6e776e', fontWeight: '600', textTransform: 'uppercase' }}>{stat.label}</div>
                      <div style={{ fontSize: '24px', fontWeight: '800', color: '#2f3e30', margin: '4px 0 2px' }}>{stat.val}</div>
                      <div style={{ fontSize: '11px', color: '#8a948a' }}>{stat.sub}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Recent Orders Preview */}
              <OrdersListView onReviewSubmitted={handleReviewSubmitted} />
            </div>
          )}

          {activeTab === 'orders' && <OrdersListView onReviewSubmitted={handleReviewSubmitted} />}

          {/* DASH-04: Wishlist Integration */}
          {activeTab === 'wishlist' && <WishlistListView />}

          {activeTab === 'notifications' && (
            <NotificationCenter onClearBadge={() => setUnreadCount(0)} />
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