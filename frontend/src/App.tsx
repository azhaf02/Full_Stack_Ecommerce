import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import ProductDetailPage from './ProductDetailPage';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Loaded separately so each area's styles stay on its own pages:
// admin (Tailwind), customer dashboard (Bootstrap), auth pages (VIORA theme).
const AdminApp = lazy(() => import('./AdminApp'));
const CustomerApp = lazy(() => import('./CustomerApp'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));

function App() {
  return (
    <AuthProvider>
      <Suspense fallback={null}>
        <Routes>
          {/* Admin Dashboard */}
          <Route path="/admin/*" element={<AdminApp />} />

          {/* Product Details */}
          <Route path="/product/:id" element={<ProductDetailPage />} />

          {/* Auth pages (Madeeha) */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Customer-only pages (Madeeha) */}
          <Route element={<ProtectedRoute role="customer" />}>
            <Route path="/profile" element={<ProfilePage />} />
          </Route>

          {/* Customer Dashboard: keep this LAST, it catches all other paths */}
          <Route path="*" element={<CustomerApp />} />
        </Routes>
      </Suspense>
    </AuthProvider>
  );
}

export default App;