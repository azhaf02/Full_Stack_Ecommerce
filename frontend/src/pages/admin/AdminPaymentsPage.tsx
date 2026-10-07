import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import DataTable from "../../components/admin/DataTable";
import type { Column } from "../../components/admin/DataTable";
import StatusBadge from "../../components/admin/StatusBadge";
import Pagination from "../../components/admin/Pagination";
import { getPayments } from "../../services/adminService";
import type { AdminPayment } from "../../services/adminService";
import { formatINR } from "../../utils/format";

const PAGE_SIZE = 10;

// Same status values as the backend payment model
const TABS = ["ALL", "SUCCESS", "PENDING", "FAILED", "CANCELLED", "REFUND_PENDING", "REFUNDED"];

const tabLabel = (tab: string) => {
  if (tab === "ALL") return "All";
  const text = tab.replace(/_/g, " ").toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
};

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

const columns: Column<AdminPayment>[] = [
  { key: "id", label: "Payment", render: (p) => `#${p.id}` },
  {
    key: "orderNumber",
    label: "Order",
    render: (p) => (
      <Link to={`/admin/orders/${p.orderId}`} className="text-primary-600 hover:underline">
        {p.orderNumber}
      </Link>
    ),
  },
  { key: "customerName", label: "Customer" },
  { key: "method", label: "Method" },
  { key: "transactionId", label: "Transaction ID", render: (p) => p.transactionId ?? "-" },
  { key: "amount", label: "Amount", render: (p) => formatINR(p.amount) },
  { key: "createdAt", label: "Date", render: (p) => formatDate(p.createdAt) },
  { key: "status", label: "Status", render: (p) => <StatusBadge status={p.status} /> },
];

export default function AdminPaymentsPage() {
  const [tab, setTab] = useState("ALL");
  const [q, setQ] = useState("");
  const [method, setMethod] = useState("ALL");
  const [page, setPage] = useState(1);

  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [collected, setCollected] = useState(0);
  const [pendingCod, setPendingCod] = useState(0);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0); // changing this loads the list again

  // Load payments from GET /api/admin/payments.
  // Waits 400 ms after the last change, so typing does not call the API on every letter.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    const timer = setTimeout(() => {
      getPayments({
        q,
        status: tab === "ALL" ? "" : tab,
        method: method === "ALL" ? "" : method,
        page,
        pageSize: PAGE_SIZE,
      })
        .then((data) => {
          if (cancelled) return;
          setPayments(data.items);
          setTotal(data.total);
          setTotalPages(data.totalPages);
          setCollected(data.collectedAmount);
          setPendingCod(data.pendingCodAmount);
          setStatusCounts(data.statusCounts);
        })
        .catch(() => {
          if (!cancelled) setError("Could not load payments. Check that the backend is running.");
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [q, tab, method, page, reloadKey]);

  const allCount = Object.values(statusCounts).reduce((sum, n) => sum + n, 0);
  const countOf = (status: string) => (status === "ALL" ? allCount : statusCounts[status] ?? 0);

  // Any new filter goes back to page 1
  const changeTab = (value: string) => {
    setTab(value);
    setPage(1);
  };
  const changeSearch = (value: string) => {
    setQ(value);
    setPage(1);
  };
  const changeMethod = (value: string) => {
    setMethod(value);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Summary: totals over all payments */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-cream-50 rounded-xl border shadow-sm p-5">
          <p className="text-sm text-slate-500">Collected (successful payments)</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{formatINR(collected)}</p>
        </div>
        <div className="bg-cream-50 rounded-xl border shadow-sm p-5">
          <p className="text-sm text-slate-500">Pending COD amount</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{formatINR(pendingCod)}</p>
        </div>
      </div>

      <div className="bg-cream-50 rounded-xl border shadow-sm p-6">
        {/* Status tabs */}
        <div className="flex flex-wrap gap-2 mb-4 border-b pb-4">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => changeTab(t)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                tab === t ? "bg-primary-600 text-white" : "text-slate-600 hover:bg-cream-200"
              }`}
            >
              {tabLabel(t)}
              <span className="ml-1.5 text-xs opacity-75">({countOf(t)})</span>
            </button>
          ))}
        </div>

        {/* Search and method filter */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-52">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input
              value={q}
              maxLength={100}
              onChange={(e) => changeSearch(e.target.value)}
              placeholder="Search order number, customer or transaction ID"
              className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <select
            value={method}
            onChange={(e) => changeMethod(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
            aria-label="Payment method"
          >
            <option value="ALL">All methods</option>
            <option value="ONLINE">Online</option>
            <option value="COD">Cash on delivery</option>
          </select>
        </div>

        {loading && <p className="text-sm text-slate-500 py-8 text-center">Loading payments...</p>}

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

        {!loading && !error && (
          <>
            <p className="text-sm text-slate-500 mb-2">{total} payments found</p>
            <DataTable columns={columns} rows={payments} rowKey={(p) => p.id} />
            <Pagination page={page} totalPages={totalPages} onChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
}
