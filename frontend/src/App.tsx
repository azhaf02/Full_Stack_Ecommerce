import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import DashboardLayout from './components/DashboardLayout';
import ProductDetailPage from './ProductDetailPage';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import SearchResultsPage from './SearchResultsPage';

// VIORA storefront + auth pages (Madeeha), loaded on demand
const HomePage = lazy(() => import('./pages/HomePage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const ProductListingPage = lazy(() => import('./pages/ProductListingPage'));
const AdminApp = lazy(() => import('./AdminApp'));
// Bootstrap + index.css for every page except /admin
const StorefrontLayout = lazy(() => import('./StorefrontLayout'));

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Suspense fallback={null}>
          <Routes>
            {/* Admin Dashboard: uses its own admin.css, so it stays outside the storefront styles */}
            <Route path="/admin/*" element={<AdminApp />} />

<Route element={<StorefrontLayout />}>
  {/* Storefront home (Madeeha) */}
  <Route path="/" element={<HomePage />} />

  {/* Product listing + details (Chandani) */}
  <Route path="/products" element={<ProductListingPage />} />
  <Route path="/product/:id" element={<ProductDetailPage />} />
  <Route path="/search" element={<SearchResultsPage />} />

  {/* Auth pages (Madeeha) */}
  <Route path="/login" element={<LoginPage />} />
  <Route path="/register" element={<RegisterPage />} />
</Route>

              {/* Auth pages (Madeeha) */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Customer-only pages (Madeeha, AUTH-05) */}
              <Route element={<ProtectedRoute role="customer" />}>
                <Route path="/profile" element={<ProfilePage />} />
              </Route>

              {/* Customer Dashboard (Aliza), unchanged from integration-v2 */}
              <Route path="/dashboard" element={<DashboardLayout />} />
              <Route path="*" element={<DashboardLayout />} />
            </Route>
          </Routes>
        </Suspense>
      </AuthProvider>
    </Router>
  );
}