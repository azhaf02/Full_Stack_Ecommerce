import axios from 'axios';
import type { Order, PlaceOrderInput } from '../types/order';

// Same key and backend URL as the auth module (services/apiClient.ts in the authentication branch). Once
// that file is on main, replace this client with `import apiClient from './apiClient'`.
const TOKEN_KEY = 'viora_token';

const client = axios.create({
  baseURL: 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' },
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/** One readable sentence from a FastAPI error. */
export function getOrderErrorMessage(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (axios.isAxiosError(err)) {
    if (!err.response) return 'Cannot reach the server. Make sure the backend is running.';
    if (err.response.status === 401) return 'Please log in to see your orders.';
    const detail = err.response.data?.detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail) && detail.length > 0) {
      const first = detail[0];
      const field = Array.isArray(first.loc) ? first.loc[first.loc.length - 1] : '';
      const msg = String(first.msg ?? '');
      return field ? `${field}: ${msg}` : msg;
    }
  }
  return fallback;
}

export const orderService = {
  place: (input: PlaceOrderInput) => client.post<Order>('/api/orders', input).then((r) => r.data),

  get: (orderId: number) => client.get<Order>(`/api/account/orders/${orderId}`).then((r) => r.data),

  cancel: (orderId: number, reason?: string) =>
    client.post<Order>(`/api/account/orders/${orderId}/cancel`, { reason }).then((r) => r.data),
};
