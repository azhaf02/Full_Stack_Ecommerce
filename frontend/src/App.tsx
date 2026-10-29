import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import DashboardLayout from './components/DashboardLayout';
import ProductDetailPage from './ProductDetailPage';
// @ts-ignore CheckoutPage is a .jsx file without type declarations
import CheckoutPage from './checkout/pages/CheckoutPage';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Loaded separately so each area's styles stay on its own pages:
// admin (Tailwind), customer dashboard (Bootstrap), VIORA pages (home + auth).
const HomePage = lazy(() => import('./pages/HomePage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const ProductListingPage = lazy(() => import('./pages/ProductListingPage'));
const AdminApp = lazy(() => import('./AdminApp'));
const CustomerApp = lazy(() => import('./CustomerApp'));
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

              {/* Checkout (Safiya) */}
              <Route path="/checkout" element={<CheckoutPage />} />

              {/* Auth pages (Madeeha) */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Customer-only pages (Madeeha, AUTH-05) */}
              <Route element={<ProtectedRoute role="customer" />}>
                <Route path="/profile" element={<ProfilePage />} />
              </Route>

              {/* Customer Dashboard (Aliza) */}
              <Route path="/dashboard" element={<DashboardLayout />} />

              {/* Order pages (Rukhsar), then the customer dashboard: keep this LAST, it catches all other paths */}
              <Route path="*" element={<CustomerApp />} />
            </Route>
          </Routes>
        </Suspense>
      </AuthProvider>
    </Router>
  );
}
