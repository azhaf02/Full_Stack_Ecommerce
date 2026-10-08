import React, { useState } from 'react';
import OrdersListView from './OrdersListView';
import NotificationCenter from './NotificationCenter';
import ReviewsList from './ReviewsList';
import NewTicketPage from '../pages/support/NewTicketPage'; // 💡 Imports your olive green support form path
import { SupportChatbot } from './SupportChatbot'; // 💡 Imports your brand-compliant VIORA chatbot widget

function VioraBrandBag() {
  return (
    <svg width="26" height="30" viewBox="0 0 24 28" fill="none" xmlns="http://w3.org">
      <path d="M8 7V5C8 2.79 9.79 1 12 1C14.21 1 16 2.79 16 5V7" stroke="#FAF8F5" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M4 7H20L21.4 25C21.45 25.8 20.8 26.5 20 26.5H4C3.2 26.5 2.55 25.8 2.6 25L4 7Z" stroke="#FAF8F5" strokeWidth="1.8" strokeLinejoin="round" />
      <circle cx="12" cy="17" r="3" stroke="#FAF8F5" strokeWidth="1.4" />
      <path d="M12 14.8V17" stroke="#FAF8F5" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export default function DashboardLayout() {
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'wishlist' | 'notifications' | 'reviews' | 'support-form'>('overview');
  const [unreadCount, setUnreadCount] = useState<number>(1);
  const [reviewsVersion, setReviewsVersion] = useState<number>(0);

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
    { id: 'support-form', label: 'Support Form' }, // 🎯 WIRED YOUR TAB EXPLICITLY INTO SIDEBAR LOOP ARRAY
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
        Complimentary Express Shipping on Orders Above ₹5,000   Member Privileges
      </div>

      {/* Signature Olive Green Navbar with Bag Logo */}
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
        {/* Brand Lockup */}
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

        {/* Member Area */}
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
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: '#8E9E86',
              color: '#1B241C',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '13px'
            }}>
              A
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#FAF8F5' }}>Aliza Fayyaz Khan</div>
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
        {/* Navigation Sidebar */}
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
        {/* Content Section Panels Content Blocks Area */}
        <section>
          {activeTab === 'overview' && (
            <div>
              {/* Stat Counters */}
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

              {/* Recent Orders Card */}
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

          {activeTab === 'wishlist' && <div style={{ padding: '20px', color: '#6e776e' }}>Wishlist Content Coming Soon.</div>}

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
              <ReviewsList productId={1} refreshTrigger={reviewsVersion} />
            </div>
          )}

          {/* 🎯 RENDERS YOUR PRODUCT-ID VALIDATED OLIVE SUPPORT FORM INLINE WHEN SELECTED 🎯 */}
          {activeTab === 'support-form' && (
            <NewTicketPage onBackToHub={() => setActiveTab('overview')} />
          )}
        </section>
      </main>

      {/* 🤖 GLOBAL CONVERSATIONAL SMART AI CHATBOT WITH MESSAGE ICON FLOATS 🤖 */}
      <SupportChatbot />
    </div>
  );
}
