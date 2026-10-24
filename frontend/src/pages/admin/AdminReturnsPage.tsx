import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import StatusBadge from "../../components/admin/StatusBadge";
import Modal from "../../components/admin/Modal";
import { getReturns, reviewReturn } from "../../services/adminService";
import type { AdminReturn, ReturnAction } from "../../services/adminService";
import { formatINR } from "../../utils/format";

const PAGE_SIZE = 10;

// Same status values as the backend return model
const TABS = ["ALL", "REQUESTED", "APPROVED", "RETURNED", "REFUND_PENDING", "REFUNDED", "REJECTED"];

const label = (value: string) => {
  if (value === "ALL") return "All";
  const text = value.replace(/_/g, " ").toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
};

const formatDate = (value: string | null) =>
  value ? new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-";

// The next step(s) the orders module accepts for each return status
const ACTIONS: Record<string, { action: ReturnAction; text: string; tone: "primary" | "danger" }[]> = {
  REQUESTED: [
    { action: "approve", text: "Approve", tone: "primary" },
    { action: "reject", text: "Reject", tone: "danger" },
  ],
  APPROVED: [{ action: "mark_returned", text: "Mark item received", tone: "primary" }],
  REFUND_PENDING: [{ action: "complete_refund", text: "Complete refund", tone: "primary" }],
};

const CONFIRM_TEXT: Record<ReturnAction, string> = {
  approve: "The customer can send the item back.",
  reject: "The return request will be closed. Add a reason for the customer.",
  mark_returned: "Confirm the item has reached the store. If the order was paid, the refund becomes pending.",
  complete_refund: "Confirm the money has been sent back to the customer.",
};

export default function AdminReturnsPage() {
  const [tab, setTab] = useState("REQUESTED");
  const [page, setPage] = useState(1);
  const [returns, setReturns] = useState<AdminReturn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0); // changing this loads the list again

  // Confirm popup for one action on one return
  const [pending, setPending] = useState<{ ret: AdminReturn; action: ReturnAction; text: string } | null>(null);
  const [remarks, setRemarks] = useState("");
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState("");

  // Load returns from GET /api/admin/returns
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    getReturns(tab === "ALL" ? "" : tab, page, PAGE_SIZE)
      .then((data) => {
        if (!cancelled) setReturns(data);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load return requests. Check that the backend is running.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [tab, page, reloadKey]);

  const changeTab = (value: string) => {
    setTab(value);
    setPage(1);
  };

  const openConfirm = (ret: AdminReturn, action: ReturnAction, text: string) => {
    setPending({ ret, action, text });
    setRemarks("");
    setActionError("");
  };

  // Calls PUT /api/admin/returns/{id}; the orders module checks the step is allowed
  const confirmAction = async () => {
    if (!pending) return;
    if (pending.action === "reject" && !remarks.trim()) {
      setActionError("Please add a reason for rejecting.");
      return;
    }
    setSaving(true);
    setActionError("");
    try {
      const updated = await reviewReturn(pending.ret.id, pending.action, remarks);
      // Keep the row on this tab only if it still matches the filter
      setReturns((current) =>
        current
          .map((r) => (r.id === updated.id ? updated : r))
          .filter((r) => tab === "ALL" || r.status === tab)
      );
      setPending(null);
    } catch (err) {
      const detail = axios.isAxiosError(err) ? err.response?.data?.detail : null;
      setActionError(typeof detail === "string" ? detail : "Could not update the return. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-cream-50 rounded-xl border shadow-sm p-6">
      {/* Status tabs */}
      <div className="flex flex-wrap gap-2 mb-6 border-b pb-4">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => changeTab(t)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
              tab === t ? "bg-primary-600 text-white" : "text-slate-600 hover:bg-cream-200"
            }`}
          >
            {label(t)}
          </button>
        ))}
      </div>

      {loading && <p className="text-sm text-slate-500 py-8 text-center">Loading return requests...</p>}

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

      {!loading && !error && returns.length === 0 && (
        <p className="text-sm text-slate-500 py-8 text-center">No return requests here.</p>
      )}

      {!loading && !error && returns.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b">
                <th className="py-2 pr-4">Return</th>
                <th className="py-2 pr-4">Order</th>
                <th className="py-2 pr-4">Reason</th>
                <th className="py-2 pr-4">Items</th>
                <th className="py-2 pr-4">Refund</th>
                <th className="py-2 pr-4">Requested</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {returns.map((r) => (
                <tr key={r.id} className="border-b last:border-0 align-top">
                  <td className="py-3 pr-4">#{r.id}</td>
                  <td className="py-3 pr-4">
                    <Link to={`/admin/orders/${r.order_id}`} className="text-primary-600 hover:underline">
                      Order #{r.order_id}
                    </Link>
                  </td>
                  <td className="py-3 pr-4 max-w-xs">
                    <p className="text-slate-700">{r.reason}</p>
                    {r.admin_remarks && <p className="text-xs text-slate-500 mt-1">Admin: {r.admin_remarks}</p>}
                  </td>
                  <td className="py-3 pr-4">{r.items.reduce((sum, i) => sum + i.quantity, 0)}</td>
                  <td className="py-3 pr-4">{r.refund_amount ? formatINR(Number(r.refund_amount)) : "-"}</td>
                  <td className="py-3 pr-4">{formatDate(r.requested_at)}</td>
                  <td className="py-3 pr-4">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="py-3">
                    <div className="flex flex-wrap gap-2">
                      {(ACTIONS[r.status] ?? []).map((a) => (
                        <button
                          key={a.action}
                          onClick={() => openConfirm(r, a.action, a.text)}
                          className={`text-xs font-medium px-3 py-1 rounded-lg border ${
                            a.tone === "danger"
                              ? "text-red-600 border-red-200 hover:bg-red-50"
                              : "text-primary-700 border-primary-200 hover:bg-primary-50"
                          }`}
                        >
                          {a.text}
                        </button>
                      ))}
                      {!ACTIONS[r.status] && <span className="text-xs text-slate-400">No action</span>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Simple pagination: the API returns one page without a total */}
      {!loading && !error && (page > 1 || returns.length === PAGE_SIZE) && (
        <div className="flex justify-between items-center mt-4 text-sm">
          <span className="text-slate-500">Page {page}</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="px-3 py-1.5 border rounded-lg disabled:opacity-40"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(page + 1)}
              disabled={returns.length < PAGE_SIZE}
              className="px-3 py-1.5 border rounded-lg disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Confirm popup */}
      {pending && (
        <Modal title={`${pending.text} for return #${pending.ret.id}?`} onClose={() => setPending(null)}>
          <p className="text-sm text-slate-600">{CONFIRM_TEXT[pending.action]}</p>

          {(pending.action === "approve" || pending.action === "reject") && (
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder={pending.action === "reject" ? "Reason for rejecting (required)" : "Remarks (optional)"}
              maxLength={500}
              rows={3}
              className="w-full mt-4 border rounded-lg px-3 py-2 text-sm"
            />
          )}

          {actionError && (
            <p role="alert" className="mt-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {actionError}
            </p>
          )}

          <div className="flex justify-end gap-3 mt-6">
            <button onClick={() => setPending(null)} className="px-4 py-2 text-sm border rounded-lg hover:bg-cream-100">
              Cancel
            </button>
            <button
              onClick={confirmAction}
              disabled={saving}
              className={`px-4 py-2 text-sm text-white rounded-lg disabled:opacity-60 ${
                pending.action === "reject" ? "bg-red-600 hover:bg-red-700" : "bg-primary-600 hover:bg-primary-700"
              }`}
            >
              {saving ? "Saving..." : pending.text}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
