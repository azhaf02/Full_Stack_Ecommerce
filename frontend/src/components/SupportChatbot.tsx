import React, { useState } from 'react';

interface ChatMessage {
  id: number;
  sender: 'VIORA' | 'USER'; // 🎯 Strictly locked to VIORA brand naming context
  text: string;
}

export const SupportChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 1, sender: 'VIORA', text: "WELCOME TO VIORA OPERATIONS PLATFORM HELPDESK. ASK ME ANYTHING ABOUT ACCOUNT SETTINGS, ORDERS, INVOICES, OR RETURN TRANSITS." }
  ]);
  const [inputValue, setInputValue] = useState<string>('');

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMsg: ChatMessage = { id: Date.now(), sender: 'USER', text: inputValue };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');

    // --- 🤖 DYNAMIC BRAND OPERATIONS PARSING KNOWLEDGE DICTIONARY 🤖 ---
    setTimeout(() => {
      const prompt = userMsg.text.toLowerCase(); // Context scan trace
      let responseText = "I HAVE RECEIVED YOUR INQUIRY METRICS LOGS. IF YOU ARE FACING CRITICAL SYSTEM FAULTS, PLEASE FILL OUT THE FORMAL INTAKE TICKETS VIA THE PORTAL CHANNELS GRIDS.";

      if (prompt.includes('which support form') || prompt.includes('find the form') || prompt.includes('check support form') || prompt.includes('where')) {
        responseText = "YOU CAN ACCESS THE CUSTOMER INQUIRY FORM DIRECTLY FROM THE LEFT SIDEBAR MENU OPTION ROW LABELED 'SUPPORT FORM'. CLICK IT TO SPECIFY INVOICE DETAILS AND YOUR MULTI-PRODUCT SPECIFIC PRODUCT ID TARGETS SECURELY.";
      } 
      else if (prompt.includes('any refunds') || prompt.includes('refund status') || prompt.includes('cash back') || prompt.includes('refund')) {
        responseText = "REFUNDS ARE SYSTEMATICALLY DISPATCHED DIRECTLY BACK INTO YOUR ORIGINAL ACCOUNT INGESTION BALANCES MATRIX WITHIN 48 PROCESSING HOURS ONCE WAREHOUSE SCANNERS VALIDATE THE UNBROKEN ITEM LABELS.";
      }
      else if (prompt.includes('exchange')) {
        responseText = "EXCHANGES ARE HIGHLY ELIGIBLE FOR PRODUCTS WITHIN THE BASELINE GRACE TIMELINE WINDOW. SPECIFY THE NEW REPLACEMENT SIZE ATTRIBUTES DIRECTLY IN THE SUBMISSION PAYLOAD ROWS FORM FIELDS.";
      }
      else if (prompt.includes('return') || prompt.includes('issue')) {
        responseText = "IN LINE WITH THE ORDER MANAGEMENT INTERFACE LAYER, RETURNS MUST BE COMPLETED WITHIN 14 CALENDAR DAYS POST-DELIVERY. PLEASE FILL IN THE SUPPORT FORM WITH YOUR ACCURATE ORDER REFEFENCE ID METADATA.";
      } 
      else if (prompt.includes('order') || prompt.includes('track') || prompt.includes('shipment')) {
        responseText = "TO TRACK AN ACTIVE TRANSIT PARCEL IN REAL-TIME PIPELINES, NAVIGATE TO THE 'MY ORDERS' GRID VIA THE SIDEBAR OPTION LEDGER CAPSULE.";
      } 
      else if (prompt.includes('quality') || prompt.includes('fabric') || prompt.includes('material') || prompt.includes('qaulity')) {
        responseText = "ALL VIORA PRODUCTS ARE CRAFTED FROM PREMIUM, HIGH-DENSITY HEAVYWEIGHT COTTON TO ENSURE MAXIMUM DURABILITY AND COMFORT. IF YOU RECEIVE A FAULTY ITEM, REGISTER IT ON THE SUPPORT FORM IMMEDIATELY!";
      }
      else if (prompt.includes('hello') || prompt.includes('hi') || prompt.includes('hey')) {
        responseText = "HELLO! CHATBOT PARSING CHECKS ARE FULLY STABLE AND OPERATIONAL. HOW CAN I AID YOUR DIGITAL SHOPPING SPRINT JOURNEY TODAY?";
      }

      setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'VIORA', text: responseText }]);
    }, 600);
  };

  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 99999, fontFamily: 'monospace' }}>
      
      {/* 💬 Premium Monochrome Floating Chat Message Icon Trigger Bubble 💬 */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="btn btn-dark shadow-lg d-flex align-items-center justify-content-center"
          style={{ 
            width: '54px', 
            height: '54px', 
            borderRadius: '50%', 
            backgroundColor: '#2f3e30', 
            border: '1px solid rgba(255,255,255,0.2)',
            transition: 'transform 0.2s ease',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
        >
          {/* Error-Free Vector SVG Chat Icon */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://w3.org">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10z" fill="#FFFFFF" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}

      {/* Premium Integrated Interactive Chat Panel Enclosure Shell */}
      {isOpen && (
        <div className="card shadow-lg bg-white" style={{ width: '330px', height: '410px', borderRadius: '16px', borderColor: '#e8e5de', display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid #e8e5de' }}>
          
          {/* Header Component Title Block Bar */}
          <div className="text-white p-3 d-flex justify-content-between align-items-center" style={{ backgroundColor: '#2f3e30' }}>
            <div className="d-flex align-items-center gap-2">
              <span className="fw-bold text-uppercase" style={{ fontSize: '11px', letterSpacing: '1px' }}>VIORA CHATBOT</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="btn btn-sm text-white p-0 border-0" style={{ fontSize: '12px', cursor: 'pointer' }}>✕</button>
          </div>

          {/* Chronological Chat Message Scroller Stream View Layout */}
          <div className="p-3 flex-grow-1 overflow-auto bg-light d-flex flex-column gap-2" style={{ height: '280px', backgroundColor: '#fbfbfa' }}>
            {messages.map(m => (
              <div key={m.id} className={`d-flex flex-column ${m.sender === 'VIORA' ? 'align-items-start' : 'align-items-end'}`}>
                <span className="text-muted text-uppercase font-monospace mb-1 px-1" style={{ fontSize: '8px', letterSpacing: '0.5px' }}>
                  {m.sender}
                </span>
                <div 
                  className="p-3 border" 
                  style={{ 
                    backgroundColor: m.sender === 'VIORA' ? '#FFFFFF' : '#3b4d3c', 
                    color: m.sender === 'VIORA' ? '#1e241e' : '#FFFFFF', 
                    fontSize: '11px', 
                    maxWidth: '85%',
                    borderRadius: m.sender === 'VIORA' ? '0px 12px 12px 12px' : '12px 0px 12px 12px',
                    borderColor: m.sender === 'VIORA' ? '#e8e5de' : '#3b4d3c',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                    lineHeight: '1.4'
                  }}
                >
                  {m.text}
                </div>
              </div>
            ))}
          </div>

          {/* User Message Input Form Submit Area Panel Controls */}
          <form onSubmit={handleSendMessage} className="p-2 bg-white d-flex border-top" style={{ borderColor: '#f0ede6' }}>
            <input 
              type="text" 
              className="form-control form-control-sm px-3" 
              placeholder="ASK AN INTENT QUESTION DATA..." 
              style={{ borderRadius: '20px', borderColor: '#e8e5de', fontSize: '11px' }} 
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
            />
            <button type="submit" className="btn btn-sm btn-dark text-white fw-bold ms-1" style={{ borderRadius: '20px', backgroundColor: '#3b4d3c', border: 'none', fontSize: '11px', paddingLeft: '15px', paddingRight: '15px', cursor: 'pointer' }}>SEND</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default SupportChatbot;
