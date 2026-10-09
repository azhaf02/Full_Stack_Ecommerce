import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatically attach login token
api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem('access_token') ||
      localStorage.getItem('token') ||
      localStorage.getItem('authToken');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Notifications
export const fetchUnreadCount = (userId) =>
  api.get(
    `/api/notifications/user/${userId}/unread-count`
  );

export const fetchNotifications = (userId) =>
  api.get(
    `/api/notifications/user/${userId}`
  );

export const markNotificationRead = (
  notificationId
) =>
  api.patch(
    `/api/notifications/${notificationId}/read`
  );

export const markAllNotificationsRead = (
  userId
) =>
  api.patch(
    `/api/notifications/user/${userId}/read-all`
  );

// Reviews
export const submitProductReview = (
  reviewData
) =>
  api.post(
    '/api/v1/reviews/api/reviews/',
    reviewData
  );

export default api;