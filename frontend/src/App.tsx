import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import ProductDetailPage from './ProductDetailPage';
import CheckoutPage from './checkout/pages/CheckoutPage';

const AdminApp = lazy(() => import('./AdminApp'));
const CustomerApp = lazy(() => import('./CustomerApp'));

function App() {
  return (
    <Suspense fallback={null}>
      <Routes>
        {/* Admin Dashboard */}
        <Route path="/admin/*" element={<AdminApp />} />

        {/* Product Details */}
        <Route path="/product/:id" element={<ProductDetailPage />} />

        {/* Checkout */}
        <Route path="/checkout" element={<CheckoutPage />} />

        {/* Customer Dashboard */}
        <Route path="*" element={<CustomerApp />} />
      </Routes>
    </Suspense>
  );
}

export default App;
