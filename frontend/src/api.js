import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Notifications
export const fetchUnreadCount = (userId) => 
  api.get(`/api/notifications/user/${userId}/unread-count`);

export const fetchNotifications = (userId) => 
  api.get(`/api/notifications/user/${userId}`);

export const markNotificationRead = (notificationId) => 
  api.patch(`/api/notifications/${notificationId}/read`);

export const markAllNotificationsRead = (userId) => 
  api.patch(`/api/notifications/user/${userId}/read-all`);

// Reviews (matching your backend Swagger route exactly)
export const submitProductReview = (reviewData) => 
  api.post('/api/v1/reviews/api/reviews/', reviewData);

export default api;
export const fetchAnalyticsSummary = async () => {
  return {
    totalRevenue: 0,
    totalOrders: 0,
    activeUsers: 0,
    conversionRate: 0,
  };
};

export const fetchAnalyticsCharts = async () => {
  return {
    revenueTimeline: [],
    categoryBreakdown: [],
  };
};