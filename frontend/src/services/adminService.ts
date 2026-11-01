
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

// 401 means the token is missing, invalid or expired
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

// =========================================================
// DASHBOARD
// =========================================================

export interface DashboardKpis {
  totalRevenue: number;
  ordersToday: number;
  pendingOrders: number;
  lowStockCount: number;
}

export async function getDashboardSummary(): Promise<DashboardKpis> {
  const response = await api.get("/api/admin/dashboard-summary");
  return response.data.kpis;
}

// =========================================================
// CUSTOMERS
// =========================================================

export interface Customer {
  id: number;
  name: string;
  email: string;
  status: string;
  createdAt: string | null;
}

export async function getCustomers(q: string): Promise<Customer[]> {
  const response = await api.get("/api/admin/customers", { params: { q } });
  return response.data.items;
}

// Activates or deactivates one customer and returns the updated customer
export async function updateCustomerStatus(
  id: number,
  status: "active" | "inactive"
): Promise<Customer> {
  const response = await api.put(`/api/admin/customers/${id}/status`, {
    status,
  });
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

export async function getCustomer(id: number): Promise<CustomerDetail> {
  const response = await api.get(`/api/admin/customers/${id}`);
  return response.data;
}

// =========================================================
// CATEGORIES
// =========================================================

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
  is_active?: boolean; // true re-activates a deactivated category
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

// =========================================================
// ORDERS
// =========================================================

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
export async function getOrders(
  filters: OrderFilters
): Promise<AdminOrderList> {
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

export interface AdminOrderDetail {
  id: number;
  order_number: string;
  status: string;
  payment_method: string;
  payment_status: string;
  subtotal: string;
  discount_amount: string;
  tax_amount: string;
  shipping_cost: string;
  total_amount: string;
  created_at: string;
  items: {
    id: number;
    product_id: number;
    variant_id: number | null;
    quantity: number;
    unit_price: string;
  }[];
  status_history: {
    previous_status: string | null;
    new_status: string;
    changed_by: number | null;
    remarks: string | null;
    changed_at: string;
  }[];
  actions: { allowed_next_statuses: string[] | null } | null;
  // From the orders module's admin response; null if that row no longer exists
  user_id: number;
  customer: { id: number; name: string; email: string } | null;
  address: {
    id: number;
    full_name: string;
    phone: string;
    line1: string;
    line2: string | null;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  } | null;
}

export async function getOrder(
  id: number
): Promise<AdminOrderDetail> {
  const response = await api.get(`/api/admin/orders/${id}`);
  return response.data;
}

export async function updateOrderStatus(
  id: number,
  status: string,
  remarks: string
): Promise<AdminOrderDetail> {
  const response = await api.put(`/api/admin/orders/${id}/status`, {
    status,
    remarks: remarks.trim() || null,
  });
  return response.data;
}

// =========================================================
// RETURNS (APIs from the orders module)
// =========================================================

// One return request as returned by GET/PUT /api/admin/returns
export interface AdminReturn {
  id: number;
  order_id: number;
  reason: string;
  status: string; // REQUESTED, APPROVED, REJECTED, RETURNED, REFUND_PENDING, REFUNDED
  admin_remarks: string | null;
  reviewed_at: string | null;
  refund_amount: string | null; // money arrives as text, e.g. "599.00"
  requested_at: string;
  items: { order_item_id: number; quantity: number }[];
}

export type ReturnAction = "approve" | "reject" | "mark_returned" | "complete_refund";

// Return requests, newest first, optionally filtered by status
export async function getReturns(status: string, page: number, pageSize: number): Promise<AdminReturn[]> {
  const response = await api.get("/api/admin/returns", {
    params: { status: status || undefined, page, page_size: pageSize },
  });
  return response.data;
}

// Moves a return one step: approve/reject a request, mark the item received, or complete the refund
export async function reviewReturn(id: number, action: ReturnAction, remarks: string): Promise<AdminReturn> {
  const response = await api.put(`/api/admin/returns/${id}`, {
    action,
    remarks: remarks.trim() || null,
  });
  return response.data;
}

// =========================================================
// REVIEWS (APIs from the reviews module)
// =========================================================

// One review as returned by GET/PUT /api/admin/reviews
export interface AdminReview {
  id: number;
  productId: number;
  userId: number;
  orderId: number;
  rating: number; // 1 to 5
  title: string | null;
  comment: string;
  status: string; // PENDING, APPROVED, REJECTED
  createdAt: string | null;
}

export type ReviewStatus = "PENDING" | "APPROVED" | "REJECTED";

// Reviews, newest first, optionally filtered by status
export async function getReviews(status: string): Promise<AdminReview[]> {
  const response = await api.get("/api/admin/reviews", {
    params: { status: status || undefined },
  });
  return response.data;
}

// Approves or rejects one review
export async function updateReviewStatus(id: number, status: ReviewStatus): Promise<AdminReview> {
  const response = await api.put(`/api/admin/reviews/${id}/status`, { status });
  return response.data;
}

// Permanently deletes one review
export async function deleteReview(id: number): Promise<void> {
  await api.delete(`/api/admin/reviews/${id}`);
}

// =========================================================
// SUPPORT TICKETS + FAQ (APIs from the support module)
// =========================================================

// One ticket as returned by GET /api/support/admin/tickets
export interface SupportTicket {
  id: number;
  customer_id: number;
  order_id: number | null;
  category: string;
  subject: string;
  description: string;
  status: string; // Open, In Progress, Resolved, Closed
  created_at: string | null;
}

export interface SupportMessage {
  id: number;
  ticket_id: number;
  sender_type: string; // "Customer" or "Support"
  message: string;
  timestamp: string | null;
}

export const TICKET_STATUSES = ["Open", "In Progress", "Resolved", "Closed"];

export async function getSupportTickets(): Promise<SupportTicket[]> {
  const response = await api.get("/api/support/admin/tickets");
  return response.data;
}

// One ticket with its conversation
export async function getSupportTicket(id: number): Promise<{ ticket: SupportTicket; messages: SupportMessage[] }> {
  const response = await api.get(`/api/support/admin/tickets/${id}`);
  return response.data;
}

export async function replyToSupportTicket(id: number, message: string): Promise<void> {
  await api.post(`/api/support/admin/tickets/${id}/reply`, { message: message.trim() });
}

export async function updateSupportTicketStatus(id: number, status: string): Promise<void> {
  await api.put(`/api/support/admin/tickets/${id}/status`, { status });
}

export interface Faq {
  id: number;
  question: string;
  answer: string;
  sort_order: number;
}

export type FaqData = Omit<Faq, "id">;

export async function getFaqs(): Promise<Faq[]> {
  const response = await api.get("/api/support/admin/faq");
  return response.data;
}

export async function createFaq(data: FaqData): Promise<Faq> {
  const response = await api.post("/api/support/admin/faq", data);
  return response.data;
}

export async function updateFaq(id: number, data: FaqData): Promise<Faq> {
  const response = await api.put(`/api/support/admin/faq/${id}`, data);
  return response.data;
}

export async function deleteFaq(id: number): Promise<void> {
  await api.delete(`/api/support/admin/faq/${id}`);
}

// =========================================================
// PAYMENTS
// =========================================================

export interface AdminPayment {
  id: number;
  orderId: number;
  orderNumber: string;
  customerName: string;
  method: string;
  status: string;
  transactionId: string | null;
  amount: number;
  createdAt: string;
}

export interface AdminPaymentList {
  items: AdminPayment[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  collectedAmount: number;
  collectedCount: number; // number of paid orders behind collectedAmount
  // Unpaid orders read from the orders table (includes older orders with no payment row)
  awaitingPayment: Record<"COD" | "ONLINE", { count: number; amount: number }>;
  statusCounts: Record<string, number>;
}

export interface PaymentFilters {
  q?: string;
  status?: string;
  method?: string;
  page?: number;
  pageSize?: number;
}

// Payment records for admins with search, filters and pagination
export async function getPayments(
  filters: PaymentFilters
): Promise<AdminPaymentList> {
  const response = await api.get("/api/admin/payments", {
    params: {
      q: filters.q || undefined,
      status: filters.status || undefined,
      method: filters.method || undefined,
      page: filters.page ?? 1,
      page_size: filters.pageSize ?? 10,
    },
  });
  return response.data;
}

// =========================================================
// ADMIN COD: MARK AS PAID
// Aliya's endpoint
// =========================================================

export async function markCodPaymentAsPaid(
  paymentId: number
): Promise<void> {
  await api.post(
    `/api/payment/admin/cod/${paymentId}/mark-paid`
  );
}

// Finds the latest COD payment record of one order (the mark-paid API needs its id).
// Uses the admin payment list, searched by order number. Returns null if the order has none.
export async function getCodPaymentForOrder(
  orderId: number,
  orderNumber: string
): Promise<AdminPayment | null> {
  const data = await getPayments({ q: orderNumber, method: "COD", pageSize: 50 });
  const matches = data.items.filter((p) => p.orderId === orderId);
  return matches.length > 0 ? matches.reduce((a, b) => (a.id > b.id ? a : b)) : null;
}

// =========================================================
// ANALYTICS
// =========================================================

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
  top_products: {
    product_id: number;
    product_name: string;
    quantity: number;
  }[];
  top_categories: {
    category_id: number;
    category_name: string;
    quantity: number;
  }[];
  revenue_by_category: {
    category_id: number;
    category_name: string;
    revenue: number;
  }[];
  order_status_distribution: {
    status: string;
    orders: number;
  }[];
}

export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  const response = await api.get("/api/admin/analytics/summary");
  return response.data;
}

export async function getAnalyticsCharts(): Promise<AnalyticsCharts> {
  const response = await api.get("/api/admin/analytics/charts");
  return response.data;
}

// =========================================================
// ADMIN ROLES
// =========================================================

export interface AdminRoleUser {
  id: number;
  name: string;
  email: string;
  role: "ADMIN" | "CUSTOMER";
  status: string;
}

export async function getAdminRoleUsers(): Promise<AdminRoleUser[]> {
  const response = await api.get("/api/admin/users");
  return response.data;
}

export async function updateAdminUserRole(
  id: number,
  role: "admin" | "customer"
): Promise<AdminRoleUser> {
  const response = await api.put(`/api/admin/users/${id}/role`, {
    role,
  });
  return response.data;
}

// =========================================================
// PRODUCT CATALOG
// =========================================================

export interface Product {
  id: number;
  category_id: number;
  name: string;
  description: string | null;
  price: string;
  stock_quantity: number;
  status: "ACTIVE" | "INACTIVE";
  image_url?: string | null;
  images?: ProductImage[];
}

export interface ProductCreateData {
  category_id: number;
  name: string;
  description: string | null;
  price: number;
  stock_quantity: number;
  status: "ACTIVE" | "INACTIVE";
}

export interface ProductUpdateData {
  category_id?: number;
  name?: string;
  description?: string | null;
  price?: number;
  stock_quantity?: number;
  status?: "ACTIVE" | "INACTIVE";
}

export interface ProductImage {
  id: number;
  product_id: number;
  image_url: string;
  is_primary: boolean;
}

export async function getAdminProducts(params?: {
  search?: string;
  category_id?: number;
  status?: "ACTIVE" | "INACTIVE";
}): Promise<Product[]> {
  const response = await api.get("/api/admin/products/", { params });
  return response.data;
}

export async function createAdminProduct(
  data: ProductCreateData
): Promise<Product> {
  const response = await api.post("/api/admin/products/", data);
  return response.data;
}

export async function getAdminProduct(
  productId: number
): Promise<Product> {
  const response = await api.get(`/api/admin/products/${productId}`);
  return response.data;
}

export async function updateAdminProduct(
  productId: number,
  data: ProductUpdateData
): Promise<Product> {
  const response = await api.put(
    `/api/admin/products/${productId}`,
    data
  );
  return response.data;
}

export async function deactivateAdminProduct(
  productId: number
): Promise<Product> {
  const response = await api.delete(
    `/api/admin/products/${productId}`
  );
  return response.data;
}

export async function uploadProductImage(
  productId: number,
  file: File,
  isPrimary = false
): Promise<ProductImage> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post(
    `/api/admin/products/${productId}/images`,
    formData,
    {
      params: { is_primary: isPrimary },
    }
  );

  return response.data;
}

