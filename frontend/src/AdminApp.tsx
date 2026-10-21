import { Routes, Route, Navigate } from "react-router-dom";
import "./admin.css";
import AdminLayout from "./layouts/AdminLayout";
import RequireAdmin from "./components/admin/RequireAdmin";
import AdminLoginPage from "./pages/admin/AdminLoginPage";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminCustomersPage from "./pages/admin/AdminCustomersPage";
import AdminOrdersPage from "./pages/admin/AdminOrdersPage";
import AdminPaymentsPage from "./pages/admin/AdminPaymentsPage";
import AdminRolesPage from "./pages/admin/AdminRolesPage";
import AdminOrderDetailPage from "./pages/admin/AdminOrderDetailPage";
import AdminCategoriesPage from "./pages/admin/AdminCategoriesPage";
import AnalyticsPage from "./pages/admin/AnalyticsPage";
import ProductsPage from "./pages/admin/ProductsPage";
import ProductFormPage from "./pages/admin/ProductFormPage";

// Mounted at /admin/* by App.tsx, so the paths here are relative to /admin
export default function AdminApp() {
  return (
    <Routes>
      <Route path="login" element={<AdminLoginPage />} />

      <Route
        path="/"
        element={
          <RequireAdmin>
            <AdminLayout />
          </RequireAdmin>
        }
      >
        <Route index element={<AdminDashboardPage />} />
        <Route path="customers" element={<AdminCustomersPage />} />
        <Route path="orders" element={<AdminOrdersPage />} />
        <Route path="orders/:id" element={<AdminOrderDetailPage />} />
        <Route path="payments" element={<AdminPaymentsPage />} />
        <Route path="roles" element={<AdminRolesPage />} />
        <Route path="categories" element={<AdminCategoriesPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />

        {/* Product Catalog */}
        <Route path="products" element={<ProductsPage />} />
        <Route path="products/new" element={<ProductFormPage />} />
        <Route path="products/:id/edit" element={<ProductFormPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}