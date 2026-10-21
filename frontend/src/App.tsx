
import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import ProductDetailPage from './ProductDetailPage';
import CheckoutPage from './checkout/pages/CheckoutPage';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

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
          <Route path="/admin/*" element={<AdminApp />} />
          <Route path="/product/:id" element={<ProductDetailPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />

          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route element={<ProtectedRoute role="customer" />}>
            <Route path="/profile" element={<ProfilePage />} />
          </Route>

          <Route path="*" element={<CustomerApp />} />
        </Routes>
      </Suspense>
    </AuthProvider>
  );
}

export default App;
