import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import DashboardLayout from './components/DashboardLayout';
import ProductDetailPage from './ProductDetailPage';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// VIORA storefront + auth pages (Madeeha), loaded on demand
const HomePage = lazy(() => import('./pages/HomePage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const ProductListingPage = lazy(() => import('./pages/ProductListingPage'));
const AdminApp = lazy(() => import('./AdminApp'));

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Suspense fallback={null}>
          <Routes>
            {/* Storefront home (Madeeha) */}
            <Route path="/" element={<HomePage />} />

            {/* Product listing + details (Chandani) */}
            <Route path="/products" element={<ProductListingPage />} />
            <Route path="/product/:id" element={<ProductDetailPage />} />

            {/* Auth pages (Madeeha) */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Customer-only pages (Madeeha, AUTH-05) */}
            <Route element={<ProtectedRoute role="customer" />}>
              <Route path="/profile" element={<ProfilePage />} />
            </Route>

            {/* Admin Dashboard */}
            <Route path="/admin/*" element={<AdminApp />} />

            {/* Customer Dashboard (Aliza), unchanged from integration-v2 */}
            <Route path="/dashboard" element={<DashboardLayout />} />
            <Route path="*" element={<DashboardLayout />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </Router>
  );
}