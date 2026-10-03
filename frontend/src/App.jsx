import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import DashboardLayout from "./components/DashboardLayout";
import ProductDetailPage from "./ProductDetailPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardLayout />} />
        <Route path="/products/:id" element={<ProductDetailPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;