import React from 'react';
import FaqPage from './pages/support/FaqPage';
import DashboardLayout from './components/DashboardLayout';

function App() {
  return (
    <>
      {/* 🌐 Website Public Area: Savana-Style Searchable FAQ Category Grids */}
      <FaqPage />

      {/* 🖥️ User Scoped Area: Aliza's Olive-Green Production Dashboard Layout Container */}
      <DashboardLayout />
    </>
  );
}

export default App;
