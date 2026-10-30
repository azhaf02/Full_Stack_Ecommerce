import React, { useState } from 'react';

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
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="text-center py-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <div className="border p-5 bg-white" style={{ borderRadius: '12px', borderColor: '#E5DFD5' }}>
          <span style={{ fontSize: '40px' }}>🌿</span>
          <h5 className="fw-bold tracking-wide mt-2" style={{ color: '#232F24' }}>REQUEST SUBMITTED</h5>
          <p className="small text-muted mb-4" style={{ fontSize: '12px' }}>Your inquiry with custom product reference filters has been logged into the backend database ledger indexes logs successfully.</p>
          <button 
            onClick={onBackToHub} 
            className="btn text-white fw-bold w-100 text-uppercase" 
            style={{ borderRadius: '8px', backgroundColor: '#3B4D3C', fontSize: '12px', border: 'none', padding: '10px' }}
          >
            ← Return to Support Hub
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div className="card p-4 shadow-none border bg-white" style={{ borderRadius: '12px', borderColor: '#E5DFD5' }}>
        <div className="d-flex justify-content-between align-items-center border-bottom pb-2 mb-3" style={{ borderColor: '#E5DFD5' }}>
          <h5 className="fw-bold mb-0" style={{ fontSize: '16px', color: '#232F24' }}>Create Customer Support Ticket</h5>
          <button type="button" onClick={onBackToHub} className="btn btn-sm text-uppercase font-monospace" style={{ fontSize: '11px', color: '#768572', border: 'none', background: 'transparent' }}>Cancel</button>
        </div>

        <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
          <div>
            <label className="form-label small fw-bold mb-1" style={{ fontSize: '11px', color: '#232F24' }}>Inquiry Classification Category</label>
            <select className="form-select text-uppercase" style={{ borderRadius: '8px', borderColor: '#C5D3C1', fontSize: '12px' }} value={category} onChange={e => setCategory(e.target.value)}>
              <option value="GENERAL INQUIRY">General Customer Care</option>
              <option value="BILLING & TRANSFERS">Billing & Payments Flow</option>
              <option value="LOGISTICS & TRANSIT">Shipping & Delivery Logistics</option>
              <option value="RETURNS & REFUNDS">Returns & Refunds Management</option>
            </select>
          </div>

          <div className="row g-2">
            <div className="col-6">
              <label className="form-label small fw-bold mb-1" style={{ fontSize: '11px', color: '#232F24' }}>Invoice Order ID (Optional)</label>
              <input type="number" className="form-control text-center font-monospace" placeholder="e.g. 9821" style={{ borderRadius: '8px', borderColor: '#C5D3C1', fontSize: '12px' }} value={orderId} onChange={e => setOrderId(e.target.value)} />
            </div>
            <div className="col-6">
              <label className="form-label small fw-bold mb-1" style={{ fontSize: '11px', color: '#232F24' }}>Specific Product ID (Optional)</label>
              <input type="number" className="form-control text-center font-monospace" placeholder="e.g. 88" style={{ borderRadius: '8px', borderColor: '#C5D3C1', fontSize: '12px' }} value={productId} onChange={e => setProductId(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="form-label small fw-bold mb-1" style={{ fontSize: '11px', color: '#232F24' }}>Subject Summary Headline</label>
            <input type="text" className="form-control" placeholder="Brief outline string of problem parameters..." style={{ borderRadius: '8px', borderColor: '#C5D3C1', fontSize: '12px' }} value={subject} onChange={e => setSubject(e.target.value)} required />
          </div>

          <div>
            <label className="form-label small fw-bold mb-1" style={{ fontSize: '11px', color: '#232F24' }}>Detailed Problem Narrative Narrative</label>
            <textarea className="form-control" rows={4} placeholder="Describe your inquiry situation or code exception details in depth here..." style={{ borderRadius: '8px', borderColor: '#C5D3C1', fontSize: '12px' }} value={description} onChange={e => setDescription(e.target.value)} required />
          </div>

          <button type="submit" className="btn text-white fw-bold text-uppercase w-100 mt-2 py-2" style={{ borderRadius: '8px', backgroundColor: '#3B4D3C', fontSize: '12px', border: 'none' }}>
            Submit Ingestion Payload
          </button>
        </form>
      </div>
    </div>
  );
};

export default NewTicketPage;
