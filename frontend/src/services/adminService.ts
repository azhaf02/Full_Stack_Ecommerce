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
export interface Product {
  id: number;
  category_id: number;
  name: string;
  description: string | null;
  price: string;
  stock_quantity: number;
  status: "ACTIVE" | "INACTIVE";
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