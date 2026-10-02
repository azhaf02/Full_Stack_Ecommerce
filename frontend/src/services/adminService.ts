import axios from "axios";
import { API_BASE_URL, getSession, logout } from "./authService";

// One axios instance for every admin API call
const api = axios.create({ baseURL: API_BASE_URL });

// Send the logged-in admin's token with each request
api.interceptors.request.use((config) => {
  const session = getSession();
  if (session) config.headers.Authorization = `Bearer ${session.token}`;
  return config;
});

// 401 means the token is missing, invalid or expired: log out and go back to the login page
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      logout();
      window.location.assign("/admin/login");
    }
    return Promise.reject(error);
  }
);

export interface DashboardKpis {
  totalRevenue: number;
  ordersToday: number;
  pendingOrders: number;
  lowStockCount: number;
}

// Asks the backend for the four dashboard numbers
export async function getDashboardSummary(): Promise<DashboardKpis> {
  const response = await api.get("/api/admin/dashboard-summary");
  return response.data.kpis;
}


export interface Customer {
  id: number;
  name: string;
  email: string;
  status: string; // "active" or "inactive"
  createdAt: string | null;
}

// Customer list, optionally filtered by a name or email search
export async function getCustomers(q: string): Promise<Customer[]> {
  const response = await api.get("/api/admin/customers", { params: { q } });
  return response.data.items;
}

// Activates or deactivates one customer and returns the updated customer
export async function updateCustomerStatus(id: number, status: "active" | "inactive"): Promise<Customer> {
  const response = await api.put(`/api/admin/customers/${id}/status`, { status });
  return response.data;
}
