import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import ProductDetailPage from './ProductDetailPage';

// Loaded separately so the admin's Tailwind styles and the customer
// dashboard's Bootstrap styles are not applied to each other's pages.
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

        {/* Customer Dashboard */}
        <Route path="*" element={<CustomerApp />} />
      </Routes>
    </Suspense>
  );
}

export default App;