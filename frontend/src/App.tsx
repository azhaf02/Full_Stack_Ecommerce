import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import DashboardLayout from './components/DashboardLayout';
import ProductDetailPage from './ProductDetailPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/product/:id" element={<ProductDetailPage />} />
        <Route path="*" element={<DashboardLayout />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
