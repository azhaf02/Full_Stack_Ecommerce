import { useState } from "react";
import { Search } from "lucide-react";
import DataTable from "../../components/admin/DataTable";
import type { Column } from "../../components/admin/DataTable";
import StatusBadge from "../../components/admin/StatusBadge";
import Modal from "../../components/admin/Modal";
import { customers, orders } from "../../mocks/adminMock";
import { formatINR } from "../../utils/format";

type Customer = (typeof customers)[number];

export default function AdminCustomersPage() {
  const [list, setList] = useState<Customer[]>(customers);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selected, setSelected] = useState<Customer | null>(null);   // detail popup
  const [confirming, setConfirming] = useState<Customer | null>(null); // confirm popup

  const ordersOf = (c: Customer) => orders.filter((o) => o.customer === c.name);

  const filtered = list.filter((c) => {
    if (statusFilter !== "ALL" && c.status !== statusFilter) return false;
    const text = `${c.name} ${c.email}`.toLowerCase();
    return text.includes(q.toLowerCase());
  });

  const toggleStatus = (c: Customer) => {
    setList(
      list.map((x) =>
        x.id === c.id ? { ...x, status: x.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" } : x
      )
    );
    setConfirming(null);
  };

  const columns: Column<Customer>[] = [
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Orders", render: (c) => ordersOf(c).length },
    { key: "joined", label: "Joined" },
    { key: "status", label: "Status", render: (c) => <StatusBadge status={c.status} /> },
    {
      key: "id",
      label: "Actions",
      render: (c) => (
        <button
          onClick={(e) => {
            e.stopPropagation(); // don't open the detail popup
            setConfirming(c);
          }}
          className={`text-xs font-medium px-3 py-1 rounded-lg border ${
            c.status === "ACTIVE"
              ? "text-red-600 border-red-200 hover:bg-red-50"
              : "text-green-600 border-green-200 hover:bg-green-50"
          }`}
        >
          {c.status === "ACTIVE" ? "Deactivate" : "Activate"}
        </button>
      ),
    },
  ];

  return (
    <div className="bg-cream-50 rounded-xl border shadow-sm p-6">
      {/* Filter bar */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-52">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name or email"
            className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm"
        >
          <option value="ALL">All customers</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      <p className="text-sm text-slate-500 mb-2">{filtered.length} customers</p>

      <DataTable columns={columns} rows={filtered} rowKey={(c) => c.id} onRowClick={setSelected} />

      {/* Detail popup */}
      {selected && (
        <Modal title={selected.name} onClose={() => setSelected(null)}>
          <div className="space-y-1 text-sm">
            <p className="text-slate-600">{selected.email}</p>
            <p className="text-slate-600">{selected.phone}</p>
            <p className="text-slate-500">Joined {selected.joined}</p>
            <div className="pt-1"><StatusBadge status={selected.status} /></div>
          </div>

          <h4 className="font-semibold text-slate-800 mt-6 mb-2 text-sm">Orders</h4>
          {ordersOf(selected).length === 0 ? (
            <p className="text-sm text-slate-500">No orders yet.</p>
          ) : (
            <ul className="divide-y text-sm">
              {ordersOf(selected).map((o) => (
                <li key={o.id} className="py-2 flex justify-between items-center">
                  <span>{o.orderNumber}</span>
                  <span>{formatINR(o.total)}</span>
                  <StatusBadge status={o.status} />
                </li>
              ))}
            </ul>
          )}
        </Modal>
      )}

      {/* Confirm popup */}
      {confirming && (
        <Modal
          title={confirming.status === "ACTIVE" ? "Deactivate customer?" : "Activate customer?"}
          onClose={() => setConfirming(null)}
        >
          <p className="text-sm text-slate-600">
            {confirming.status === "ACTIVE"
              ? `${confirming.name} will not be able to log in until reactivated.`
              : `${confirming.name} will be able to log in again.`}
          </p>
          <div className="flex justify-end gap-3 mt-6">
            <button onClick={() => setConfirming(null)} className="px-4 py-2 text-sm border rounded-lg hover:bg-cream-100">
              Cancel
            </button>
            <button
              onClick={() => toggleStatus(confirming)}
              className={`px-4 py-2 text-sm text-white rounded-lg ${
                confirming.status === "ACTIVE" ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {confirming.status === "ACTIVE" ? "Deactivate" : "Activate"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
