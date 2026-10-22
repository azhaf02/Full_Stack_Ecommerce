import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import ProductDetailPage from './ProductDetailPage';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';

// Loaded separately so each area's styles stay on its own pages
const AdminApp = lazy(() => import('./AdminApp'));
const CustomerApp = lazy(() => import('./CustomerApp'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));

export default function App() {
  return (
    <AuthProvider>
      <Suspense fallback={null}>
        <Routes>
          {/* Admin Dashboard */}
          <Route path="/admin/*" element={<AdminApp />} />

          {/* Product Details */}
          <Route path="/product/:id" element={<ProductDetailPage />} />

          {/* Customer Dashboard / Orders */}
          <Route path="/orders" element={<DashboardLayout />} />
          <Route path="/dashboard" element={<DashboardLayout />} />

          {/* Auth Pages */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        <Route element={<ProtectedRoute />}>
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
          {/* Customer App / Fallback / Home */}
          <Route path="/*" element={<CustomerApp />} />
        </Routes>
      </Suspense>
    </AuthProvider>
  );
}