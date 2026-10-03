import React, { useState, useEffect } from 'react';

interface ReturnContext {
  has_active_return: boolean;
  return_id: number | null;
  return_status: string | null;
  order_id: number | null;
}

interface Message {
  id: number;
  sender_type: 'Customer' | 'Admin';
  message: string;
  timestamp: string;
}

interface Ticket {
  id: number;
  customer_id: number;
  category: string;
  subject: string;
  description: string;
  status: string;
  created_at: string;
}

const TicketDetailPage: React.FC<{ ticketId: number }> = ({ ticketId }) => {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [returnContext, setReturnContext] = useState<ReturnContext | null>(null);

  useEffect(() => {
    setTicket({ id: ticketId, customer_id: 425, category: 'Refund Inquiries', subject: 'Inquiry regarding Refund processing delay', description: 'My order reference points to an active return but my money has not settled in the database layer.', status: 'In-Progress', created_at: '2026-10-03 14:02:00' });
    setMessages([{ id: 1, sender_type: 'Customer', message: 'Please fast track my approval pipeline status loops.', timestamp: '2026-10-03 14:05:00' }]);
    setReturnContext({ has_active_return: true, return_id: 45, return_status: 'Pending Approval', order_id: 9821 });
  }, [ticketId]);

  return (
    <div className="card p-4 shadow-sm bg-white border" style={{ borderRadius: '8px', borderColor: '#E5E2D8' }}>
      {ticket && (
        <div>
          <div className="d-flex justify-content-between align-items-start border-bottom pb-3 mb-3">
            <div>
              <span className="badge bg-secondary mb-2">Ticket ID: #{ticket.id}</span>
              <h4 className="fw-bold text-dark mb-1">{ticket.subject}</h4>
              <p className="text-muted small mb-0">Category: <strong>{ticket.category}</strong> | Customer Profile ID: #{ticket.customer_id}</p>
            </div>
            <span className="badge px-3 py-2 fw-bold text-white" style={{ backgroundColor: '#5F6B3A' }}>{ticket.status}</span>
          </div>

          {returnContext && returnContext.has_active_return && (
            <div className="alert border-warning mb-4 shadow-sm d-flex justify-content-between align-items-center" 
                 style={{ backgroundColor: '#FFF9E6', borderColor: '#FFC107', color: '#664d03', borderRadius: '6px' }}>
              <div>
                <h6 className="fw-bold mb-1"><i className="bi bi-arrow-counterclockwise me-2 text-warning"></i>Linked Return Request Flagged (ORD-07 Context)</h6>
                <p className="small mb-0">
                  Target Order Reference: <strong>#ORD-{returnContext.order_id}</strong> | Dynamic Return Status: <span className="badge bg-warning text-dark font-monospace">{returnContext.return_status}</span>
                </p>
              </div>
              <button 
                type="button"
                onClick={() => window.location.href = `/admin/returns/review/${returnContext.return_id}`}
                className="btn btn-sm btn-dark text-white fw-bold px-3 shadow-sm"
                style={{ fontSize: '11px', borderRadius: '4px' }}
              >
                <i className="bi bi-box-arrow-up-right me-1"></i> Jump to Return Review
              </button>
            </div>
          )}

          <div className="p-3 bg-light border rounded small mb-4 text-secondary fw-medium">{ticket.description}</div>

          <div className="border rounded p-3 mb-4 bg-white overflow-auto" style={{ maxHeight: '250px', minHeight: '150px' }}>
            <h6 className="fw-bold text-muted border-bottom pb-2 mb-3"><i className="bi bi-chat-left-text me-2"></i>Thread History Timeline</h6>
            <div className="d-flex flex-column gap-3">
              {messages.map((m, index) => (
                <div key={index} className="d-flex flex-column align-items-start">
                  <div className="p-2 rounded text-white small shadow-sm" style={{ backgroundColor: '#6C757D', maxWidth: '80%' }}>
                    <span className="d-block fw-bold border-bottom pb-1 mb-1" style={{ fontSize: '9px', opacity: 0.8 }}>{m.sender_type}</span>
                    <p className="mb-0 small fw-medium">{m.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketDetailPage;
