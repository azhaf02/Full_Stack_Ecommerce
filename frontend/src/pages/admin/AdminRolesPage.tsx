import { useState } from "react";
import DataTable from "../../components/admin/DataTable";
import type { Column } from "../../components/admin/DataTable";
import StatusBadge from "../../components/admin/StatusBadge";
import Modal from "../../components/admin/Modal";
import { users, CURRENT_ADMIN_ID } from "../../mocks/adminMock";

type User = (typeof users)[number];

interface RoleChange {
  user: string;
  from: string;
  to: string;
  by: string;
  at: string;
}

export default function AdminRolesPage() {
  const [list, setList] = useState<User[]>(users);
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [confirming, setConfirming] = useState<User | null>(null);
  const [log, setLog] = useState<RoleChange[]>([]); // later: Faeeza's audit_logs via log_action()

  const adminCount = list.filter((u) => u.role === "ADMIN").length;
  const filtered = roleFilter === "ALL" ? list : list.filter((u) => u.role === roleFilter);

  // Why a user's role can't be changed (null = it can)
  const blockReason = (u: User): string | null => {
    if (u.id === CURRENT_ADMIN_ID) return "You can't change your own role";
    if (u.role === "ADMIN" && adminCount <= 1) return "At least one admin must remain";
    return null;
  };

  const changeRole = (u: User) => {
    const newRole = u.role === "ADMIN" ? "CUSTOMER" : "ADMIN";
    setList(list.map((x) => (x.id === u.id ? { ...x, role: newRole } : x)));
    setLog([
      { user: u.name, from: u.role, to: newRole, by: "You", at: new Date().toLocaleString("en-IN") },
      ...log,
    ]);
    setConfirming(null);
  };

  const columns: Column<User>[] = [
    {
      key: "name",
      label: "Name",
      render: (u) => (
        <span className="font-medium text-slate-800">
          {u.name} {u.id === CURRENT_ADMIN_ID && <span className="text-xs text-slate-400">(you)</span>}
        </span>
      ),
    },
    { key: "email", label: "Email" },
    { key: "role", label: "Role", render: (u) => <StatusBadge status={u.role} /> },
    {
      key: "id",
      label: "Actions",
      render: (u) => {
        const reason = blockReason(u);
        return (
          <button
            onClick={() => setConfirming(u)}
            disabled={reason !== null}
            title={reason ?? ""}
            className="text-xs font-medium px-3 py-1 rounded-lg border border-primary-200 text-primary-600 hover:bg-primary-50 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent"
          >
            {u.role === "ADMIN" ? "Demote to customer" : "Promote to admin"}
          </button>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-cream-50 rounded-xl border shadow-sm p-6">
        <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
          <p className="text-sm text-slate-500">
            {adminCount} admin{adminCount !== 1 && "s"} · {list.length - adminCount} customers
          </p>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            <option value="ALL">All users</option>
            <option value="ADMIN">Admins</option>
            <option value="CUSTOMER">Customers</option>
          </select>
        </div>

        <DataTable columns={columns} rows={filtered} rowKey={(u) => u.id} />
      </div>

      {/* Role change log */}
      <div className="bg-cream-50 rounded-xl border shadow-sm p-6">
        <h3 className="font-semibold text-slate-800 mb-4">Recent role changes</h3>
        {log.length === 0 ? (
          <p className="text-sm text-slate-500">No role changes yet.</p>
        ) : (
          <ul className="divide-y text-sm">
            {log.map((entry, i) => (
              <li key={i} className="py-2 flex flex-wrap gap-2 items-center">
                <span className="font-medium">{entry.user}</span>
                <StatusBadge status={entry.from} /> → <StatusBadge status={entry.to} />
                <span className="text-slate-500 text-xs">by {entry.by} · {entry.at}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Confirm popup */}
      {confirming && (
        <Modal
          title={confirming.role === "ADMIN" ? "Demote to customer?" : "Promote to admin?"}
          onClose={() => setConfirming(null)}
        >
          <p className="text-sm text-slate-600">
            {confirming.role === "ADMIN"
              ? `${confirming.name} will lose access to the admin panel.`
              : `${confirming.name} will get full access to the admin panel.`}
          </p>
          <div className="flex justify-end gap-3 mt-6">
            <button onClick={() => setConfirming(null)} className="px-4 py-2 text-sm border rounded-lg hover:bg-cream-100">
              Cancel
            </button>
            <button
              onClick={() => changeRole(confirming)}
              className="px-4 py-2 text-sm text-white rounded-lg bg-primary-600 hover:bg-primary-700"
            >
              Confirm
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
