import React, { useState } from 'react';
import NewTicketPage from './NewTicketPage';
import SupportChatbot from '../../components/SupportChatbot';

interface FAQItem {
  id: number;
  question: string;
  answer: string;
}

interface CategoryMetaData {
  id: string;
  label: string;
  icon: string;
  bgColor: string;
  borderColor: string;
  tagline: string;
  faqs: FAQItem[];
}

const FaqPage: React.FC = () => {
  const [activeView, setActiveView] = useState<'hub' | 'category' | 'form'>('hub');
  const [currentCategory, setCurrentCategory] = useState<CategoryMetaData | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // 🎨 Explicit 6 Card Categories Configured with Beautiful Pastel Colors
  const categoryRegistry: CategoryMetaData[] = [
    {
      id: 'account',
      label: 'ACCOUNT MANAGEMENT',
      icon: '👤',
      bgColor: '#E8F0FE', // Pastel Slate Blue
      borderColor: '#B4CDFB',
      tagline: 'Manage profile records, passwords, security tokens, and account access bounds.',
      faqs: [
        { id: 101, question: 'HOW DO I RESET MY SECURE PROFILE PASSWORD?', answer: 'Navigate straight to your profile configuration matrix inside your dashboard account settings block.' },
        { id: 102, question: 'CAN I MIGRATE IDENTITY RECOVERY METADATA RECORDS?', answer: 'Yes, update your active multi-tenant registration entries directly within the credentials manager loop.' }
      ]
    },
    {
      id: 'orders',
      label: 'ORDERS LEDGER',
      icon: '📦',
      bgColor: '#E6F4EA', // Pastel Mint Green
      borderColor: '#A8DAB5',
      tagline: 'Track active shipments invoices, check purchase history logs, or amend routing values.',
      faqs: [
        { id: 201, question: 'HOW DO I SECURELY TRACK MY COMPLETED PARCEL SHIPMENT?', answer: 'Your automated dashboard order history displays live location tracking indexes parameters seamlessly.' },
        { id: 202, question: 'CAN I ALTER THE SYSTEM DELIVERY TARGET ADRESS AFTER CHECKOUT?', answer: 'Modifications are allowed within 60 runtime minutes post-checkout before shipment pipelines lock active.' }
      ]
    },
    {
      id: 'payments',
      label: 'CHECKOUT & PAYMENTS',
      icon: '💳',
      bgColor: '#FEF7E0', // Pastel Warm Honey
      borderColor: '#FAD896',
      tagline: 'Verify invoice settlements, check payment method filters, or download receipts.',
      faqs: [
        { id: 301, question: 'WHICH SECURE SETTLEMENT INGESTION CHANNELS ARE ACCEPTED?', answer: 'WE SECURELY INTEGRATE STANDARD CREDIT/DEBIT CARDS, WALLET INGESTION LAYERS, AND ONLINE NET BANKING TRANSFERS AT CHECKOUT.' },
        { id: 302, question: 'MY BALANCE WAS DEBITED BUT TRANSACTION FAILED TO COMPLETED?', answer: 'Automated reverse transaction scripts will credit missing balances back into your account registry within 3-5 days.' }
      ]
    },
    {
      id: 'delivery',
      label: 'LOGISTICS & DELIVERY',
      icon: '🚚',
      bgColor: '#FCE8E6', // Pastel Coral Rose
      borderColor: '#F7B4AE',
      tagline: 'Review courier network schedules, customs validation alerts, or delayed drop flags.',
      faqs: [
        { id: 401, question: 'WHAT HAPPENS IF A DELIVERY SPRINT ENCOUNTERS CRITICAL REJECTS?', answer: 'Our logistics carrier networks engine will systematically trigger up to three package drop retries automatically.' },
        { id: 402, question: 'ARE OVERSIZED DROP SHIPMENTS DEPLOYED GLOBALLY WITHIN CONSTRAINTS?', answer: 'Yes, transit timelines scale dynamically based on regional territory coordinates nodes.' }
      ]
    },
    {
      id: 'returns',
      label: 'RETURNS & REFUNDS',
      icon: '🔄',
      bgColor: '#F3E8FD', // Pastel Lilac Lavender
      borderColor: '#D7B7F9',
      tagline: 'Initiate exchange workflows or track pending return status arrays under ORDER frameworks.',
      faqs: [
        { id: 501, question: 'WHAT IS THE BASELINE RETURN GRACE DURATION?', answer: 'Return ingestion actions must be registered over our platform panel within 14 calendar days post-parcel arrival.' },
        { id: 502, question: 'WHEN WILL PENDING CASH REFUNDS REFLECT IN MY BALANCES?', answer: 'Once warehouse scanners cross-verify the items condition, balances process via billing engines within 48 hours.' }
      ]
    },
    {
      id: 'stock',
      label: 'PRODUCT & STOCK',
      icon: '✨',
      bgColor: '#EAF6F6', // Pastel Teal Aqua
      borderColor: '#AEDCDC',
      tagline: 'Check product sizing charts, limited drop schedules, or inventory restock metrics.',
      faqs: [
        { id: 601, question: 'HOW OFTEN DO STOCK QUANTITY MATRIX COUNTERS REFRESH?', answer: 'Inventory indices synchronize live in step with actual transaction completion metrics across the checkout nodes.' },
        { id: 602, question: 'CAN I PRE-ORDER OUT-OF-STOCK PREMIUM CLOTHING CAPSULES?', answer: 'Yes, activate the notify alert toggle button to auto-reserve items allocations dynamically.' }
      ]
    }
  ];

  const handleCategoryClick = (cat: CategoryMetaData) => {
    setCurrentCategory(cat);
    setActiveView('category');
  };

  const globalFilteredFaqs = () => {
    if (!searchQuery.trim()) return [];
    let collector: { catLabel: string; q: string; a: string; id: number }[] = [];
    categoryRegistry.forEach(c => {
      c.faqs.forEach(f => {
        if (f.question.toLowerCase().includes(searchQuery.toLowerCase()) || c.label.toLowerCase().includes(searchQuery.toLowerCase())) {
          collector.push({ catLabel: c.label, q: f.question, a: f.answer, id: f.id });
        }
      });
    });
    return collector;
  };
    return (
    <div className="container-fluid min-vh-100 py-5" style={{ backgroundColor: '#FAF8F5', color: '#1B241C', fontFamily: 'monospace' }}>
      <div className="container shadow-sm bg-white p-4 p-md-5 border" style={{ maxWidth: '850px', borderRadius: '12px', borderColor: '#E5DFD5' }}>
        
        {/* Dynamic Header Ribbon - Premium Olive Green Controlled */}
        <div className="d-flex justify-content-between align-items-center border-bottom pb-3 mb-4" style={{ borderColor: '#E5DFD5', borderBottomWidth: '1px' }}>
          <span className="fw-bold tracking-widest text-uppercase" style={{ fontSize: '12px', color: '#232F24' }}>
            VIORA'S HELP CENTER // {activeView === 'hub' ? 'HOW CAN WE HELP?' : currentCategory?.id.toUpperCase() || 'SUPPORT'}
          </span>
          {activeView !== 'hub' && (
            <button 
              onClick={() => { setActiveView('hub'); setCurrentCategory(null); }} 
              className="btn btn-sm text-white px-3 py-1 text-uppercase" 
              style={{ borderRadius: '8px', fontSize: '10px', backgroundColor: '#3B4D3C', border: 'none', cursor: 'pointer' }}
            >
              ← BACK TO HELP HUB
            </button>
          )}
        </div>

        {/* -------------------- VIEW 1: MAIN HUB VIEW (WITH CARDS GRID) -------------------- */}
        {activeView === 'hub' && (
          <div>
            {/* Search Input Box Area (Olive Green Aesthetic Header) */}
            <div className="text-center py-4 mb-4 border text-white" style={{ backgroundColor: '#232F24', borderColor: '#1A241B', borderRadius: '12px' }}>
              <h4 className="fw-bold text-uppercase tracking-widest mb-1" style={{ fontSize: '18px', color: '#FAF8F5' }}>HELP CENTER</h4>
              <p className="small text-uppercase tracking-wider mb-3" style={{ fontSize: '9px', color: '#C2CDC0' }}>Search active troubleshooting manuals or catalog indexes before filing formal tickets.</p>
              <div className="px-4 mx-auto" style={{ maxWidth: '450px' }}>
                <input 
                  type="text" 
                  className="form-control text-center text-uppercase" 
                  placeholder="TYPE KEYWORDS TO SEARCH FAQ MANUALS..." 
                  style={{ borderRadius: '20px', borderColor: '#E5DFD5', padding: '10px', fontSize: '12px', backgroundColor: '#FAF8F5', color: '#1B241C' }}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Global Search Results Layer */}
            {searchQuery.trim() !== '' && (
              <div className="mb-4 border p-3 bg-white" style={{ borderRadius: '12px', borderColor: '#C5D3C1' }}>
                <span className="badge text-white text-uppercase font-monospace mb-3" style={{ borderRadius: '0px', backgroundColor: '#3B4D3C' }}>SEARCH HITS MATRIX</span>
                {globalFilteredFaqs().length > 0 ? (
                  globalFilteredFaqs().map(f => (
                    <div key={f.id} className="pb-3 mb-3 border-bottom" style={{ borderColor: '#F0EDE6' }}>
                      <span className="d-block small text-muted font-monospace fw-bold mb-1">[{f.catLabel}]</span>
                      <h6 className="fw-bold text-dark text-uppercase small mb-1">Q: {f.q}</h6>
                      <p className="text-secondary small mb-0">{f.a}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-2 text-muted small text-uppercase">No explicit match results found across active catalogs registers.</div>
                )}
              </div>
            )}

            {/* 📦 Savana-Style Dynamic 6 Pastel Categories Grid Enclosure 📦 */}
            <div className="row g-3 mb-5">
              {categoryRegistry.map((cat) => (
                <div key={cat.id} className="col-12 col-sm-6">
                  <div 
                    onClick={() => handleCategoryClick(cat)}
                    className="card h-100 p-4"
                    style={{ 
                      borderRadius: '12px', 
                      borderColor: cat.borderColor,
                      borderWidth: '1px',
                      cursor: 'pointer',
                      backgroundColor: '#FFFFFF',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.01)'
                    }}
                  >
                    <div className="d-flex align-items-center gap-3 mb-2">
                      {/* Pastel Color Container Box For Custom Icon */}
                      <div 
                        className="d-flex align-items-center justify-content-center"
                        style={{ 
                          width: '44px', 
                          height: '44px', 
                          backgroundColor: cat.bgColor, 
                          border: `1px solid ${cat.borderColor}`,
                          borderRadius: '8px',
                          fontSize: '20px'
                        }}
                      >
                        {cat.icon}
                      </div>
                      <h6 className="fw-bold tracking-wider text-uppercase mb-0" style={{ fontSize: '12px', color: '#232F24' }}>{cat.label}</h6>
                    </div>
                    <p className="text-muted mb-0 lh-sm" style={{ fontSize: '11px' }}>{cat.tagline}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Ingestion CTA Directive (Sir's Catch Specs Locked) */}
            <div className="p-4 border bg-white mt-5" style={{ borderRadius: '14px', borderColor: '#E5DFD5', borderWidth: '1px' }}>
              <div className="border-bottom pb-2 mb-3" style={{ borderColor: '#E5DFD5' }}>
                <h6 className="fw-bold text-uppercase tracking-wider mb-1" style={{ fontSize: '13px', color: '#232F24' }}>OFFICIAL INCIDENT RESOLUTION TERMINAL</h6>
                <p className="text-muted small text-uppercase mb-0" style={{ fontSize: '9px' }}>The reporting mechanism securely captures Category, Order ID, and Product IDs parameters.</p>
              </div>
              <button 
                onClick={() => setActiveView('form')} 
                className="btn text-white fw-bold text-uppercase w-100 py-3 tracking-widest text-center"
                style={{ borderRadius: '10px', backgroundColor: '#3B4D3C', fontSize: '12px', border: 'none', cursor: 'pointer' }}
              >
                OPEN OFFICIAL SUPPORT FORM
              </button>
            </div>
          </div>
        )}

        {/* -------------------- VIEW 2: DYNAMIC SPECIFIC CATEGORY DEDICATED PAGE -------------------- */}
        {activeView === 'category' && currentCategory && (
          <div className="py-2">
            {/* Category Header Profile Card Layout */}
            <div className="d-flex align-items-center gap-3 p-4 mb-4 border" style={{ backgroundColor: currentCategory.bgColor, borderColor: currentCategory.borderColor, borderRadius: '12px' }}>
              <div style={{ fontSize: '32px' }}>{currentCategory.icon}</div>
              <div>
                <h5 className="fw-bold text-uppercase tracking-wider mb-1" style={{ fontSize: '14px', color: '#232F24' }}>{currentCategory.label} ARCHIVE</h5>
                <p className="text-secondary small mb-0 lh-sm" style={{ fontSize: '11px' }}>{currentCategory.tagline}</p>
              </div>
            </div>

            {/* Rendered Questions Stream */}
            <div className="d-flex flex-column gap-3 mb-5">
              {currentCategory.faqs.map(f => (
                <div key={f.id} className="p-4 bg-white border" style={{ borderColor: '#E5DFD5', borderRadius: '10px' }}>
                  <h6 className="fw-bold text-uppercase mb-2" style={{ fontSize: '12px', color: '#232F24' }}>Q: {f.question}</h6>
                  <p className="text-muted small mb-0 lh-base" style={{ fontSize: '12px' }}>{f.answer}</p>
                </div>
              ))}
            </div>

            {/* Inner Redirection Callout Button */}
            <div className="text-center py-4 border bg-light" style={{ borderRadius: '10px' }}>
              <p className="small text-muted text-uppercase tracking-wider mb-3" style={{ fontSize: '10px' }}>Could not locate structural answers under this category?</p>
              <button 
                onClick={() => setActiveView('form')} 
                className="btn btn-sm text-white fw-bold px-4"
                style={{ borderRadius: '8px', backgroundColor: '#3B4D3C', fontSize: '11px', border: 'none', cursor: 'pointer' }}
              >
                OPEN OFFICIAL SUPPORT FORM
              </button>
            </div>
          </div>
        )}

        {/* -------------------- VIEW 3: INTAKE SUPPORT TICKETS CREATION FORM VIEW -------------------- */}
        {activeView === 'form' && (
          <NewTicketPage onBackToHub={() => { setActiveView('hub'); setCurrentCategory(null); }} />
        )}

      </div>

      {/* 🤖 GLOBAL CONVERSATIONAL CHAT ICON ASSISTANT FLOATS SECURELY IN THE BACKGROUND 🤖 */}
      <SupportChatbot />
    </div>
  );
};

export default FaqPage;

