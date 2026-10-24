
import { useCallback, useEffect, useState } from "react";
import DataTable from "../../components/admin/DataTable";
import type { Column } from "../../components/admin/DataTable";
import StatusBadge from "../../components/admin/StatusBadge";
import LoadingRows from "../../components/admin/LoadingRows";
import Modal from "../../components/admin/Modal";
import {
  getAdminRoleUsers,
  updateAdminUserRole,
  type AdminRoleUser,
} from "../../services/adminService";

interface RoleChange {
  user: string;
  from: string;
  to: string;
  by: string;
  at: string;
}

export default function AdminRolesPage() {
  const [list, setList] = useState<AdminRoleUser[]>([]);
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [confirming, setConfirming] = useState<AdminRoleUser | null>(null);
  const [log, setLog] = useState<RoleChange[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const users = await getAdminRoleUsers();
      setList(users);
    } catch (err: unknown) {
      const apiError = err as {
        response?: { data?: { detail?: string } };
        message?: string;
      };

      setError(
        apiError.response?.data?.detail ||
          apiError.message ||
          "Unable to load users."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const adminCount = list.filter((user) => user.role === "ADMIN").length;

  const filtered =
    roleFilter === "ALL"
      ? list
      : list.filter((user) => user.role === roleFilter);

  const blockReason = (user: AdminRoleUser): string | null => {
    if (user.role === "ADMIN" && adminCount <= 1) {
      return "At least one admin must remain";
    }

    return null;
  };

  const changeRole = async (user: AdminRoleUser) => {
    const newRole = user.role === "ADMIN" ? "customer" : "admin";

    setSaving(true);
    setError("");
    setNotice("");

    try {
      const updatedUser = await updateAdminUserRole(user.id, newRole);

      setList((current) =>
        current.map((item) =>
          item.id === updatedUser.id ? updatedUser : item
        )
      );

      setLog((current) => [
        {
          user: updatedUser.name,
          from: user.role,
          to: updatedUser.role,
          by: "You",
          at: new Date().toLocaleString("en-IN"),
        },
        ...current,
      ]);

      setNotice(
        `${updatedUser.name}'s role was changed to ${updatedUser.role}.`
      );
      setConfirming(null);
    } catch (err: unknown) {
      const apiError = err as {
        response?: { data?: { detail?: string } };
        message?: string;
      };

      setError(
        apiError.response?.data?.detail ||
          apiError.message ||
          "Failed to update the user's role."
      );
    } finally {
      setSaving(false);
    }
  };

  const columns: Column<AdminRoleUser>[] = [
    {
      key: "name",
      label: "Name",
      render: (user) => (
        <span className="font-medium text-slate-800">
          {user.name}
        </span>
      ),
    },
    {
      key: "email",
      label: "Email",
    },
    {
      key: "role",
      label: "Role",
      render: (user) => <StatusBadge status={user.role} />,
    },
    {
      key: "status",
      label: "Status",
      render: (user) => <StatusBadge status={user.status} />,
    },
    {
      key: "id",
      label: "Actions",
      render: (user) => {
        const reason = blockReason(user);

        return (
          <button
            type="button"
            onClick={() => {
              setError("");
              setNotice("");
              setConfirming(user);
            }}
            disabled={reason !== null || saving}
            title={reason ?? ""}
            className="text-xs font-medium px-3 py-1 rounded-lg border border-primary-200 text-primary-600 hover:bg-primary-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {user.role === "ADMIN"
              ? "Demote to customer"
              : "Promote to admin"}
          </button>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="admin-card p-6">
        <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              User Roles & Access
            </h2>

            <p className="text-sm text-slate-500 mt-1">
              {adminCount} admin{adminCount !== 1 ? "s" : ""} ·{" "}
              {list.length - adminCount} customers
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value)}
              className="border rounded-lg px-3 py-2 text-sm bg-white"
              aria-label="Filter users by role"
            >
              <option value="ALL">All users</option>
              <option value="ADMIN">Admins</option>
              <option value="CUSTOMER">Customers</option>
            </select>

            <button
              type="button"
              onClick={() => void loadUsers()}
              disabled={loading || saving}
              className="px-3 py-2 text-sm border rounded-lg hover:bg-cream-100 disabled:opacity-50"
            >
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {notice && (
          <div
            role="status"
            className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700"
          >
            {notice}
          </div>
        )}

        {loading ? (
          <LoadingRows />
        ) : list.length === 0 && !error ? (
          <p className="py-8 text-center text-sm text-slate-500">
            No users found.
          </p>
        ) : (
          <DataTable
            columns={columns}
            rows={filtered}
            rowKey={(user) => user.id}
          />
        )}
      </div>

      <div className="admin-card p-6">
        <h3 className="font-semibold text-slate-800 mb-2">
          Recent role changes
        </h3>

        <p className="text-xs text-slate-500 mb-4">
          Changes made during this page session. Persistent audit records
          are handled by the backend.
        </p>

        {log.length === 0 ? (
          <p className="text-sm text-slate-500">
            No role changes yet.
          </p>
        ) : (
          <ul className="divide-y text-sm">
            {log.map((entry, index) => (
              <li
                key={`${entry.user}-${entry.at}-${index}`}
                className="py-3 flex flex-wrap gap-2 items-center"
              >
                <span className="font-medium">{entry.user}</span>
                <StatusBadge status={entry.from} />
                <span>→</span>
                <StatusBadge status={entry.to} />
                <span className="text-slate-500 text-xs">
                  by {entry.by} · {entry.at}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {confirming && (
        <Modal
          title={
            confirming.role === "ADMIN"
              ? "Demote to customer?"
              : "Promote to admin?"
          }
          onClose={() => {
            if (!saving) {
              setConfirming(null);
            }
          }}
        >
          <p className="text-sm text-slate-600">
            {confirming.role === "ADMIN"
              ? `${confirming.name} will lose access to the admin panel.`
              : `${confirming.name} will receive admin access.`}
          </p>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={() => setConfirming(null)}
              disabled={saving}
              className="px-4 py-2 text-sm border rounded-lg hover:bg-cream-100 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={() => void changeRole(confirming)}
              disabled={saving}
              className="px-4 py-2 text-sm text-white rounded-lg bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
            >
              {saving ? "Updating..." : "Confirm"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}