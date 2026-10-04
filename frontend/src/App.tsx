import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';

// Loaded separately so the admin's Tailwind styles and the customer
// dashboard's Bootstrap styles are not applied to each other's pages.
const AdminApp = lazy(() => import('./AdminApp'));
const CustomerApp = lazy(() => import('./CustomerApp'));

function App() {
  return (
    <Suspense fallback={null}>
      <Routes>
        <Route path="/admin/*" element={<AdminApp />} />
        <Route path="*" element={<CustomerApp />} />
      </Routes>
    </Suspense>
  );
}

export default App;
