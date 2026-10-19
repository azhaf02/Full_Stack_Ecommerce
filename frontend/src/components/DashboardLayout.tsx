import { useState, useEffect, useRef } from 'react';
import OrdersListView from './OrdersListView';
import NotificationCenter from './NotificationCenter';
import { ReviewsList } from './ReviewsList';

const WishlistListView = () => (
  <div style={{
    border: '1px solid rgba(255, 255, 255, 0.7)',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(16px)',
    padding: '36px',
    borderRadius: '16px',
    boxShadow: '0 12px 30px rgba(35, 47, 36, 0.05)'
  }}>
    <div style={{ paddingBottom: '18px', borderBottom: '1px solid #E5DFD5', marginBottom: '24px' }}>
      <div style={{ fontSize: '10px', letterSpacing: '2.5px', textTransform: 'uppercase', color: '#768572', fontWeight: 600 }}>
        Curated Selection
      </div>
      <h2 style={{ fontFamily: "'Cinzel', Georgia, serif", fontSize: '24px', fontWeight: 700, color: '#232F24', margin: '4px 0 0' }}>
        Saved Items & Wishlist
      </h2>
    </div>
    <p style={{ fontSize: '13px', color: '#768572' }}>Your saved pieces will appear here.</p>
  </div>
);

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

// Couture Clothing & Silk Wave Interactive Canvas
function CoutureClothingCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    let mouseX = width / 2;
    let mouseY = height / 2;
    let targetX = mouseX;
    let targetY = mouseY;

    const handleMouseMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Floating Couture Fashion Emblems & Silhouettes
    const fashionSymbols = ['✦', '🪡', '✂', '🏷', '✧', '◈', '𓊔'];
    const fashionElements = Array.from({ length: 22 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      symbol: fashionSymbols[Math.floor(Math.random() * fashionSymbols.length)],
      size: Math.random() * 14 + 14,
      rotation: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 0.015,
      alpha: Math.random() * 0.22 + 0.08
    }));

    let waveTime = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      waveTime += 0.015;

      // Smooth cursor follow interpolation
      mouseX += (targetX - mouseX) * 0.04;
      mouseY += (targetY - mouseY) * 0.04;

      // 1. Mouse Spotlight Beam (Bulmaca Style Ambient Glow)
      const spotlight = ctx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, 440);
      spotlight.addColorStop(0, 'rgba(125, 148, 118, 0.22)');
      spotlight.addColorStop(0.5, 'rgba(195, 185, 168, 0.08)');
      spotlight.addColorStop(1, 'rgba(250, 248, 245, 0)');
      ctx.fillStyle = spotlight;
      ctx.fillRect(0, 0, width, height);

      // 2. Silk Fabric Ribbon Waves (Couture draping motion)
      ctx.save();
      for (let w = 0; w < 3; w++) {
        ctx.beginPath();
        const baseOffset = ((w + 0.6) * height) / 3.2;
        ctx.moveTo(0, baseOffset);

        for (let x = 0; x <= width; x += 30) {
          const distToMouse = Math.abs(x - mouseX);
          const mouseFactor = Math.max(0, 1 - distToMouse / 350) * 35;
          const y = baseOffset + Math.sin(x * 0.003 + waveTime + w) * 28 + Math.cos(waveTime * 0.8 + x * 0.002) * 18 - mouseFactor;
          ctx.lineTo(x, y);
        }

        ctx.strokeStyle = `rgba(59, 77, 60, ${0.06 + w * 0.02})`;
        ctx.lineWidth = 1.4;
        ctx.stroke();
      }
      ctx.restore();

      // 3. Floating Couture Silhouettes & Tailoring Symbols
      fashionElements.forEach((item) => {
        item.x += item.vx;
        item.y += item.vy;
        item.rotation += item.vRot;

        if (item.x < -30) item.x = width + 30;
        if (item.x > width + 30) item.x = -30;
        if (item.y < -30) item.y = height + 30;
        if (item.y > height + 30) item.y = -30;

        // Interactive mouse repelling
        const dx = item.x - mouseX;
        const dy = item.y - mouseY;
        const dist = Math.hypot(dx, dy);
        if (dist < 150) {
          item.x += (dx / dist) * 2.5;
          item.y += (dy / dist) * 2.5;
        }

        ctx.save();
        ctx.translate(item.x, item.y);
        ctx.rotate(item.rotation);
        ctx.font = `${item.size}px 'Playfair Display', Georgia, serif`;
        ctx.fillStyle = `rgba(35, 47, 36, ${item.alpha})`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(item.symbol, 0, 0);
        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        mixBlendMode: 'multiply'
      }}
    />
  );
}

