import { useEffect, useState } from "react";
import axios from "axios";
import { Search } from "lucide-react";
import DataTable from "../../components/admin/DataTable";
import type { Column } from "../../components/admin/DataTable";
import StatusBadge from "../../components/admin/StatusBadge";
import Modal from "../../components/admin/Modal";
import { getCustomer, getCustomers, updateCustomerStatus } from "../../services/adminService";
import type { Customer, CustomerDetail } from "../../services/adminService";
import { formatINR } from "../../utils/format";

const formatDate = (value: string | null) =>
  value
    ? new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    : "-";

export default function AdminCustomersPage() {
  const [list, setList] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0); // changing this loads the list again

  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selected, setSelected] = useState<Customer | null>(null);     // detail popup
  const [confirming, setConfirming] = useState<Customer | null>(null); // confirm popup
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState("");
  const [detail, setDetail] = useState<CustomerDetail | null>(null); // order summary for the popup
  const [detailError, setDetailError] = useState("");

  // Load the order summary from GET /api/admin/customers/{id} when a popup opens
  useEffect(() => {
    if (!selected) return;
    let cancelled = false;
    setDetail(null);
    setDetailError("");

    getCustomer(selected.id)
      .then((data) => {
        if (!cancelled) setDetail(data);
      })
      .catch(() => {
        if (!cancelled) setDetailError("Could not load the order summary.");
      });

    return () => {
      cancelled = true;
    };
  }, [selected]);


  // Load customers from GET /api/admin/customers.
  // Waits 400 ms after the last key press, so we don't call the API on every letter.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    const timer = setTimeout(() => {
      getCustomers(q)
        .then((items) => {
          if (!cancelled) setList(items);
        })
        .catch(() => {
          if (!cancelled) setError("Could not load customers. Check that the backend is running.");
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [q, reloadKey]);

  const filtered = list.filter((c) => statusFilter === "ALL" || c.status === statusFilter);

  // Calls PUT /api/admin/customers/{id}/status
  const toggleStatus = async (c: Customer) => {
    setSaving(true);
    setActionError("");
    try {
      const updated = await updateCustomerStatus(c.id, c.status === "active" ? "inactive" : "active");
      setList((current) => current.map((x) => (x.id === updated.id ? updated : x)));
      setConfirming(null);
    } catch (err) {
      const detail = axios.isAxiosError(err) ? err.response?.data?.detail : null;
      setActionError(typeof detail === "string" ? detail : "Could not update the customer. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const openConfirm = (c: Customer) => {
    setActionError("");
    setConfirming(c);
  };

  const columns: Column<Customer>[] = [
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "createdAt", label: "Joined", render: (c) => formatDate(c.createdAt) },
    { key: "status", label: "Status", render: (c) => <StatusBadge status={c.status.toUpperCase()} /> },
    {
      key: "id",
      label: "Actions",
      render: (c) => (
        <button
          onClick={(e) => {
            e.stopPropagation(); // don't open the detail popup
            openConfirm(c);
          }}
          className={`text-xs font-medium px-3 py-1 rounded-lg border ${
            c.status === "active"
              ? "text-red-600 border-red-200 hover:bg-red-50"
              : "text-green-600 border-green-200 hover:bg-green-50"
          }`}
        >
          {c.status === "active" ? "Deactivate" : "Activate"}
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
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {loading && <p className="text-sm text-slate-500 py-8 text-center">Loading customers...</p>}

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
          <p className="text-sm text-slate-500 mb-2">{filtered.length} customers</p>
          <DataTable columns={columns} rows={filtered} rowKey={(c) => c.id} onRowClick={setSelected} />
        </>
      )}

           {/* Detail popup */}
      {selected && (
        <Modal title={selected.name} onClose={() => setSelected(null)}>
          <div className="space-y-1 text-sm">
            <p className="text-slate-600">{selected.email}</p>
            <p className="text-slate-500">Customer ID: {selected.id}</p>
            <p className="text-slate-500">Joined {formatDate(selected.createdAt)}</p>
            <div className="pt-1">
              <StatusBadge status={selected.status.toUpperCase()} />
            </div>
          </div>

          <h4 className="font-semibold text-slate-800 mt-6 mb-2 text-sm">Order summary</h4>

          {detailError && <p className="text-sm text-red-600">{detailError}</p>}
          {!detailError && !detail && <p className="text-sm text-slate-500">Loading orders...</p>}

          {detail && (
            <>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="border rounded-lg p-3">
                  <p className="text-slate-500">Orders</p>
                  <p className="text-lg font-semibold text-slate-800">{detail.ordersCount}</p>
                </div>
                <div className="border rounded-lg p-3">
                  <p className="text-slate-500">Total spent</p>
                  <p className="text-lg font-semibold text-slate-800">{formatINR(detail.totalSpent)}</p>
                </div>
              </div>

              {detail.recentOrders.length === 0 ? (
                <p className="text-sm text-slate-500 mt-3">No orders yet.</p>
              ) : (
                <ul className="divide-y text-sm mt-3">
                  {detail.recentOrders.map((o) => (
                    <li key={o.id} className="py-2 flex justify-between items-center gap-2">
                      <span>{o.orderNumber}</span>
                      <span>{formatINR(o.totalAmount)}</span>
                      <StatusBadge status={o.status} />
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </Modal>
      )}


      {/* Confirm popup */}
      {confirming && (
        <Modal
          title={confirming.status === "active" ? "Deactivate customer?" : "Activate customer?"}
          onClose={() => setConfirming(null)}
        >
          <p className="text-sm text-slate-600">
            {confirming.status === "active"
              ? `${confirming.name} will not be able to log in until reactivated.`
              : `${confirming.name} will be able to log in again.`}
          </p>

          {actionError && (
            <p role="alert" className="mt-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {actionError}
            </p>
          )}

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => setConfirming(null)}
              className="px-4 py-2 text-sm border rounded-lg hover:bg-cream-100"
            >
              Cancel
            </button>
            <button
              onClick={() => toggleStatus(confirming)}
              disabled={saving}
              className={`px-4 py-2 text-sm text-white rounded-lg disabled:opacity-60 ${
                confirming.status === "active" ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {saving ? "Saving..." : confirming.status === "active" ? "Deactivate" : "Activate"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
