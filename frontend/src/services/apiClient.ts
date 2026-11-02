import axios from 'axios';

export const TOKEN_KEY = 'viora_token';

// Backend URL
export const API_BASE_URL = 'http://127.0.0.1:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to every request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY) || localStorage.getItem('access_token') || localStorage.getItem('token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Display actual API errors
export function getErrorMessage(
  err: unknown,
  fallback = 'Something went wrong. Please try again.'
): string {
  if (axios.isAxiosError(err)) {
    // Request did not receive a response
    if (!err.response) {
      return `Connection error: ${err.message}. Check backend URL and CORS settings.`;
    }

    const status = err.response.status;
    const detail = err.response.data?.detail;

    // FastAPI string error
    if (typeof detail === 'string') {
      return `Error ${status}: ${detail}`;
    }

    // FastAPI validation errors
    if (Array.isArray(detail) && detail.length > 0) {
      const first = detail[0];

      const field = Array.isArray(first.loc)
        ? first.loc[first.loc.length - 1]
        : '';

      const message = String(first.msg ?? '').replace(
        /^Value error, /,
        ''
      );

      return `Error ${status}: ${field ? `${field}: ` : ''}${message}`;
    }

    // Other server errors
    const responseData = err.response.data;

    if (typeof responseData === 'string') {
      return `Server error ${status}: ${responseData}`;
    }

    return `Server error ${status}: ${JSON.stringify(responseData)}`;
  }

  if (err instanceof Error) {
    return err.message;
  }

  return fallback;
}

export default apiClient;