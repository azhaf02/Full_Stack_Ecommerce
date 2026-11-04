
import React, { useEffect, useState } from 'react';
import apiClient, { getErrorMessage } from '../../services/apiClient';

interface Message {
  id: number;
  sender_type: string;
  message: string;
  created_at?: string;
  timestamp?: string;
}

interface Ticket {
  id: number;
  category: string;
  subject: string;
  description: string;
  status: string;
  created_at?: string;
}

interface TicketResponse {
  ticket: Ticket;
  messages: Message[];
}

const TicketDetailPage: React.FC<{ ticketId: number }> = ({ ticketId }) => {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const isClosed =
    ticket?.status?.toLowerCase() === 'closed' ||
    ticket?.status?.toLowerCase() === 'resolved';

  const loadTicket = async () => {
    try {
      setError('');
      const response = await apiClient.get<TicketResponse>(
        `/api/support/account/tickets/${ticketId}`
      );

      setTicket(response.data.ticket);
      setMessages(response.data.messages || []);
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to load this support ticket.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    setTicket(null);
    setMessages([]);
    loadTicket();
  }, [ticketId]);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reply.trim() || sending) return;

    try {
      setSending(true);
      setError('');

      await apiClient.post(
        `/api/support/account/tickets/${ticketId}/reply`,
        { message: reply.trim() }
      );

      setReply('');
      await loadTicket();
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to send your reply.'));
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <div className="text-center p-4">Loading ticket details...</div>;
  }

  if (error && !ticket) {
    return (
      <div className="alert alert-danger" role="alert">
        {error}
      </div>
    );
  }

  if (!ticket) {
    return <div className="alert alert-warning">Ticket not found.</div>;
  }

  return (
    <div
      className="card p-4 shadow-sm bg-white border"
      style={{ borderRadius: '8px', borderColor: '#E5E2D8' }}
    >
      <div className="d-flex justify-content-between align-items-start border-bottom pb-3 mb-3">
        <div>
          <span className="badge bg-secondary mb-2">
            Ticket ID: #{ticket.id}
          </span>

          <h4 className="fw-bold text-dark mb-1">{ticket.subject}</h4>

          <p className="text-muted small mb-0">
            Category: <strong>{ticket.category}</strong>
          </p>
        </div>

        <span
          className="badge px-3 py-2 fw-bold text-white"
          style={{ backgroundColor: '#5F6B3A' }}
        >
          {ticket.status}
        </span>
      </div>

      <div className="p-3 bg-light border rounded small mb-4 text-secondary">
        <strong className="d-block mb-2">Original Description</strong>
        {ticket.description}
      </div>

      <div
        className="border rounded p-3 mb-4 bg-white overflow-auto"
        style={{ maxHeight: '350px', minHeight: '150px' }}
      >
        <h6 className="fw-bold text-muted border-bottom pb-2 mb-3">
          <i className="bi bi-chat-left-text me-2"></i>
          Conversation History
        </h6>

        {messages.length === 0 ? (
          <p className="text-muted small">No messages yet.</p>
        ) : (
          <div className="d-flex flex-column gap-3">
            {messages.map((m) => {
              const isCustomer = m.sender_type?.toLowerCase() === 'customer';

              return (
                <div
                  key={m.id}
                  className={`d-flex flex-column ${
                    isCustomer ? 'align-items-end' : 'align-items-start'
                  }`}
                >
                  <div
                    className="p-2 rounded text-white small shadow-sm"
                    style={{
                      backgroundColor: isCustomer ? '#3B4D3C' : '#6C757D',
                      maxWidth: '85%',
                    }}
                  >
                    <span
                      className="d-block fw-bold border-bottom pb-1 mb-1"
                      style={{ fontSize: '9px', opacity: 0.8 }}
                    >
                      {m.sender_type}
                    </span>

                    <p className="mb-0 small">{m.message}</p>
                  </div>

                  {(m.created_at || m.timestamp) && (
                    <small className="text-muted mt-1">
                      {new Date(m.created_at || m.timestamp!).toLocaleString()}
                    </small>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {error && (
        <div className="alert alert-danger py-2" role="alert">
          {error}
        </div>
      )}

      {isClosed ? (
        <div className="alert alert-secondary mb-0">
          This support conversation is closed. You cannot send further replies.
        </div>
      ) : (
        <form onSubmit={handleReply}>
          <label className="form-label fw-bold small">
            Reply to Support
          </label>

          <textarea
            className="form-control mb-2"
            rows={3}
            placeholder="Type your message..."
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            required
          />

          <button
            type="submit"
            disabled={sending || !reply.trim()}
            className="btn text-white fw-bold px-4"
            style={{ backgroundColor: '#3B4D3C', borderRadius: '8px' }}
          >
            {sending ? 'Sending...' : 'Send Reply'}
          </button>
        </form>
      )}
    </div>
  );
};

export default TicketDetailPage;
