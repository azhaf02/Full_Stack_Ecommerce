import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import StatusBadge from "../../components/admin/StatusBadge";
import LoadingRows from "../../components/admin/LoadingRows";
import Modal from "../../components/admin/Modal";
import Pagination from "../../components/admin/Pagination";
import { deleteReview, getReviews, updateReviewStatus } from "../../services/adminService";
import type { AdminReview, ReviewStatus } from "../../services/adminService";

const PAGE_SIZE = 10;

// Same status values as the reviews table
const TABS = ["PENDING", "APPROVED", "REJECTED", "ALL"];

const label = (value: string) => (value === "ALL" ? "All" : value.charAt(0) + value.slice(1).toLowerCase());

const formatDate = (value: string | null) =>
  value ? new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-";

// What the admin can do from each status
const ACTIONS: Record<string, { status: ReviewStatus; text: string; tone: "primary" | "danger" }[]> = {
  PENDING: [
    { status: "APPROVED", text: "Approve", tone: "primary" },
    { status: "REJECTED", text: "Reject", tone: "danger" },
  ],
  APPROVED: [{ status: "REJECTED", text: "Hide", tone: "danger" }],
  REJECTED: [{ status: "APPROVED", text: "Approve", tone: "primary" }],
};

// "DELETE" removes the review for good; the others change its status
type ReviewAction = ReviewStatus | "DELETE";

const CONFIRM_TEXT: Record<ReviewAction, string> = {
  APPROVED: "The review will be shown to customers on the product page.",
  REJECTED: "The review will be hidden from customers.",
  PENDING: "",
  DELETE: "The review will be removed permanently. This cannot be undone. To only hide it, use Reject instead.",
};

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={14}
          className={n <= rating ? "fill-amber-400 text-amber-400" : "text-slate-300"}
        />
      ))}
    </span>
  );
}

export default function AdminReviewsPage() {
  const [tab, setTab] = useState("PENDING");
  const [page, setPage] = useState(1);
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0); // changing this loads the list again

  // Confirm popup for one action on one review
  const [pending, setPending] = useState<{ review: AdminReview; status: ReviewAction; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState("");

  // Load reviews from GET /api/admin/reviews
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    getReviews(tab === "ALL" ? "" : tab)
      .then((data) => {
        if (!cancelled) setReviews(data);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load reviews. Check that the backend is running.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [tab, reloadKey]);

  const changeTab = (value: string) => {
    setTab(value);
    setPage(1);
  };

  const openConfirm = (review: AdminReview, status: ReviewAction, text: string) => {
    setPending({ review, status, text });
    setActionError("");
  };

  // Calls DELETE /api/admin/reviews/{id} or PUT /api/admin/reviews/{id}/status
  const confirmAction = async () => {
    if (!pending) return;
    setSaving(true);
    setActionError("");
    try {
      if (pending.status === "DELETE") {
        const deletedId = pending.review.id;
        await deleteReview(deletedId);
        setReviews((current) => current.filter((r) => r.id !== deletedId));
        setPending(null);
        return;
      }
      const updated = await updateReviewStatus(pending.review.id, pending.status);
      // Keep the row on this tab only if it still matches the filter
      setReviews((current) =>
        current
          .map((r) => (r.id === updated.id ? updated : r))
          .filter((r) => tab === "ALL" || r.status === tab)
      );
      setPending(null);
    } catch (err) {
      const detail = axios.isAxiosError(err) ? err.response?.data?.detail : null;
      const fallback = pending.status === "DELETE" ? "Could not delete the review. Try again." : "Could not update the review. Try again.";
      setActionError(typeof detail === "string" ? detail : fallback);
    } finally {
      setSaving(false);
    }
  };

  // The API returns the whole list, so pages are cut here
  const totalPages = Math.max(1, Math.ceil(reviews.length / PAGE_SIZE));
  const pageRows = reviews.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="admin-card p-6">
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

      {!loading && !error && reviews.length === 0 && (
        <p className="text-sm text-slate-500 py-8 text-center">No reviews here.</p>
      )}

      {!loading && !error && reviews.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b">
                <th className="py-2 pr-4">Review</th>
                <th className="py-2 pr-4">Rating</th>
                <th className="py-2 pr-4">Product</th>
                <th className="py-2 pr-4">Order</th>
                <th className="py-2 pr-4">Date</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((r) => (
                <tr key={r.id} className="border-b last:border-0 align-top">
                  <td className="py-3 pr-4 max-w-sm">
                    {r.title && <p className="font-medium text-slate-800">{r.title}</p>}
                    <p className="text-slate-600">{r.comment}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      #{r.id} · Customer #{r.userId}
                    </p>
                  </td>
                  <td className="py-3 pr-4 whitespace-nowrap">
                    <Stars rating={r.rating} />
                  </td>
                  <td className="py-3 pr-4">Product #{r.productId}</td>
                  <td className="py-3 pr-4">
                    <Link to={`/admin/orders/${r.orderId}`} className="text-primary-600 hover:underline">
                      Order #{r.orderId}
                    </Link>
                  </td>
                  <td className="py-3 pr-4 whitespace-nowrap">{formatDate(r.createdAt)}</td>
                  <td className="py-3 pr-4">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="py-3">
                    <div className="flex flex-wrap gap-2">
                      {(ACTIONS[r.status] ?? []).map((a) => (
                        <button
                          key={a.status}
                          onClick={() => openConfirm(r, a.status, a.text)}
                          className={`text-xs font-medium px-3 py-1 rounded-lg border ${
                            a.tone === "danger"
                              ? "text-red-600 border-red-200 hover:bg-red-50"
                              : "text-primary-700 border-primary-200 hover:bg-primary-50"
                          }`}
                        >
                          {a.text}
                        </button>
                      ))}
                      <button
                        onClick={() => openConfirm(r, "DELETE", "Delete")}
                        className="text-xs font-medium px-3 py-1 rounded-lg border text-slate-500 border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !error && totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      )}

      {/* Confirm popup */}
      {pending && (
        <Modal title={`${pending.text} review #${pending.review.id}?`} onClose={() => setPending(null)}>
          <p className="text-sm text-slate-600">{CONFIRM_TEXT[pending.status]}</p>

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
                pending.status === "REJECTED" || pending.status === "DELETE"
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-primary-600 hover:bg-primary-700"
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
