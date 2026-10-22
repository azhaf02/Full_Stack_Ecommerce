import axios from 'axios';

export const TOKEN_KEY = 'viora_token';

// Same backend URL as src/api.js
const apiClient = axios.create({
  baseURL: 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' },
});

// Attach the JWT to every request when the user is logged in
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Turns FastAPI errors into one readable sentence for the UI
export function getErrorMessage(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (axios.isAxiosError(err)) {
    if (!err.response) return 'Cannot reach the server. Make sure the backend is running.';
    const detail = err.response.data?.detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail) && detail.length > 0) {
      const first = detail[0];
      const field = Array.isArray(first.loc) ? first.loc[first.loc.length - 1] : '';
      const msg = String(first.msg ?? '').replace(/^Value error, /, '');
      return field ? `${field}: ${msg}` : msg;
    }
  }
  return fallback;
}

export default apiClient;