interface UserProfile {
  name?: string;
  full_name?: string;
  email?: string;
  role?: string;
}

export default function DashboardLayout() {
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'wishlist' | 'notifications' | 'reviews'>('overview');
  const [unreadCount, setUnreadCount] = useState<number>(1);
  const [reviewsVersion, setReviewsVersion] = useState<number>(0);
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user') || localStorage.getItem('customer');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.warn('Unable to parse stored user profile', e);
    }
  }, []);

  const displayName = user?.full_name || user?.name || user?.email?.split('@')[0] || 'Valued Member';
  const displayRole = user?.role ? `${user.role.toUpperCase()} MEMBER` : 'Private Member';
  const initialLetter = displayName.charAt(0).toUpperCase();

  const handleReviewSubmitted = () => {
    setReviewsVersion((prev) => prev + 1);
  };

  const navItems = [
    { id: 'overview', label: 'Overview' },
    { id: 'orders', label: 'My Orders' },
    { id: 'wishlist', label: 'Wishlist' },
    { id: 'notifications', label: 'Notifications', count: unreadCount },
    { id: 'reviews', label: 'Product Reviews' },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#FAF8F5',
      color: '#1A211B',
      fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
      position: 'relative',
      overflowX: 'hidden'
    }}>
      {/* Editorial Running Marquee & Card Reveal Keyframes */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        @keyframes panelEntrance {
          from { opacity: 0; transform: translateY(12px) scale(0.99); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .bulmaca-marquee-track {
          display: flex;
          width: 200%;
          animation: marquee 22s linear infinite;
        }
        .bulmaca-marquee-track:hover {
          animation-play-state: paused;
        }
        .bulmaca-card {
          transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.28s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.28s ease;
        }
        .bulmaca-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 36px rgba(35, 47, 36, 0.08);
          border-color: rgba(95, 117, 92, 0.45) !important;
        }
        .bulmaca-tab-panel {
          animation: panelEntrance 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      {/* Interactive Silk Wave & Tailoring Canvas */}
      <CoutureClothingCanvas />

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
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        position: 'relative',
        zIndex: 50
      }}>
        Complimentary Express Shipping on Orders Above ₹5,000 • Member Privileges
      </div>

      {/* Signature Navbar */}
      <header style={{
        backgroundColor: 'rgba(35, 47, 36, 0.95)',
        backdropFilter: 'blur(14px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '0 48px',
        height: '74px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
      }}>
        <div 
          style={{ display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer' }} 
          onClick={() => setActiveTab('overview')}
        >
          <div style={{ transition: 'transform 0.3s ease' }}>
            <VioraBrandBag />
          </div>
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
              padding: '6px 14px',
              transition: 'all 0.25s ease'
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
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: '#8E9E86',
              color: '#1B241C',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '13px'
            }}>
              {initialLetter}
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#FAF8F5' }}>
                {displayName}
              </div>
              <div style={{ fontSize: '9px', letterSpacing: '1.2px', color: '#9EB09A', textTransform: 'uppercase' }}>
                {displayRole}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Bulmaca-Style Bespoke Clothing Ticker Tape */}
      <div style={{
        backgroundColor: '#ECE7DD',
        borderBottom: '1px solid rgba(35, 47, 36, 0.08)',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        position: 'relative',
        zIndex: 20,
        padding: '7px 0'
      }}>
        <div className="bulmaca-marquee-track">
          {[1, 2].map((k) => (
            <div key={k} style={{ display: 'inline-flex', width: '50%', justifyContent: 'space-around', fontSize: '11px', letterSpacing: '2.5px', textTransform: 'uppercase', color: '#566653', fontWeight: 600 }}>
              <span>✦ HANDCRAFTED BESPOKE APPAREL</span>
              <span>✦ LUXURY SILK & CASHMERE WEAVES</span>
              <span>✦ LIMITED ATELIER EDITION 2026</span>
              <span>✦ SUSTAINABLE TAILORING PRIVILEGE</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Container */}
      <main style={{
        maxWidth: '1360px',
        margin: '0 auto',
        padding: '44px 48px 80px',
        display: 'grid',
        gridTemplateColumns: '230px 1fr',
        gap: '48px',
        alignItems: 'start',
        position: 'relative',
        zIndex: 10
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

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
                    padding: '13px 16px',
                    background: isActive ? '#232F24' : 'rgba(255, 255, 255, 0.65)',
                    backdropFilter: 'blur(10px)',
                    color: isActive ? '#FAF8F5' : '#334032',
                    border: '1px solid',
                    borderColor: isActive ? '#232F24' : 'rgba(229, 223, 213, 0.8)',
                    borderRadius: '8px',
                    fontSize: '12px',
                    letterSpacing: '1.2px',
                    textTransform: 'uppercase',
                    fontWeight: isActive ? 600 : 500,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.22s ease',
                    boxShadow: isActive ? '0 6px 18px rgba(35,47,36,0.18)' : '0 2px 6px rgba(0,0,0,0.02)'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = '#FFFFFF';
                      e.currentTarget.style.transform = 'translateX(4px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.65)';
                      e.currentTarget.style.transform = 'none';
                    }
                  }}
                >
                  <span>{item.label}</span>
                  {typeof item.count === 'number' && item.count > 0 && (
                    <span style={{
                      fontSize: '10px',
                      backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : '#232F24',
                      color: '#FAF8F5',
                      padding: '2px 7px',
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

        {/* Content Section */}
        <section key={activeTab} className="bulmaca-tab-panel">
          {activeTab === 'overview' && (
            <div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                border: '1px solid rgba(255, 255, 255, 0.8)',
                backgroundColor: 'rgba(255, 255, 255, 0.78)',
                backdropFilter: 'blur(16px)',
                borderRadius: '16px',
                overflow: 'hidden',
                marginBottom: '36px',
                boxShadow: '0 8px 30px rgba(35, 47, 36, 0.04)'
              }}>
                {[
                  { tag: 'Acquisitions', title: 'Orders Placed', value: '02', note: '1 in transit, 1 delivered', action: () => setActiveTab('orders') },
                  { tag: 'Activity', title: 'Unread Alerts', value: String(unreadCount).padStart(2, '0'), note: 'Order & payment alerts', action: () => setActiveTab('notifications') },
                  { tag: 'Privilege', title: 'Viora Rewards', value: '₹450', note: 'Usable at checkout', action: undefined },
                ].map((stat, i) => (
                  <div
                    key={i}
                    onClick={stat.action}
                    className={stat.action ? "bulmaca-card" : ""}
                    style={{
                      padding: '28px 26px',
                      borderRight: i < 2 ? '1px solid rgba(229, 223, 213, 0.7)' : 'none',
                      cursor: stat.action ? 'pointer' : 'default',
                      backgroundColor: 'transparent'
                    }}
                  >
                    <div style={{ fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', color: '#768572', fontWeight: 600 }}>
                      {stat.tag}
                    </div>
                    <div style={{
                      fontFamily: "'Cinzel', Georgia, serif",
                      fontSize: '32px',
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

              <div className="bulmaca-card" style={{
                border: '1px solid rgba(255, 255, 255, 0.8)',
                backgroundColor: 'rgba(255, 255, 255, 0.84)',
                backdropFilter: 'blur(16px)',
                padding: '36px',
                borderRadius: '16px',
                boxShadow: '0 10px 30px rgba(35, 47, 36, 0.04)'
              }}>
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
                </div>
                <OrdersListView onReviewSubmitted={handleReviewSubmitted} />
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="bulmaca-card" style={{
              border: '1px solid rgba(255, 255, 255, 0.8)',
              backgroundColor: 'rgba(255, 255, 255, 0.84)',
              backdropFilter: 'blur(16px)',
              padding: '36px',
              borderRadius: '16px',
              boxShadow: '0 10px 30px rgba(35, 47, 36, 0.04)'
            }}>
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
                  My Orders & Fulfillment
                </h2>
              </div>
              <OrdersListView onReviewSubmitted={handleReviewSubmitted} />
            </div>
          )}

          {activeTab === 'wishlist' && <WishlistListView />}

          {activeTab === 'notifications' && (
            <div className="bulmaca-card" style={{
              border: '1px solid rgba(255, 255, 255, 0.8)',
              backgroundColor: 'rgba(255, 255, 255, 0.84)',
              backdropFilter: 'blur(16px)',
              padding: '32px',
              borderRadius: '16px',
              boxShadow: '0 10px 30px rgba(35, 47, 36, 0.04)'
            }}>
              <NotificationCenter onClearBadge={() => setUnreadCount(0)} />
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="bulmaca-card" style={{
              border: '1px solid rgba(255, 255, 255, 0.8)',
              backgroundColor: 'rgba(255, 255, 255, 0.84)',
              backdropFilter: 'blur(16px)',
              padding: '36px',
              borderRadius: '16px',
              boxShadow: '0 10px 30px rgba(35, 47, 36, 0.04)'
            }}>
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
        </section>
      </main>
    </div>
  );
}