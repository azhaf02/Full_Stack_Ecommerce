import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import DashboardLayout from "./components/DashboardLayout";
import ProductDetailPage from "./ProductDetailPage";
import SearchResultsPage from "./SearchResultsPage";


function App() {
  return (
    <BrowserRouter>
      <Routes>
        
        <Route path="/" element={<DashboardLayout />} />
        <Route path="/products/:id" element={<ProductDetailPage />} />
        <Route path="/search" element={<SearchResultsPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;