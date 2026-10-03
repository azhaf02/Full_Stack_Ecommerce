import React, { useState, useEffect } from 'react';

interface FAQItem {
  id: number;
  question: string;
  answer: string;
  sort_order: number;
}

const FaqPage: React.FC = () => {
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [search, setSearch] = useState<string>('');

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        const res = await fetch('/api/support/faq');
        const data = await res.json();
        setFaqs(data);
      } catch {
        setFaqs([
          { id: 1, question: "How do I track my active order status tracking updates?", answer: "Go directly to your customer dashboard workspace panel and hit the Orders listing tab layout widget.", sort_order: 1 },
          { id: 2, question: "What are the rules regarding returns and refunds?", answer: "In alignment with Rukhsar's ORD-07 modules parameters entries, return queries must be raised within 14 transaction days timeline grids.", sort_order: 2 },
          { id: 3, question: "Which payment options are accepted across standard checkouts?", answer: "We securely integrate credit/debit card transfers, online banking channels, and wallet nodes via Aliza's billing loops.", sort_order: 3 }
        ]);
      }
    };
    fetchFaqs();
  }, []);

  const filteredFaqs = faqs.filter(f => 
    f.question.toLowerCase().includes(search.toLowerCase()) || 
    f.answer.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8F7F2' }} className="py-5">
      <div className="container" style={{ maxWidth: '800px' }}>
        
        <div className="text-center mb-5">
          <h2 className="fw-bold" style={{ color: '#252A20' }}>How can we help you today?</h2>
          <p className="text-muted small">Search common frequently asked questions across shipping, orders, payments, and returns.</p>
          
          <div className="input-group mt-4 mx-auto shadow-sm" style={{ maxWidth: '500px' }}>
            <span className="input-group-text bg-white border-end-0 text-muted"><i className="bi bi-search"></i></span>
            <input type="text" className="form-control border-start-0 ps-1" placeholder="Type keywords to filter questions upfront..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        <div className="d-flex flex-column gap-3 mb-5">
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((f) => (
              <div key={f.id} className="card p-4 border-0 shadow-sm" style={{ backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E5E2D8' }}>
                <h5 className="fw-bold mb-2" style={{ color: '#343A20', fontSize: '16px' }}><i className="bi bi-question-circle-fill me-2 text-secondary"></i>{f.question}</h5>
                <p className="text-secondary small mb-0 lh-base fw-medium" style={{ opacity: 0.9 }}>{f.answer}</p>
              </div>
            ))
          ) : (
            <div className="text-center p-4 text-muted border border-dashed bg-white rounded">No matching FAQ categories or questions mapped in the active indices.</div>
          )}
        </div>

        {/* Link to Contact Support if questions are unresolved */}
        <div className="card p-4 text-center border-0 shadow-sm text-white" style={{ backgroundColor: '#343A20', borderRadius: '8px' }}>
          <h6 className="fw-bold mb-2">Still can't find structural answers to your questions?</h6>
          <p className="small mb-3 text-white-50">Our dedicated customer happiness agent helpdesk team is online 24/7 to resolve operations logs barriers.</p>
          <button onClick={() => window.location.href = '/support/ticket/new'} className="btn btn-sm btn-light fw-bold px-4 rounded text-dark shadow-sm" style={{ backgroundColor: '#E8EAD9', borderColor: '#E8EAD9' }}>
            <i className="bi bi-envelope-fill me-2"></i> Contact Customer Support
          </button>
        </div>

      </div>
    </div>
  );
};

export default FaqPage;
