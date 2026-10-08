import { useCallback, useEffect, useState } from 'react';
import OrderStatusBadge from '../components/OrderStatusBadge';
import { getOrderErrorMessage, orderService } from '../services/orderService';
import type { OrderSummary } from '../types/order';
import { PAYMENT_METHOD_LABEL, formatDateTime, formatMoney } from '../utils/orderOutcome';

interface MyOrdersPageProps {
  /** Called when the customer opens an order. Without it the View button is hidden. */
  onSelectOrder?: (orderId: number) => void;
  pageSize?: number;
}

const card = {
  backgroundColor: '#ffffff', borderRadius: '18px', padding: '24px', border: '1px solid #e8e5de',
  boxShadow: '0 6px 20px rgba(0,0,0,0.02)',
} as const;

export default function MyOrdersPage({ onSelectOrder, pageSize = 10 }: MyOrdersPageProps) {
  const [page, setPage] = useState(1);
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    orderService
      .list(page, pageSize)
      .then((rows) => !cancelled && setOrders(rows))
      .catch((err) => !cancelled && setError(getOrderErrorMessage(err, 'We could not load your orders.')))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [page, pageSize]);

  useEffect(() => load(), [load]);

  // The API does not return a total, so a full page means there may be another one.
  const hasNext = orders.length === pageSize;

  return (
    <section style={card} aria-labelledby="my-orders-title">
      <h1 id="my-orders-title" style={{ fontSize: '20px', fontWeight: 700, color: '#2f3e30', margin: '0 0 4px' }}>My orders</h1>
      <p style={{ margin: '0 0 18px', fontSize: '13px', color: '#6e776e' }}>Track your orders, cancel, or return items.</p>

      {loading && (
        <div role="status" aria-live="polite" style={{ textAlign: 'center', padding: '24px' }}>
          <div className="spinner-border text-success" aria-hidden="true" />
          <p style={{ margin: '10px 0 0', color: '#6e776e' }}>Loading your orders…</p>
        </div>
      )}

      {!loading && error && (
        <div>
          <div className="alert alert-danger" role="alert">{error}</div>
          <button type="button" className="btn btn-outline-success" onClick={load}>Try again</button>
        </div>
      )}

      {!loading && !error && orders.length === 0 && (
        <p style={{ textAlign: 'center', color: '#6e776e', padding: '24px 0', margin: 0 }}>
          {page === 1 ? 'You have not placed any orders yet.' : 'No more orders.'}
        </p>
      )}

      {!loading && !error && orders.length > 0 && (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {orders.map((order) => (
            <li key={order.id} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '10px 16px', padding: '14px 0', borderBottom: '1px solid #f0ede6' }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: 'monospace', fontWeight: 600, overflowWrap: 'anywhere' }}>{order.order_number}</div>
                <div style={{ fontSize: '13px', color: '#6e776e' }}>
                  <span>{formatDateTime(order.created_at)}</span> · <span>{PAYMENT_METHOD_LABEL[order.payment_method] ?? order.payment_method}</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <OrderStatusBadge status={order.status} />
                <strong>{formatMoney(order.total_amount)}</strong>
                {onSelectOrder && (
                  <button type="button" className="btn btn-sm btn-outline-success"
                          aria-label={`View order ${order.order_number}`} onClick={() => onSelectOrder(order.id)}>
                    View
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {!loading && !error && (page > 1 || hasNext) && (
        <nav aria-label="Orders pages" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
          <button type="button" className="btn btn-sm btn-outline-secondary" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </button>
          <span style={{ fontSize: '13px', color: '#6e776e' }}>Page {page}</span>
          <button type="button" className="btn btn-sm btn-outline-secondary" disabled={!hasNext} onClick={() => setPage((p) => p + 1)}>
            Next
          </button>
        </nav>
      )}
    </section>
  );
}
