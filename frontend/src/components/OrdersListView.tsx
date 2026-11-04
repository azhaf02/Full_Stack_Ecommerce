import { useState, useEffect } from 'react';
import ReviewSubmissionModal from './ReviewSubmissionModal';

interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  image: string;
  date: string;
  status: string;
  total: string;
  canReview: boolean;
}

interface OrdersListViewProps {
  onReviewSubmitted?: () => void;
}

const fallbackOrders: OrderItem[] = [
  {
    id: 9821,
    product_id: 1,
    product_name: "Bluetooth Noise-Cancelling Headphones",
    image: "🎧",
    date: "2026-09-21",
    status: "Delivered",
    total: "₹7,499",
    canReview: true
  },
  {
    id: 9825,
    product_id: 2,
    product_name: "Smart Fitness Watch v2",
    image: "⌚",
    date: "2026-09-24",
    status: "Shipped",
    total: "₹2,499",
    canReview: false
  }
];

export default function OrdersListView({ onReviewSubmitted }: OrdersListViewProps) {
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);
  const [orders, setOrders] = useState<OrderItem[]>(fallbackOrders);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchCustomerOrders = async () => {
      try {
        const token = localStorage.getItem('token') || localStorage.getItem('access_token');
        const headers: Record<string, string> = {
          'Content-Type': 'application/json'
        };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const res = await fetch('/api/orders', { headers });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            const mappedOrders: OrderItem[] = data.map((item: any) => ({
              id: item.id || item.order_id,
              product_id: item.product_id || (item.items && item.items[0]?.product_id) || 1,
              product_name: item.product_name || item.title || (item.items && item.items[0]?.title) || `Order #${item.id}`,
              image: item.image || "🛍️",
              date: item.created_at ? item.created_at.split('T')[0] : (item.date || "Recent"),
              status: item.status || "Processing",
              total: item.total ? (String(item.total).startsWith('₹') ? item.total : `₹${item.total}`) : "₹0",
              canReview: (item.status?.toLowerCase() === 'delivered')
            }));
            setOrders(mappedOrders);
          }
        }
      } catch (err) {
        console.warn("Backend orders API unreachable, rendering stored fallback:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomerOrders();
  }, []);

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
          <span style={{ fontSize: '12px', color: '#768572' }}>Updating ledger...</span>
        )}
      </div>

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
            {orders.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: '#768572' }}>
                  No orders found.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
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
                      {order.image}
                    </div>
                    <div>
                      <div style={{ fontWeight: '600', color: '#1e241e' }}>{order.product_name}</div>
                      <div style={{ fontSize: '12px', color: '#8a948a' }}>Order #{order.id}</div>
                    </div>
                  </td>
                  <td style={{ padding: '16px', color: '#455045' }}>{order.date}</td>
                  <td style={{ padding: '16px' }}>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '600',
                      backgroundColor: order.status.toLowerCase() === 'delivered' ? '#eaf0eb' : '#fdf5ea',
                      color: order.status.toLowerCase() === 'delivered' ? '#2f3e30' : '#b7791f'
                    }}>
                      {order.status.toLowerCase() === 'delivered' ? '✓ Delivered' : `🚚 ${order.status}`}
                    </span>
                  </td>
                  <td style={{ padding: '16px', fontWeight: '700', color: '#2f3e30' }}>{order.total}</td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    {order.canReview ? (
                      <button
                        onClick={() => setSelectedOrder(order)}
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
                        In Transit
                      </span>
                    )}
                  </td>
                </tr>
              ))
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