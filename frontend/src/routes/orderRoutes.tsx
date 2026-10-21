import type { ReactNode } from 'react';
import { Link, Route, useNavigate, useParams } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import MyOrdersPage from '../pages/MyOrdersPage';
import OrderConfirmationPage from '../pages/OrderConfirmationPage';
import OrderTrackingPage from '../pages/OrderTrackingPage';

/**
 * Customer order routes, mounted inside CustomerApp:
 *   /orders                        my orders
 *   /orders/:orderId               track, cancel or return one order
 *   /orders/:orderId/confirmation  "order placed" page; send customers here after POST /api/orders
 *
 * All three sit behind the auth module's ProtectedRoute (customers only): a visitor who is not logged in
 * is sent to /login, and an admin is sent back to /. This must be rendered inside <AuthProvider> (App.tsx does).
 */

function Shell({ children }: { children: ReactNode }) {
  return (
    // The app's global stylesheet centres text; these pages read left to right.
    <main style={{ minHeight: '100vh', backgroundColor: '#f4f1ea', padding: '24px 16px', textAlign: 'left' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto 16px' }}>
        <Link to="/" style={{ fontSize: '14px' }}>← Back to dashboard</Link>
      </div>
      {children}
    </main>
  );
}

/** "12" -> 12; anything else (abc, 0, -3, 1.5) -> null. */
export function parseOrderId(raw: string | undefined): number | null {
  return raw !== undefined && /^[1-9]\d*$/.test(raw) ? Number(raw) : null;
}

function OrderNotFound() {
  return (
    <div role="alert" className="alert alert-warning" style={{ maxWidth: '800px', margin: '0 auto' }}>
      We could not find that order. <Link to="/orders">See all your orders</Link>.
    </div>
  );
}

function OrdersRoute() {
  const navigate = useNavigate();
  return (
    <Shell>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <MyOrdersPage onSelectOrder={(id) => navigate(`/orders/${id}`)} />
      </div>
    </Shell>
  );
}

function OrderTrackingRoute() {
  const navigate = useNavigate();
  const orderId = parseOrderId(useParams().orderId);
  return (
    <Shell>
      {orderId === null ? (
        <OrderNotFound />
      ) : (
        <OrderTrackingPage key={orderId} orderId={orderId} onBack={() => navigate('/orders')} />
      )}
    </Shell>
  );
}

function OrderConfirmationRoute() {
  const navigate = useNavigate();
  const orderId = parseOrderId(useParams().orderId);
  return (
    <Shell>
      {orderId === null ? (
        <OrderNotFound />
      ) : (
        <OrderConfirmationPage
          key={orderId}
          orderId={orderId}
          onViewOrders={() => navigate('/orders')}
          onContinueShopping={() => navigate('/')}
        />
      )}
    </Shell>
  );
}

// A fragment of <Route>s, placed inside a <Routes> by the caller.
export const orderRoutes = (
  <Route element={<ProtectedRoute role="customer" />}>
    <Route path="/orders" element={<OrdersRoute />} />
    <Route path="/orders/:orderId" element={<OrderTrackingRoute />} />
    <Route path="/orders/:orderId/confirmation" element={<OrderConfirmationRoute />} />
  </Route>
);
