import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { Loader2, MessageSquare, Search, Send } from "lucide-react";
import StatusBadge from "../../components/admin/StatusBadge";
import LoadingRows from "../../components/admin/LoadingRows";
import Pagination from "../../components/admin/Pagination";
import {
  TICKET_STATUSES,
  getCustomers,
  getSupportTicket,
  getSupportTickets,
  replyToSupportTicket,
  updateSupportTicketStatus,
} from "../../services/adminService";
import type { Customer, SupportMessage, SupportTicket } from "../../services/adminService";

const PAGE_SIZE = 10;
const TABS = ["ALL", ...TICKET_STATUSES];

// "In Progress" -> "IN_PROGRESS" so StatusBadge can colour it
const badgeKey = (status: string) => status.trim().toUpperCase().replace(/\s+/g, "_");

const formatDate = (value: string | null) =>
  value
    ? new Date(value).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : "-";

const errorText = (err: unknown, fallback: string) => {
  const detail = axios.isAxiosError(err) ? err.response?.data?.detail : null;
  return typeof detail === "string" ? detail : fallback;
};

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [customers, setCustomers] = useState<Record<number, Customer>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0); // changing this loads the list again

  const [tab, setTab] = useState("ALL");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  // The ticket opened on the right
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [messages, setMessages] = useState<SupportMessage[] | null>(null);
  const [messagesError, setMessagesError] = useState("");
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [savingStatus, setSavingStatus] = useState(false);
  const [actionError, setActionError] = useState("");
  const [actionDone, setActionDone] = useState("");

  // Load tickets from GET /api/support/admin/tickets.
  // Customer names come from the customers API; if that fails we just show the customer id.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    Promise.all([getSupportTickets(), getCustomers("").catch(() => [] as Customer[])])
      .then(([ticketList, customerList]) => {
        if (cancelled) return;
        setTickets([...ticketList].sort((a, b) => b.id - a.id)); // newest first
        setCustomers(Object.fromEntries(customerList.map((c) => [c.id, c])));
      })
      .catch(() => {
        if (!cancelled) setError("Could not load support tickets. Check that the backend is running.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const selected = tickets.find((t) => t.id === selectedId) ?? null;

  // Load the conversation of the opened ticket
  useEffect(() => {
    if (selectedId === null) return;
    let cancelled = false;
    setMessages(null);
    setMessagesError("");

    getSupportTicket(selectedId)
      .then((data) => {
        if (!cancelled) setMessages(data.messages ?? []);
      })
      .catch(() => {
        if (!cancelled) setMessagesError("Conversation history could not be loaded.");
      });

    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const openTicket = (t: SupportTicket) => {
    setSelectedId(t.id);
    setNewStatus(t.status);
    setReply("");
    setActionError("");
    setActionDone("");
  };

  const customerLabel = (id: number) => customers[id]?.name ?? `Customer #${id}`;

  // Tabs and search
  const term = q.trim().toLowerCase();
  const filtered = tickets.filter((t) => {
    if (tab !== "ALL" && t.status !== tab) return false;
    if (!term) return true;
    const c = customers[t.customer_id];
    return [String(t.id), t.subject, t.category, c?.name ?? "", c?.email ?? ""].some((v) =>
      v.toLowerCase().includes(term)
    );
  });
  const countFor = (status: string) =>
    status === "ALL" ? tickets.length : tickets.filter((t) => t.status === status).length;

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // POST /api/support/admin/tickets/{id}/reply
  const sendReply = async () => {
    if (!selected || !reply.trim()) return;
    setSending(true);
    setActionError("");
    setActionDone("");
    try {
      await replyToSupportTicket(selected.id, reply);
      setMessages((current) =>
        current
          ? [...current, { id: Date.now(), ticket_id: selected.id, sender_type: "Support", message: reply.trim(), timestamp: new Date().toISOString() }]
          : current
      );
      setReply("");
      setActionDone("Reply sent to the customer.");
    } catch (err) {
      setActionError(errorText(err, "Could not send the reply. Try again."));
    } finally {
      setSending(false);
    }
  };

  // PUT /api/support/admin/tickets/{id}/status
  const saveStatus = async () => {
    if (!selected || newStatus === selected.status) return;
    setSavingStatus(true);
    setActionError("");
    setActionDone("");
    try {
      await updateSupportTicketStatus(selected.id, newStatus);
      setTickets((current) => current.map((t) => (t.id === selected.id ? { ...t, status: newStatus } : t)));
      setActionDone(`Status changed to ${newStatus}.`);
    } catch (err) {
      setActionError(errorText(err, "Could not update the status. Try again."));
    } finally {
      setSavingStatus(false);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 items-start">
      {/* Ticket list */}
      <div className="admin-card p-6 xl:col-span-3">
        <div className="flex flex-wrap gap-2 mb-4 border-b pb-4">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => {
                setTab(t);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                tab === t ? "bg-primary-600 text-white" : "text-slate-600 hover:bg-cream-200"
              }`}
            >
              {t === "ALL" ? "All" : t}
              <span className={`ml-1.5 text-xs ${tab === t ? "text-white/80" : "text-slate-400"}`}>{countFor(t)}</span>
            </button>
          ))}
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="Search ticket #, subject, category or customer"
            className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {loading && <LoadingRows />}

        {!loading && error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm">{error}</p>
            <button
              onClick={() => setReloadKey(reloadKey + 1)}
              className="text-sm font-medium px-3 py-1 rounded-lg border border-rose-300 hover:bg-rose-100"
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <p className="text-sm text-slate-500 py-8 text-center">No support tickets here.</p>
        )}

        {!loading && !error && filtered.length > 0 && (
          <>
            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left bg-cream-100/70 border-b">
                    {["Ticket", "Customer", "Created", "Status"].map((h) => (
                      <th key={h} className="py-3 px-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((t) => (
                    <tr
                      key={t.id}
                      onClick={() => openTicket(t)}
                      className={`border-b last:border-0 cursor-pointer transition-colors ${
                        t.id === selectedId ? "bg-primary-50" : "hover:bg-cream-100/60"
                      }`}
                    >
                      <td className="py-3 px-4 max-w-xs">
                        <p className="font-medium text-slate-800 truncate">{t.subject}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          #{t.id} · {t.category}
                        </p>
                      </td>
                      <td className="py-3 px-4 text-slate-700">{customerLabel(t.customer_id)}</td>
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">{formatDate(t.created_at)}</td>
                      <td className="py-3 px-4">
                        <StatusBadge status={badgeKey(t.status)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && <Pagination page={currentPage} totalPages={totalPages} onChange={setPage} />}
          </>
        )}
      </div>

      {/* Opened ticket */}
      <div className="admin-card p-6 xl:col-span-2 xl:sticky xl:top-24">
        {!selected && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <span className="w-12 h-12 rounded-full bg-cream-200/70 flex items-center justify-center mb-3">
              <MessageSquare size={22} className="text-slate-400" />
            </span>
            <p className="text-sm font-medium text-slate-700">Select a ticket</p>
            <p className="text-xs text-slate-500 mt-1">Its conversation, reply box and status appear here.</p>
          </div>
        )}

        {selected && (
          <div className="space-y-5">
            <div>
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-display text-lg font-semibold text-slate-800">{selected.subject}</h2>
                <StatusBadge status={badgeKey(selected.status)} />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                #{selected.id} · {selected.category} · {formatDate(selected.created_at)}
              </p>
              <p className="text-sm text-slate-600 mt-2">
                {customerLabel(selected.customer_id)}
                {customers[selected.customer_id]?.email && (
                  <span className="text-slate-400"> · {customers[selected.customer_id].email}</span>
                )}
                {selected.order_id && (
                  <>
                    {" · "}
                    <Link to={`/admin/orders/${selected.order_id}`} className="text-primary-600 hover:underline">
                      Order #{selected.order_id}
                    </Link>
                  </>
                )}
              </p>
            </div>

            {/* Conversation: the customer's first message, then the thread */}
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              <div className="rounded-xl bg-white border px-4 py-3">
                <p className="text-xs font-semibold text-slate-500 mb-1">Customer</p>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{selected.description}</p>
              </div>

              {messages === null && !messagesError && (
                <p className="text-xs text-slate-500 flex items-center gap-1.5">
                  <Loader2 size={12} className="animate-spin" /> Loading conversation...
                </p>
              )}
              {messagesError && <p className="text-xs text-slate-500">{messagesError}</p>}

              {messages?.map((m) => {
                const fromSupport = m.sender_type.toLowerCase() === "support";
                return (
                  <div
                    key={m.id}
                    className={`rounded-xl px-4 py-3 ${
                      fromSupport ? "bg-primary-50 border border-primary-100 ml-6" : "bg-white border mr-6"
                    }`}
                  >
                    <p className="text-xs font-semibold text-slate-500 mb-1">
                      {fromSupport ? "Support" : "Customer"}
                      <span className="font-normal text-slate-400"> · {formatDate(m.timestamp)}</span>
                    </p>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{m.message}</p>
                  </div>
                );
              })}
            </div>

            {/* Reply */}
            <div>
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Write a reply to the customer"
                maxLength={2000}
                rows={3}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <div className="flex justify-end mt-2">
                <button
                  onClick={sendReply}
                  disabled={sending || !reply.trim()}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
                >
                  <Send size={14} />
                  {sending ? "Sending..." : "Send reply"}
                </button>
              </div>
            </div>

            {/* Status */}
            <div className="border-t pt-4">
              <label htmlFor="ticket-status" className="block text-sm font-medium text-slate-700 mb-1">
                Status
              </label>
              <div className="flex gap-2">
                <select
                  id="ticket-status"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="flex-1 border rounded-lg px-3 py-2 text-sm"
                >
                  {/* Keep an unexpected status from the backend selectable */}
                  {!TICKET_STATUSES.includes(selected.status) && <option value={selected.status}>{selected.status}</option>}
                  {TICKET_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <button
                  onClick={saveStatus}
                  disabled={savingStatus || newStatus === selected.status}
                  className="px-4 py-2 text-sm font-medium border rounded-lg hover:bg-cream-100 disabled:opacity-50"
                >
                  {savingStatus ? "Saving..." : "Save"}
                </button>
              </div>
            </div>

            {actionError && (
              <p role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {actionError}
              </p>
            )}
            {actionDone && (
              <p role="status" className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                {actionDone}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
