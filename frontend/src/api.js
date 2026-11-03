import api from "./services/api";

export const fetchAuditLogs = (token, filters = {}) =>
  api.get("/api/admin/audit-logs", {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    params: {
      actor: filters.actor || undefined,
      action: filters.action || undefined,
      from: filters.dateFrom || undefined,
      to: filters.dateTo || undefined,
    },
  });
