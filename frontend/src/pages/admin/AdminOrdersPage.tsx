import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import DataTable from "../../components/admin/DataTable";
import type { Column } from "../../components/admin/DataTable";
import StatusBadge from "../../components/admin/StatusBadge";
import Pagination from "../../components/admin/Pagination";
import { getOrders } from "../../services/adminService";
import type { AdminOrder } from "../../services/adminService";
import { formatINR } from "../../utils/format";

const PAGE_SIZE = 10;

// Same status values as the backend order model
const STATUSES = [
  "PLACED", "CONFIRMED", "PROCESSING", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED",
  "CANCELLED", "RETURN_REQUESTED", "RETURN_APPROVED", "RETURNED", "REFUND_PENDING", "REFUNDED",
];

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

const columns: Column<AdminOrder>[] = [
  { key: "orderNumber", label: "Order" },
  { key: "customerName", label: "Customer" },
  { key: "createdAt", label: "Date", render: (o) => formatDate(o.createdAt) },
  { key: "paymentMethod", label: "Payment" },
  { key: "totalAmount", label: "Total", render: (o) => formatINR(o.totalAmount) },
  { key: "status", label: "Status", render: (o) => <StatusBadge status={o.status} /> },
];

export default function AdminOrdersPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();

  // Read the current filters from the URL, ignoring values that are not valid
  const rawStatus = params.get("status") ?? "";
  const status = STATUSES.includes(rawStatus) ? rawStatus : "ALL";
  const q = params.get("q") ?? "";
  const from = params.get("from") ?? "";
  const to = params.get("to") ?? "";
  const page = Math.max(1, Number(params.get("page")) || 1);

  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0); // changing this loads the list again

  const badDateRange = from !== "" && to !== "" && from > to;

  // Update one filter in the URL
  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value && value !== "ALL") next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.delete("page"); // new filter → back to page 1
    setParams(next);
  };

  // Load orders from GET /api/admin/orders.
  // Waits 400 ms after the last change, so typing in the search box does not call the API on every letter.
  useEffect(() => {
    if (badDateRange) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError("");

    const timer = setTimeout(() => {
      getOrders({
        q,
        status: status === "ALL" ? "" : status,
        dateFrom: from,
        dateTo: to,
        page,
        pageSize: PAGE_SIZE,
      })
        .then((data) => {
          if (cancelled) return;
          setOrders(data.items);
          setTotal(data.total);
          setTotalPages(data.totalPages);
        })
        .catch(() => {
          if (!cancelled) setError("Could not load orders. Check the filters and that the backend is running.");
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [q, status, from, to, page, badDateRange, reloadKey]);

  return (
    <div className="bg-cream-50 rounded-xl border shadow-sm p-6">
      {/* Filter bar */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-52">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
          <input
            value={q}
            maxLength={100}
            onChange={(e) => updateParam("q", e.target.value)}
            placeholder="Search order number or customer"
            className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <select
          value={status}
          onChange={(e) => updateParam("status", e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm"
          aria-label="Order status"
        >
          <option value="ALL">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replace(/_/g, " ")}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={from}
          onChange={(e) => updateParam("from", e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm"
          aria-label="From date"
        />
        <input
          type="date"
          value={to}
          onChange={(e) => updateParam("to", e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm"
          aria-label="To date"
        />

        <button
          onClick={() => setParams({})}
          className="px-3 py-2 text-sm text-slate-600 hover:text-primary-600"
        >
          Clear
        </button>
      </div>

      {badDateRange && (
        <p role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          The "from" date cannot be after the "to" date.
        </p>
      )}

      {!badDateRange && loading && (
        <p className="text-sm text-slate-500 py-8 text-center">Loading orders...</p>
      )}

      {!badDateRange && !loading && error && (
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

      {!badDateRange && !loading && !error && (
        <>
          <p className="text-sm text-slate-500 mb-2">{total} orders found</p>

          <DataTable
            columns={columns}
            rows={orders}
            rowKey={(o) => o.id}
            onRowClick={(o) => navigate(`/admin/orders/${o.id}`)}
          />

          <Pagination
            page={page}
            totalPages={totalPages}
            onChange={(p) => updateParam("page", String(p))}
          />
        </>
      )}
    </div>
  );
}
