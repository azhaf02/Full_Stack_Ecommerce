
import { useCallback, useEffect, useState } from "react";
import { fetchAuditLogs } from "../../api";
import { getSession } from "../../services/authService";

interface AuditLog {
  id: number;
  actor_id: number | null;
  action: string;
  entity_type: string;
  entity_id: number | null;
  details: string | null;
  timestamp: string;
}

export default function AuditLogsPage() {
  const session = getSession();
  const token = session?.token;

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [actor, setActor] = useState("");
  const [action, setAction] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [appliedFilters, setAppliedFilters] = useState({
    actor: "",
    action: "",
    dateFrom: "",
    dateTo: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadLogs = useCallback(async () => {
    if (!token) {
      setLogs([]);
      setError("Your session has expired. Please sign in again.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetchAuditLogs(token, {
        actor: appliedFilters.actor,
        action: appliedFilters.action,
        dateFrom: appliedFilters.dateFrom
          ? new Date(appliedFilters.dateFrom).toISOString()
          : "",
        dateTo: appliedFilters.dateTo
          ? new Date(appliedFilters.dateTo).toISOString()
          : "",
      });

      setLogs(Array.isArray(response.data) ? response.data : []);
    } catch (err: unknown) {
      setLogs([]);

      const message =
        typeof err === "object" &&
        err !== null &&
        "response" in err
          ? (
              err as {
                response?: { data?: { detail?: string } };
              }
            ).response?.data?.detail
          : undefined;

      setError(
        typeof message === "string"
          ? message
          : "Unable to load audit logs. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [token, appliedFilters]);

  useEffect(() => {
    void loadLogs();
  }, [loadLogs]);

  const applyFilters = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setAppliedFilters({
      actor: actor.trim(),
      action: action.trim(),
      dateFrom,
      dateTo,
    });
  };

  const clearFilters = () => {
    setActor("");
    setAction("");
    setDateFrom("");
    setDateTo("");

    setAppliedFilters({
      actor: "",
      action: "",
      dateFrom: "",
      dateTo: "",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">
          Audit Logs
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Review recorded administrative and system activities.
        </p>
      </div>

      <section className="rounded-xl border bg-cream-50 p-5 shadow-sm">
        <h2 className="mb-4 font-semibold text-slate-800">
          Filter records
        </h2>

        <form
          onSubmit={applyFilters}
          className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4"
        >
          <label className="text-sm text-slate-600">
            Actor ID
            <input
              type="number"
              min="1"
              value={actor}
              onChange={(event) => setActor(event.target.value)}
              placeholder="Enter actor ID"
              className="mt-1 w-full rounded-lg border bg-white px-3 py-2"
            />
          </label>

          <label className="text-sm text-slate-600">
            Action
            <input
              type="text"
              value={action}
              onChange={(event) => setAction(event.target.value)}
              placeholder="e.g. CREATE, UPDATE"
              className="mt-1 w-full rounded-lg border bg-white px-3 py-2"
            />
          </label>

          <label className="text-sm text-slate-600">
            From
            <input
              type="datetime-local"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
              className="mt-1 w-full rounded-lg border bg-white px-3 py-2"
            />
          </label>

          <label className="text-sm text-slate-600">
            To
            <input
              type="datetime-local"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
              className="mt-1 w-full rounded-lg border bg-white px-3 py-2"
            />
          </label>

          <div className="flex flex-wrap gap-3 md:col-span-2 xl:col-span-4">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
            >
              Apply filters
            </button>

            <button
              type="button"
              onClick={clearFilters}
              disabled={loading}
              className="rounded-lg border px-4 py-2 text-sm hover:bg-cream-100 disabled:opacity-50"
            >
              Clear filters
            </button>

            <button
              type="button"
              onClick={() => void loadLogs()}
              disabled={loading}
              className="rounded-lg border px-4 py-2 text-sm hover:bg-cream-100 disabled:opacity-50"
            >
              Refresh
            </button>
          </div>
        </form>
      </section>

      <section className="overflow-hidden rounded-xl border bg-cream-50 shadow-sm">
        <div className="flex items-center justify-between border-b p-5">
          <h2 className="font-semibold text-slate-800">
            Activity history
          </h2>

          <span className="text-sm text-slate-500">
            {logs.length} record{logs.length === 1 ? "" : "s"}
          </span>
        </div>

        {error && (
          <div
            role="alert"
            className="m-4 rounded-lg bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        {loading ? (
          <p className="p-6 text-sm text-slate-500">
            Loading audit logs...
          </p>
        ) : logs.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">
            {error
              ? "Audit records could not be displayed."
              : "No audit records found."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-cream-100 text-slate-600">
                <tr>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Actor ID</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Entity</th>
                  <th className="px-4 py-3">Entity ID</th>
                  <th className="px-4 py-3">Details</th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    className="align-top hover:bg-cream-100"
                  >
                    <td className="whitespace-nowrap px-4 py-3">
                      {new Date(log.timestamp).toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3">
                      {log.actor_id ?? "System"}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {log.action}
                    </td>
                    <td className="px-4 py-3">
                      {log.entity_type}
                    </td>
                    <td className="px-4 py-3">
                      {log.entity_id ?? "—"}
                    </td>
                    <td className="max-w-sm whitespace-pre-wrap break-words px-4 py-3">
                      {log.details ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
