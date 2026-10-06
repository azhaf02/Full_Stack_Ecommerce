import React, { useState, useEffect } from 'react';

interface Ticket {
  id: number;
  category: string;
  subject: string;
  description: string;
  status: string;
  created_at: string;
}

interface Message {
  id: number;
  sender_type: 'Customer' | 'Admin';
  message: string;
  timestamp: string;
}

const TicketsPage: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [replyText, setReplyText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    setTickets([
      { id: 104, category: 'Refunds', subject: 'Wallet failure on Order #ORD-9821', description: 'Finalized return accepted but cash balances missing. [System Product Context Note: Linked to Item ID #88]', status: 'Open', created_at: '2026-10-06' }
    ]);
  }, []);

  const handleSelectTicket = async (t: Ticket) => {
    setSelectedTicket(t);
    setLoading(true);
    try {
      setMessages([
        { id: 1, sender_type: 'Customer', message: t.description, timestamp: '10 mins ago' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicket) return;

    const newMsg: Message = { id: Date.now(), sender_type: 'Customer', message: replyText, timestamp: 'Just Now' };
    setMessages([...messages, newMsg]);
    setReplyText('');
  };

  return (
    <div className="container py-5" style={{ minHeight: '80vh', backgroundColor: '#FFFFFF', color: '#000000' }}>
      <div className="row g-4">
      
        <div className="col-12 col-md-5">
          <div className="card p-3 shadow-none border bg-white" style={{ borderRadius: '0px', borderColor: '#000000' }}>
            <h5 className="fw-bold mb-3 text-uppercase tracking-wider text-dark" style={{ fontSize: '14px', borderBottom: '2px solid #000000', paddingBottom: '8px' }}>
              My Support Tickets
            </h5>
            <div className="list-group gap-2">
              {tickets.map(t => (
                <button key={t.id} onClick={() => handleSelectTicket(t)} className={`list-group-item list-group-item-action border p-3 text-start ${selectedTicket?.id === t.id ? 'bg-black text-white' : 'bg-white text-dark'}`} style={{ borderRadius: '0px', borderColor: '#E5E5E5' }}>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className={`badge font-monospace ${selectedTicket?.id === t.id ? 'bg-white text-black' : 'bg-black text-white'}`} style={{ borderRadius: '0px' }}>#{t.id} - {t.category}</span>
                    <span className="small text-uppercase fw-bold" style={{ fontSize: '10px' }}>{t.status}</span>
                  </div>
                  <h6 className={`fw-bold mb-1 ${selectedTicket?.id === t.id ? 'text-white' : 'text-dark'}`}>{t.subject}</h6>
                  <p className={`small mb-0 truncate-2-lines ${selectedTicket?.id === t.id ? 'text-white-50' : 'text-muted'}`}>{t.description}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

   
        <div className="col-12 col-md-7">
          {selectedTicket ? (
            <div className="card p-4 shadow-none border bg-white flex-grow-1" style={{ borderRadius: '0px', borderColor: '#000000' }}>
              <div className="border-bottom pb-2 mb-3" style={{ borderColor: '#000000' }}>
                <span className="text-uppercase small fw-bold text-muted">Active Thread</span>
                <h4 className="fw-bold text-dark mb-1 text-uppercase tracking-tight" style={{ fontSize: '20px' }}>{selectedTicket.subject}</h4>
                <p className="small mb-0">STATUS: <span className="fw-bold text-uppercase">{selectedTicket.status}</span></p>
              </div>

          
              <div className="border p-3 mb-3 bg-white overflow-auto" style={{ height: '300px', borderRadius: '0px', borderColor: '#E5E5E5' }}>
                {loading ? (
                  <p className="text-muted text-center small py-4 text-uppercase">Syncing thread...</p>
                ) : (
                  messages.map(m => (
                    <div key={m.id} className={`d-flex flex-column mb-3 ${m.sender_type === 'Admin' ? 'align-items-start' : 'align-items-end'}`}>
                      <div className="p-3 border small" style={{ backgroundColor: m.sender_type === 'Admin' ? '#F5F5F5' : '#000000', color: m.sender_type === 'Admin' ? '#000000' : '#FFFFFF', maxWidth: '85%', borderRadius: '0px' }}>
                        <span className="d-block fw-bold text-uppercase border-bottom pb-1 mb-1 font-monospace" style={{ fontSize: '8px', opacity: 0.7 }}>{m.sender_type}</span>
                        {m.message}
                      </div>
                    </div>
                  ))
                )}
              </div>

           
              {selectedTicket.status.toLowerCase() !== 'closed' ? (
                <form onSubmit={handleSendReply}>
                  <div className="input-group">
                    <input type="text" className="form-control" placeholder="TYPE RESPONSE MESSAGE HERE..." style={{ borderRadius: '0px', borderColor: '#000000' }} value={replyText} onChange={e => setReplyText(e.target.value)} required />
                    <button type="submit" className="btn btn-dark text-white fw-bold text-uppercase px-4" style={{ borderRadius: '0px', backgroundColor: '#000000' }}>Send</button>
                  </div>
                </form>
              ) : (
                <div className="border text-center py-2 text-uppercase small bg-light text-muted" style={{ borderRadius: '0px' }}>This conversation thread is closed.</div>
              )}
            </div>
          ) : (
            <div className="card p-5 text-center text-muted border bg-white h-100 d-flex align-items-center justify-content-center" style={{ borderRadius: '0px', borderStyle: 'dashed', borderColor: '#CCCCCC' }}>
              <div><i className="bi bi-chat-left-dots text-dark mb-2" style={{ fontSize: '28px' }}></i><p className="small text-uppercase tracking-wider mb-0">Select an incident from the log list to view dialogue details.</p></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TicketsPage;
