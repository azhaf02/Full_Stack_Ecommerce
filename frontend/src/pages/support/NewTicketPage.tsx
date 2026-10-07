import React, { useState } from 'react';

// 🔒 Add explicit prop tracking loop to let this page pass back navigation commands cleanly
interface NewTicketPageProps {
  onBackToHub?: () => void;
}

const NewTicketPage: React.FC<NewTicketPageProps> = ({ onBackToHub }) => {
  const [category, setCategory] = useState<string>('GENERAL INQUIRY');
  const [orderId, setOrderId] = useState<string>('');
  const [productId, setProductId] = useState<string>(''); 
  const [subject, setSubject] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [submitted, setSubmitted] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      category,
      order_id: orderId ? parseInt(orderId) : null,
      product_id: productId ? parseInt(productId) : null, 
      subject,
      description
    };

    // Simulated 100% instant submission resolution handler
    setSubmitted(true);
  };

  // 🎯 DYNAMIC VIEW ON SUCCESSFUL TICKET INGESTION SUBMISSION 🎯
  if (submitted) {
    return (
      <div className="text-center py-5 font-monospace" style={{ color: '#000000' }}>
        <div className="border p-5 bg-white" style={{ borderRadius: '0px', borderColor: '#000000', borderWidth: '2px' }}>
          <i className="bi bi-check-square-fill text-dark mb-3" style={{ fontSize: '44px' }}></i>
          <h5 className="fw-bold text-uppercase tracking-wider">REQUEST SUBMITTED SUCCESSFULLY</h5>
          <p className="small text-muted mb-4 lh-base" style={{ fontSize: '11px' }}>Your customer incident query has been safely committed into our support ledger tracking registry index.</p>
          
          {/* Bulletproof back execution logic trigger */}
          <button 
            onClick={onBackToHub} 
            className="btn btn-dark w-100 text-uppercase fw-bold rounded-0" 
            style={{ borderRadius: '0px', backgroundColor: '#000000', fontSize: '12px', letterSpacing: '1px' }}
          >
            ← RETURN TO HELP PORTAL HUB
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ color: '#000000', backgroundColor: '#FFFFFF', fontFamily: 'monospace' }}>
      <div className="card p-4 shadow-none border bg-white" style={{ borderRadius: '0px', borderColor: '#000000', borderWidth: '1px' }}>
        <div className="d-flex justify-content-between align-items-center border-bottom pb-2 mb-3" style={{ borderColor: '#000000' }}>
          <h5 className="fw-bold text-uppercase tracking-wider mb-0" style={{ fontSize: '15px' }}>Create Support Incident Report</h5>
          <button type="button" onClick={onBackToHub} className="btn btn-sm btn-outline-dark text-uppercase font-monospace rounded-0" style={{ fontSize: '10px' }}>Cancel</button>
        </div>

        <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
          <div>
            <label className="form-label small text-uppercase fw-bold mb-1" style={{ fontSize: '10px' }}>Category</label>
            <select className="form-select text-uppercase" style={{ borderRadius: '0px', borderColor: '#000000', fontSize: '12px' }} value={category} onChange={e => setCategory(e.target.value)}>
              <option value="GENERAL INQUIRY">General Customer Care</option>
              <option value="BILLING & TRANSFERS">Billing, Card & Payments Flow</option>
              <option value="LOGISTICS & TRANSIT">Shipping, Warehousing & Delivery</option>
              <option value="RETURNS & REFUNDS">Returns & Refunds Management</option>
            </select>
          </div>

          <div className="row g-2">
            <div className="col-6">
              <label className="form-label small text-uppercase fw-bold mb-1" style={{ fontSize: '10px' }}>Order ID (Optional)</label>
              <input type="number" className="form-control text-center font-monospace" placeholder="e.g. 9821" style={{ borderRadius: '0px', borderColor: '#000000', fontSize: '12px' }} value={orderId} onChange={e => setOrderId(e.target.value)} />
            </div>
            <div className="col-6">
              <label className="form-label small text-uppercase fw-bold mb-1" style={{ fontSize: '10px' }}>Product ID (Optional)</label>
              <input type="number" className="form-control text-center font-monospace" placeholder="e.g. 88" style={{ borderRadius: '0px', borderColor: '#000000', fontSize: '12px' }} value={productId} onChange={e => setProductId(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="form-label small text-uppercase fw-bold mb-1" style={{ fontSize: '10px' }}>Subject Headline</label>
            <input type="text" className="form-control" placeholder="Brief outline string of problem parameters..." style={{ borderRadius: '0px', borderColor: '#000000', fontSize: '12px' }} value={subject} onChange={e => setSubject(e.target.value)} required />
          </div>

          <div>
            <label className="form-label small text-uppercase fw-bold mb-1" style={{ fontSize: '10px' }}>Problem Narrative Text</label>
            <textarea className="form-control" rows={4} placeholder="Describe your inquiry situation in depth here..." style={{ borderRadius: '0px', borderColor: '#000000', fontSize: '12px' }} value={description} onChange={e => setDescription(e.target.value)} required />
          </div>

          <button type="submit" className="btn btn-dark text-white fw-bold text-uppercase w-100 mt-2 py-2 rounded-0" style={{ backgroundColor: '#000000', fontSize: '12px' }}>
            Submit Ingestion Payload
          </button>
        </form>
      </div>
    </div>
  );
};

export default NewTicketPage;
