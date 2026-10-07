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

export interface Category {
  id: number;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CategoryCreateData {
  name: string;
  description: string | null;
}

export interface CategoryUpdateData {
  name?: string;
  description?: string | null;
}

export async function getCategories(
  includeInactive = false
): Promise<Category[]> {
  const response = await api.get("/api/admin/categories/", {
    params: { include_inactive: includeInactive },
  });
  return response.data;
}

export async function createCategory(
  data: CategoryCreateData
): Promise<Category> {
  const response = await api.post("/api/admin/categories/", data);
  return response.data;
}

export async function updateCategory(
  categoryId: number,
  data: CategoryUpdateData
): Promise<Category> {
  const response = await api.put(
    `/api/admin/categories/${categoryId}`,
    data
  );
  return response.data;
}

export async function deactivateCategory(
  categoryId: number
): Promise<Category> {
  const response = await api.delete(
    `/api/admin/categories/${categoryId}`
  );
  return response.data;
}


export interface CustomerOrder {
  id: number;
  orderNumber: string;
  status: string;
  totalAmount: number;
  createdAt: string;
}

export interface CustomerDetail extends Customer {
  ordersCount: number;
  totalSpent: number;
  recentOrders: CustomerOrder[];
}

// One customer's profile with their order summary
export async function getCustomer(id: number): Promise<CustomerDetail> {
  const response = await api.get(`/api/admin/customers/${id}`);
  return response.data;
}


export interface AdminOrder {
  id: number;
  orderNumber: string;
  customerName: string;
  status: string;
  paymentMethod: string;
  totalAmount: number;
  createdAt: string;
}

export interface AdminOrderList {
  items: AdminOrder[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface OrderFilters {
  q?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

// Order list for admins with search, status/date filters and pagination
export async function getOrders(filters: OrderFilters): Promise<AdminOrderList> {
  const response = await api.get("/api/admin/orders", {
    params: {
      q: filters.q || undefined,
      status: filters.status || undefined,
      date_from: filters.dateFrom || undefined,
      date_to: filters.dateTo || undefined,
      page: filters.page ?? 1,
      page_size: filters.pageSize ?? 10,
    },
  });
  return response.data;
}


// Shapes returned by the analytics API (GET /api/admin/analytics/...)
export interface AnalyticsSummary {
  total_orders: number;
  total_sales: number;
  total_customers: number;
  total_products: number;
  pending_orders: number;
  completed_orders: number;
  cancelled_orders: number;
  pending_payments: number;
  low_stock_count: number;
}

export interface AnalyticsCharts {
  sales_over_time: { date: string; sales: number }[];
  orders_over_time: { date: string; orders: number }[];
  top_products: { product_id: number; product_name: string; quantity: number }[];
  top_categories: { category_id: number; category_name: string; quantity: number }[];
  revenue_by_category: { category_id: number; category_name: string; revenue: number }[];
  order_status_distribution: { status: string; orders: number }[];
}

// KPI numbers shared with the Analytics page
export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  const response = await api.get("/api/admin/analytics/summary");
  return response.data;
}

// Chart data shared with the Analytics page
export async function getAnalyticsCharts(): Promise<AnalyticsCharts> {
  const response = await api.get("/api/admin/analytics/charts");
  return response.data;
}
