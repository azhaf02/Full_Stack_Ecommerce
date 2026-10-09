import LoginPage from './pages/LoginPage';
import React from 'react';
import DashboardLayout from './components/DashboardLayout';
import CartPage from './pages/CartPage';
import CouponsPage from './pages/admin/CouponsPage';
import CheckoutPage from './checkout/pages/CheckoutPage';

function App() {
  if (window.location.pathname === "/login") {
    return <LoginPage />;
  }

  const path = window.location.pathname;

  if (path === '/checkout') {
    return <CheckoutPage />;
  }

  if (path === '/cart') {
    return (
      <CartPage
        onContinueShopping={() => {
          window.location.href = '/';
        }}
        onCheckout={() => {
          window.location.href = '/checkout';
        }}
      />
    );
  }

  if (path === '/admin/coupons') {
    return <CouponsPage />;
  }

  return <DashboardLayout />;
}

export default App;
