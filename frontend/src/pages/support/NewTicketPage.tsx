import React, { useState } from 'react';

export default function NewTicketPage() {
  const [category, setCategory] = useState('Order');
  const [orderId, setOrderId] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('');

  const handleTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('Success! Your inquiry has been registered cleanly onto the server.');
    setSubject('');
    setDescription('');
    setOrderId('');
  };

  return (
    <div className="min-h-screen font-sans selection:bg-[#E8EAD9]" style={{ backgroundColor: '#F8F7F2', color: '#252A20' }}>
      
      {/* Main VIORA Header Navigation Bar */}
      <div className="px-6 py-4 flex justify-between items-center text-white shadow-sm" style={{ backgroundColor: '#343A20' }}>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold tracking-widest uppercase">VIORA</span>
          <span className="text-[10px] tracking-wider text-[#7A8450] uppercase">| Support Portal</span>
        </div>
        <div className="flex gap-6 text-xs uppercase tracking-widest font-medium text-[#E8EAD9]">
          <span>Catalog</span>
          <span>Collections</span>
          <span>Assistance</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="text-center mb-12 space-y-2">
          <h1 className="text-3xl font-light tracking-wide uppercase" style={{ color: '#252A20' }}>Create Direct Inquiry</h1>
          <p className="text-xs uppercase tracking-widest max-w-md mx-auto leading-relaxed" style={{ color: '#6C7065' }}>
            Submit details regarding your operational platform problem statement
          </p>
        </div>

        <div className="rounded-sm p-8 border shadow-sm" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E2D8' }}>
          
          {status && (
            <div className="mb-6 p-3 text-xs tracking-wider uppercase text-center rounded-sm font-semibold" style={{ backgroundColor: '#D1E7DD', color: '#198754' }}>
              {status}
            </div>
          )}

          <form onSubmit={handleTicketSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#6C7065' }}>Classification Topic</label>
                <select 
                  value={category} 
                  onChange={(e) => setCategory(e.target.value)} 
                  className="w-full px-3 py-2.5 border rounded-sm text-xs bg-white focus:outline-none"
                  style={{ borderColor: '#E5E2D8', color: '#252A20' }}
                >
                  <option value="Order">Order Issues</option>
                  <option value="Delivery">Logistics & Shipping</option>
                  <option value="Payment">Payment Processing</option>
                  <option value="Return">Returns & Refunds Management</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#6C7065' }}>Order Tracking Code (Optional)</label>
                <input 
                  type="text" 
                  placeholder="e.g., 2056" 
                  value={orderId} 
                  onChange={(e) => setOrderId(e.target.value)} 
                  className="w-full px-3 py-2.5 border rounded-sm text-xs bg-white focus:outline-none"
                  style={{ borderColor: '#E5E2D8', color: '#252A20' }} 
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#6C7065' }}>Issue Subject Heading</label>
              <input 
                type="text" 
                required 
                placeholder="Brief summary header" 
                value={subject} 
                onChange={(e) => setSubject(e.target.value)} 
                className="w-full px-3 py-2.5 border rounded-sm text-xs bg-white focus:outline-none"
                style={{ borderColor: '#E5E2D8', color: '#252A20' }} 
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#6C7065' }}>Detailed Statement Narrative</label>
              <textarea 
                rows={4} 
                required 
                placeholder="State your problem case details transparently..." 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                className="w-full px-3 py-2.5 border rounded-sm text-xs bg-white focus:outline-none resize-none"
                style={{ borderColor: '#E5E2D8', color: '#252A20' }} 
              />
            </div>

            <button 
              type="submit" 
              className="w-full text-white font-bold text-xs uppercase tracking-widest py-3 transition-colors rounded-sm cursor-pointer"
              style={{ backgroundColor: '#5F6B3A' }}
            >
              Transmit Ticket Data
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
