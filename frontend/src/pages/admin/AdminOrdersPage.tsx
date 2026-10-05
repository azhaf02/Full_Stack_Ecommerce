import { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import DataTable from "../../components/admin/DataTable";
import type { Column } from "../../components/admin/DataTable";
import StatusBadge from "../../components/admin/StatusBadge";
import Pagination from "../../components/admin/Pagination";
import { orders } from "../../mocks/adminMock";
import { formatINR } from "../../utils/format";

type Order = (typeof orders)[number];

const PAGE_SIZE = 5;
const STATUSES = ["ALL", "PLACED", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];

const columns: Column<Order>[] = [
  { key: "orderNumber", label: "Order" },
  { key: "customer", label: "Customer" },
  { key: "date", label: "Date" },
  { key: "paymentMethod", label: "Payment" },
  { key: "total", label: "Total", render: (o) => formatINR(o.total) },
  { key: "status", label: "Status", render: (o) => <StatusBadge status={o.status} /> },
];

export default function AdminOrdersPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();

  // Read the current filters from the URL
  const status = params.get("status") ?? "ALL";
  const q = params.get("q") ?? "";
  const from = params.get("from") ?? "";
  const to = params.get("to") ?? "";
  const page = Number(params.get("page") ?? "1");

  // Update one filter in the URL
  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value && value !== "ALL") next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.delete("page"); // new filter → back to page 1
    setParams(next);
  };

  // Apply filters (later the backend will do this)
  const filtered = useMemo(
    () =>
      orders.filter((o) => {
        if (status !== "ALL" && o.status !== status) return false;
        if (q && !`${o.orderNumber} ${o.customer}`.toLowerCase().includes(q.toLowerCase())) return false;
        if (from && o.date < from) return false;
        if (to && o.date > to) return false;
        return true;
      }),
    [status, q, from, to]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="bg-cream-50 rounded-xl border shadow-sm p-6">
      {/* Filter bar */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-52">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
          <input
            value={q}
            onChange={(e) => updateParam("q", e.target.value)}
            placeholder="Search order number or customer"
            className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <select
          value={status}
          onChange={(e) => updateParam("status", e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s === "ALL" ? "All statuses" : s.replaceAll("_", " ")}
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

      <p className="text-sm text-slate-500 mb-2">{filtered.length} orders found</p>

      <DataTable
        columns={columns}
        rows={pageRows}
        rowKey={(o) => o.id}
        onRowClick={(o) => navigate(`/admin/orders/${o.id}`)}
      />

      <Pagination
        page={page}
        totalPages={totalPages}
        onChange={(p) => updateParam("page", String(p))}
      />
    </div>
  );
}
