import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ReviewSubmissionModal from './ReviewSubmissionModal';
import { getOrderErrorMessage, orderService } from '../services/orderService';
import type { OrderSummary } from '../types/order';
import { formatDateTime, formatMoney, statusLabel } from '../utils/orderOutcome';

interface OrdersListViewProps {
  onReviewSubmitted?: () => void;
}

// What the review modal needs. The list endpoint has no product, so product_id comes from the order's
// first item when the customer presses "Write Review".
interface ReviewTarget {
  id: number;
  product_id: number;
  product_name: string;
}

export default function OrdersListView({ onReviewSubmitted }: OrdersListViewProps) {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [reviewError, setReviewError] = useState<string>('');
  const [openingId, setOpeningId] = useState<number | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<ReviewTarget | null>(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // GET /api/account/orders, sent with the viora_token JWT by orderService
      setOrders(await orderService.list(1, 10));
    } catch (err) {
      setOrders([]);
      setError(getOrderErrorMessage(err, 'Could not load your orders.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const startReview = async (order: OrderSummary) => {
    setOpeningId(order.id);
    setReviewError('');
    try {
      const detail = await orderService.get(order.id);
      const first = detail.items[0];
      if (!first) {
        setReviewError('This order has no items to review.');
        return;
      }
      setSelectedOrder({ id: order.id, product_id: first.product_id, product_name: `Order ${order.order_number}` });
    } catch (err) {
      setReviewError(getOrderErrorMessage(err, 'Could not open the review form.'));
    } finally {
      setOpeningId(null);
    }
  };

  return (
    <div style={{
      backgroundColor: '#ffffff',
      borderRadius: '18px',
      padding: '24px',
      border: '1px solid #e8e5de',
      boxShadow: '0 6px 20px rgba(0,0,0,0.02)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#2f3e30' }}>Recent Orders</h2>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6e776e' }}>Track shipments and leave verified product reviews</p>
        </div>
        {loading && (
          <span role="status" style={{ fontSize: '12px', color: '#768572' }}>Loading your orders...</span>
        )}
      </div>

      {error && (
        <div role="alert" style={{ padding: '12px 16px', marginBottom: '16px', borderRadius: '10px', backgroundColor: '#fdf5ea', color: '#8a5a12', fontSize: '13px' }}>
          {error}{' '}
          <button
            type="button"
            onClick={() => void loadOrders()}
            style={{ border: 'none', background: 'none', padding: 0, color: '#2f3e30', fontWeight: 600, textDecoration: 'underline', cursor: 'pointer' }}
          >
            Try again
          </button>
        </div>
      )}

      {reviewError && (
        <div role="alert" style={{ padding: '12px 16px', marginBottom: '16px', borderRadius: '10px', backgroundColor: '#fdf5ea', color: '#8a5a12', fontSize: '13px' }}>
          {reviewError}
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #f0ede6', color: '#6e776e', fontSize: '12px', textTransform: 'uppercase' }}>
              <th style={{ padding: '12px 16px' }}>Order Details</th>
              <th style={{ padding: '12px 16px' }}>Date</th>
              <th style={{ padding: '12px 16px' }}>Status</th>
              <th style={{ padding: '12px 16px' }}>Total</th>
              <th style={{ padding: '12px 16px', textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {!loading && !error && orders.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: '#768572' }}>
                  You have not placed any orders yet.
                </td>
              </tr>
            ) : (
              orders.map((order) => {
                const delivered = order.status === 'DELIVERED';
                return (
                  <tr key={order.id} style={{ borderBottom: '1px solid #f5f2eb' }}>
                    <td style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '12px',
                        backgroundColor: '#f7f5f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '22px'
                      }}>
                        🛍️
                      </div>
                      <div>
                        <Link to={`/orders/${order.id}`} style={{ fontWeight: '600', color: '#1e241e', textDecoration: 'none' }}>
                          {order.order_number}
                        </Link>
                      </div>
                    </td>
                    <td style={{ padding: '16px', color: '#455045' }}>{formatDateTime(order.created_at)}</td>
                    <td style={{ padding: '16px' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '600',
                        backgroundColor: delivered ? '#eaf0eb' : '#fdf5ea',
                        color: delivered ? '#2f3e30' : '#b7791f'
                      }}>
                        {delivered ? '✓ ' : ''}{statusLabel(order.status)}
                      </span>
                    </td>
                    <td style={{ padding: '16px', fontWeight: '700', color: '#2f3e30' }}>{formatMoney(order.total_amount)}</td>
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      {delivered ? (
                        <button
                          onClick={() => void startReview(order)}
                          disabled={openingId === order.id}
                          style={{
                            padding: '8px 16px',
                            backgroundColor: '#3b4d3c',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '10px',
                            fontSize: '13px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            boxShadow: '0 4px 10px rgba(59,77,60,0.18)'
                          }}
                        >
                          ⭐ Write Review
                        </button>
                      ) : (
                        <span style={{ fontSize: '13px', color: '#8a948a', fontStyle: 'italic' }}>
                          {order.status === 'CANCELLED' ? 'Cancelled' : 'In progress'}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {selectedOrder && (
        <ReviewSubmissionModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onSuccess={() => {
            setSelectedOrder(null);
            if (onReviewSubmitted) onReviewSubmitted();
          }}
          onReviewSubmitted={onReviewSubmitted}
        />
      )}
    </div>
  );
}