// =========================================================
// INVENTORY
// =========================================================

export interface InventoryItem {
  id: number;
  product_id: number;
  product_name: string;
  variant_id: number | null;
  quantity: number;
  low_stock_threshold: number;
  status: string;
  location: string | null;
}

export interface InventoryAdjustmentData {
  quantity_change: number;
  reason: string;
}

export async function getInventory(): Promise<InventoryItem[]> {
  const response = await api.get("/api/admin/inventory");
  return response.data;
}

export async function getLowStockInventory(): Promise<InventoryItem[]> {
  const response = await api.get("/api/admin/inventory/low-stock");
  return response.data;
}

export async function adjustInventory(
  inventoryId: number,
  data: InventoryAdjustmentData
): Promise<InventoryItem> {
  const response = await api.put(
    `/api/admin/inventory/${inventoryId}`,
    data
  );
  return response.data;
}


export interface InventoryHistoryItem {
  id: number;
  inventory_id: number;
  product_id: number;
  order_id: number | null;
  change_amount: number;
  changed_by: number;
  changed_by_name: string | null;
  change_type: string;
  quantity_changed: number;
  previous_quantity: number;
  new_quantity: number;
  reason: string | null;
  location: string | null;
  timestamp: string;
  created_at: string;
}

export async function getInventoryHistory(): Promise<InventoryHistoryItem[]> {
  const response = await api.get("/api/admin/inventory/history");
  return response.data;
}
