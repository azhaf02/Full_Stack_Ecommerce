import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem("viora_token") ||
      localStorage.getItem("access_token") ||
      localStorage.getItem("token") ||
      localStorage.getItem("authToken");

    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

export const fetchUnreadCount = (userId: number | string) =>
  api.get(`/api/notifications/user/${userId}/unread-count`);

export const fetchNotifications = (userId: number | string) =>
  api.get(`/api/notifications/user/${userId}`);

export const markNotificationRead = (notificationId: number | string) =>
  api.patch(`/api/notifications/${notificationId}/read`);

export const markAllNotificationsRead = (userId: number | string) =>
  api.patch(`/api/notifications/user/${userId}/read-all`);

export const submitProductReview = (reviewData: unknown) =>
  api.post("/api/v1/reviews/api/reviews/", reviewData);

export default api;

// Admin Analytics
export const fetchAnalyticsSummary = (token?: string) =>
  api.get("/api/admin/analytics/summary", {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

export const fetchAnalyticsCharts = (token?: string) =>
  api.get("/api/admin/analytics/charts", {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
