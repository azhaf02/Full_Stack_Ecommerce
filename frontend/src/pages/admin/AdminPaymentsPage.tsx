import { useState } from "react";
import { Link } from "react-router-dom";
import DataTable from "../../components/admin/DataTable";
import type { Column } from "../../components/admin/DataTable";
import StatusBadge from "../../components/admin/StatusBadge";
import { payments } from "../../mocks/adminMock";
import { formatINR } from "../../utils/format";

type Payment = (typeof payments)[number];

const TABS = ["ALL", "SUCCESS", "PENDING", "FAILED", "REFUND_PENDING", "REFUNDED"];

const columns: Column<Payment>[] = [
  { key: "id", label: "Payment ID" },
  {
    key: "orderNumber",
    label: "Order",
    render: (p) => (
      <Link to={`/admin/orders/${p.orderId}`} className="text-primary-600 hover:underline">
        {p.orderNumber}
      </Link>
    ),
  },
  { key: "customer", label: "Customer" },
  { key: "method", label: "Method" },
  { key: "amount", label: "Amount", render: (p) => formatINR(p.amount) },
  { key: "date", label: "Date" },
  { key: "status", label: "Status", render: (p) => <StatusBadge status={p.status} /> },
];

export default function AdminPaymentsPage() {
  const [tab, setTab] = useState("ALL");

  const countOf = (status: string) =>
    status === "ALL" ? payments.length : payments.filter((p) => p.status === status).length;

  const filtered = tab === "ALL" ? payments : payments.filter((p) => p.status === tab);

  const collected = payments
    .filter((p) => p.status === "SUCCESS")
    .reduce((sum, p) => sum + p.amount, 0);
  const pendingCod = payments
    .filter((p) => p.method === "COD" && p.status === "PENDING")
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      {/* Summary */}
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
        <div className="flex flex-wrap gap-2 mb-6 border-b pb-4">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                tab === t ? "bg-primary-600 text-white" : "text-slate-600 hover:bg-cream-200"
              }`}
            >
              {t === "ALL" ? "All" : t.replaceAll("_", " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase())}
              <span className="ml-1.5 text-xs opacity-75">({countOf(t)})</span>
            </button>
          ))}
        </div>

        <DataTable columns={columns} rows={filtered} rowKey={(p) => p.id} />
      </div>
    </div>
  );
}
