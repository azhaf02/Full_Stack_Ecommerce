// @ts-ignore - JavaScript checkout component
import CheckoutPage from "./checkout/pages/CheckoutPage";
import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './components/DashboardLayout';
import ProductDetailPage from './ProductDetailPage';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import SearchResultsPage from './SearchResultsPage';

// VIORA storefront + auth pages
const HomePage = lazy(() => import('./pages/HomePage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const ProductListingPage = lazy(() => import('./pages/ProductListingPage'));
const CartPage = lazy(() => import('./pages/CartPage'));
const AdminApp = lazy(() => import('./AdminApp'));

// Storefront layout
const StorefrontLayout = lazy(() => import('./StorefrontLayout'));

export default function App() {
return (
<Router>
<AuthProvider>
<Suspense fallback={null}>
<Routes>

        {/* Admin Dashboard */}
        <Route path="/admin/*" element={<AdminApp />} />

        {/* Storefront pages */}
        <Route element={<StorefrontLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductListingPage />} />
          <Route path="/product/:id" element={<ProductDetailPage />} />
          <Route path="/search" element={<SearchResultsPage />} />

          {/* Cart Page */}
          <Route path="/cart" element={<CartPage onCheckout={() => { window.location.href = "/checkout"; }} />} />
          <Route path="/checkout" element={<CheckoutPage />} />

          {/* Authentication pages */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        {/* Protected customer pages */}
        <Route element={<ProtectedRoute role="customer" />}>
          <Route path="/profile" element={<ProfilePage />} />
        </Route>

        {/* Customer Dashboard */}
        <Route path="/dashboard/*" element={<DashboardLayout />} />

        {/* Fallback: redirect unmatched routes to Home instead of Dashboard */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </Suspense>
  </AuthProvider>
</Router>

);
}