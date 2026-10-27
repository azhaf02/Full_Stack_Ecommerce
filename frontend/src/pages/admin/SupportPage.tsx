import React, { useCallback, useEffect, useState } from "react";
import supportAdminService from "../../services/supportAdminService";

interface SupportTicket {
  id: number;
  customer_id: number;
  order_id: number | null;
  category: string;
  subject: string;
  description: string;
  status: string;
  created_at: string | null;
}

interface SupportMessage {
  id: number;
  ticket_id: number;
  sender_type: string;
  message: string;
  timestamp: string | null;
}

interface TicketDetailsResponse {
  ticket: SupportTicket;
  messages: SupportMessage[];
}

const SupportPage: React.FC = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] =
    useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [reply, setReply] = useState("");
  const [status, setStatus] = useState("Open");
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const loadTickets = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await supportAdminService.get(
        "/api/support/admin/tickets"
      );

      const data: SupportTicket[] = response.data;
      setTickets(data);

      if (selectedTicket) {
        const updated = data.find(
          (ticket) => ticket.id === selectedTicket.id
        );

        if (updated) {
          setSelectedTicket(updated);
          setStatus(updated.status);
        }
      }
    } catch (err: any) {
      setError(
        err.response?.data?.detail ||
          "Unable to load support tickets. Please check your admin login."
      );
    } finally {
      setLoading(false);
    }
  }, [selectedTicket]);

  const openTicket = async (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setStatus(ticket.status);
    setMessages([]);
    setDetailsLoading(true);
    setError("");

    try {
      /*
       * This endpoint currently exists for customers.
       * An admin-specific ticket-details endpoint must be added
       * in backend/app/api/routes/support.py before this works for admins.
       */
      const response = await supportAdminService.get(
        `/api/support/admin/tickets/${ticket.id}`
      );

      const data: TicketDetailsResponse = response.data;
      setMessages(data.messages || []);
    } catch (err: any) {
      setError(
        err.response?.data?.detail ||
          "Ticket messages could not be loaded. The admin ticket-details API may be missing."
      );
    } finally {
      setDetailsLoading(false);
    }
  };

 useEffect(() => {
  loadTickets();
}, [loadTickets]);

  const sendReply = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!selectedTicket || !reply.trim()) return;

    setActionLoading(true);
    setError("");

    try {
      await supportAdminService.post(
        `/api/support/admin/tickets/${selectedTicket.id}/reply`,
        { message: reply.trim() }
      );

      setReply("");

      const response = await supportAdminService.get(
        `/api/support/admin/tickets/${selectedTicket.id}`
      );

      setMessages(response.data.messages || []);
    } catch (err: any) {
      setError(
        err.response?.data?.detail ||
          "Reply could not be sent or the conversation could not be refreshed."
      );
    } finally {
      setActionLoading(false);
    }
  };

  const updateStatus = async () => {
    if (!selectedTicket) return;

    setActionLoading(true);
    setError("");

    try {
      await supportAdminService.put(
        `/api/support/admin/tickets/${selectedTicket.id}/status`,
        { status }
      );

      await loadTickets();
    } catch (err: any) {
      setError(
        err.response?.data?.detail || "Unable to update ticket status."
      );
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="container-fluid py-3">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 border-bottom pb-3 mb-4">
        <div>
          <h4 className="fw-bold text-dark mb-1">Customer Support</h4>
          <p className="text-muted small mb-0">
            Manage support tickets, respond to customers, and update ticket
            statuses.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-outline-secondary btn-sm"
          onClick={loadTickets}
          disabled={loading}
        >
          <i className="bi bi-arrow-clockwise me-1" />
          Refresh
        </button>
      </div>

      {error && (
        <div className="alert alert-warning" role="alert">
          {error}
        </div>
      )}

      <div className="row g-4">
        <div className="col-12 col-lg-5">
          <div className="card border shadow-sm">
            <div className="card-header bg-white py-3">
              <h6 className="fw-bold mb-0">
                Support Tickets ({tickets.length})
              </h6>
            </div>

            <div className="list-group list-group-flush">
              {loading ? (
                <div className="p-4 text-center text-muted">
                  <div
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                  />
                  Loading tickets...
                </div>
              ) : tickets.length === 0 ? (
                <div className="p-4 text-center text-muted">
                  No support tickets found.
                </div>
              ) : (
                tickets.map((ticket) => (
                  <button
                    key={ticket.id}
                    type="button"
                    className={`list-group-item list-group-item-action p-3 text-start ${
                      selectedTicket?.id === ticket.id ? "active" : ""
                    }`}
                    onClick={() => openTicket(ticket)}
                  >
                    <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                      <span className="fw-bold">
                        #{ticket.id} — {ticket.subject}
                      </span>

                      <span
                        className={`badge ${
                          ticket.status.toLowerCase() === "open"
                            ? "bg-success"
                            : ticket.status.toLowerCase() === "closed"
                              ? "bg-secondary"
                              : "bg-warning text-dark"
                        }`}
                      >
                        {ticket.status}
                      </span>
                    </div>

                    <div className="small mb-1">
                      Customer ID: {ticket.customer_id}
                    </div>

                    <div className="small mb-1">
                      Category: {ticket.category}
                    </div>

                    <div className="small opacity-75">
                      {ticket.created_at
                        ? new Date(ticket.created_at).toLocaleString()
                        : "Date unavailable"}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-7">
          {!selectedTicket ? (
            <div className="card border shadow-sm">
              <div className="card-body text-center py-5">
                <i className="bi bi-chat-left-text display-4 text-muted mb-3"></i>

            <h5 className="text-muted">Select a Support Ticket</h5>
                <p className="text-muted mb-0">
                  Choose a ticket from the list to view its details and reply.
                </p>
              </div>
            </div>
          ) : (
            <div className="card border shadow-sm">
              <div className="card-header bg-white py-3">
                <h6 className="fw-bold mb-1">
                  #{selectedTicket.id} — {selectedTicket.subject}
                </h6>
                <small className="text-muted">
                  Customer ID: {selectedTicket.customer_id}
                </small>
              </div>

              <div className="card-body">
                {detailsLoading ? (
                  <p className="text-muted">Loading conversation...</p>
                ) : (
                  <div className="mb-4">
                    <div className="p-3 rounded bg-light mb-3">
                      <strong>Customer's issue</strong>
                      <p className="mb-0 mt-2">
                        {selectedTicket.description}
                      </p>
                    </div>

                    {messages.length === 0 ? (
                      <p className="text-muted">No messages available.</p>
                    ) : (
                      messages.map((message) => (
                        <div
                          key={message.id}
                          className="border rounded p-3 mb-2"
                        >
                          <div className="d-flex justify-content-between gap-2 mb-2">
                            <strong>{message.sender_type}</strong>
                            <small className="text-muted">
                              {message.timestamp
                                ? new Date(message.timestamp).toLocaleString()
                                : ""}
                            </small>
                          </div>
                          <p className="mb-0">{message.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                )}

                <form onSubmit={sendReply}>
                  <label className="form-label fw-semibold" htmlFor="reply">
                    Reply to customer
                  </label>
                  <textarea
                    id="reply"
                    className="form-control mb-3"
                    rows={3}
                    value={reply}
                    onChange={(event) => setReply(event.target.value)}
                    placeholder="Type your reply..."
                    required
                  />

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={actionLoading || !reply.trim()}
                  >
                    {actionLoading ? "Sending..." : "Send Reply"}
                  </button>
                </form>

                <hr className="my-4" />

                <label className="form-label fw-semibold" htmlFor="ticketStatus">
                  Ticket Status
                </label>
                <div className="d-flex gap-2">
                  <select
                    id="ticketStatus"
                    className="form-select"
                    value={status}
                    onChange={(event) => setStatus(event.target.value)}
                  >
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Closed">Closed</option>
                  </select>

                  <button
                    type="button"
                    className="btn btn-outline-primary"
                    onClick={updateStatus}
                    disabled={actionLoading || status === selectedTicket.status}
                  >
                    Update
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupportPage;