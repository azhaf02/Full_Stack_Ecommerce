import type { AxiosResponse } from "axios";

export function fetchAuditLogs(
  token: string,
  filters?: {
    actor?: string;
    action?: string;
    dateFrom?: string;
    dateTo?: string;
  }
): Promise<AxiosResponse<any>>;

export function fetchAnalyticsSummary(
  token: string
): Promise<AxiosResponse<any>>;

export function fetchAnalyticsCharts(
  token: string
): Promise<AxiosResponse<any>>;
