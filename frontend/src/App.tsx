import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import DashboardLayout from './components/DashboardLayout';
import ProductDetailPage from './ProductDetailPage';
import CheckoutPage from './checkout/pages/CheckoutPage';
import MockPaymentForm from './components/payment/MockPaymentForm';

import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Admin dashboard
const AdminApp = lazy(() => import('./AdminApp'));

// VIORA storefront and customer pages
const HomePage = lazy(() => import('./pages/HomePage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const ProductListingPage = lazy(() => import('./pages/ProductListingPage'));

// Storefront layout
const StorefrontLayout = lazy(() => import('./StorefrontLayout'));

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Suspense fallback={<div>Loading VIORA...</div>}>
          <Routes>

            {/* Admin Dashboard */}
            <Route path="/admin/*" element={<AdminApp />} />

            {/* Storefront routes */}
            <Route element={<StorefrontLayout />}>
              <Route path="/" element={<HomePage />} />

              {/* Product Catalog */}
              <Route path="/products" element={<ProductListingPage />} />
              <Route path="/product/:id" element={<ProductDetailPage />} />

              {/* Checkout */}
              <Route path="/checkout" element={<CheckoutPage />} />

              {/* Temporary Payment Preview */}
              <Route
                path="/payment-preview"
                element={
                  <div
                    style={{
                      minHeight: '100vh',
                      background: '#f4f1ea',
                      padding: '60px 20px',
                    }}
                  >
                    <MockPaymentForm
                      paymentId={123}
                      previewOnly={true}
                    />
                  </div>
                }
              />

              {/* Authentication */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Protected customer pages */}
              <Route element={<ProtectedRoute role="customer" />}>
                <Route path="/profile" element={<ProfilePage />} />
              </Route>

              {/* Customer Dashboard */}
              <Route path="/dashboard" element={<DashboardLayout />} />

              {/* Fallback */}
              <Route path="*" element={<DashboardLayout />} />
            </Route>

          </Routes>
        </Suspense>
      </AuthProvider>
    </Router>
  );
}