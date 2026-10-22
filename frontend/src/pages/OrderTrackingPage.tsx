import { useCallback, useEffect, useState } from 'react';
import CancelOrderButton from '../components/CancelOrderButton';
import OrderStatusBadge from '../components/OrderStatusBadge';
import ReturnRequestForm from '../components/ReturnRequestForm';
import { getOrderErrorMessage, orderService } from '../services/orderService';
import type { Order } from '../types/order';
import {
  PAYMENT_METHOD_LABEL, formatDateTime, formatMoney, itemLabel, lineTotal, paymentLabel, statusLabel,
} from '../utils/orderOutcome';

interface OrderTrackingPageProps {
  orderId: number;
  onBack?: () => void;
}

const card = {
  backgroundColor: '#ffffff', borderRadius: '18px', padding: '24px', border: '1px solid #e8e5de',
  boxShadow: '0 6px 20px rgba(0,0,0,0.02)',
} as const;

const heading = { fontSize: '17px', fontWeight: 700, color: '#2f3e30', margin: '0 0 14px' } as const;

export default function OrderTrackingPage({ orderId, onBack }: OrderTrackingPageProps) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [returning, setReturning] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    orderService
      .get(orderId)
      .then((data) => !cancelled && setOrder(data))
      .catch((err) => !cancelled && setError(getOrderErrorMessage(err, 'We could not load this order.')))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  useEffect(() => load(), [load]);

  if (loading) {
    return (
      <div style={{ ...card, textAlign: 'center' }} role="status" aria-live="polite">
        <div className="spinner-border text-success" aria-hidden="true" />
        <p style={{ margin: '12px 0 0', color: '#6e776e' }}>Loading your order…</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div style={card}>
        <div className="alert alert-danger" role="alert">{error ?? 'We could not load this order.'}</div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="button" className="btn btn-outline-success" onClick={load}>Try again</button>
          {onBack && <button type="button" className="btn btn-outline-secondary" onClick={onBack}>Back to my orders</button>}
        </div>
      </div>
    );
  }

  const actions = order.actions;
  const itemsById = new Map(order.items.map((item) => [item.id, item]));
  const hasDiscount = Number(order.discount_amount) > 0;
  const hasTax = Number(order.tax_amount) > 0;

  return (
    <div style={{ display: 'grid', gap: '20px', maxWidth: '760px', margin: '0 auto' }}>
      {onBack && (
        <div>
          <button type="button" className="btn btn-link" style={{ padding: 0 }} onClick={onBack}>← Back to my orders</button>
        </div>
      )}

      <section style={card} aria-labelledby="tracking-title">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '12px', textTransform: 'uppercase', color: '#6e776e', letterSpacing: '0.04em' }}>Order</div>
            <h1 id="tracking-title" data-testid="order-number" style={{ fontSize: '22px', fontWeight: 700, fontFamily: 'monospace', color: '#2f3e30', margin: 0 }}>
              {order.order_number}
            </h1>
            <div style={{ fontSize: '13px', color: '#6e776e', marginTop: '4px' }}>
              Placed {formatDateTime(order.created_at)} · {PAYMENT_METHOD_LABEL[order.payment_method] ?? order.payment_method}
              {' · '}{paymentLabel(order.payment_status)}
            </div>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>

        {notice && <div className="alert alert-success" role="status" style={{ marginTop: '16px', marginBottom: 0 }}>{notice}</div>}

        {(actions?.can_cancel || actions?.can_request_return) && (
          <div style={{ marginTop: '18px', display: 'grid', gap: '12px' }}>
            <CancelOrderButton
              order={order}
              onCancelled={(updated) => {
                setOrder(updated);
                setNotice('Your order has been cancelled.');
              }}
            />
            {actions?.can_request_return && !returning && (
              <div>
                <button type="button" className="btn btn-outline-success" onClick={() => setReturning(true)}>Return items</button>
                {actions.return_deadline && (
                  <span style={{ marginLeft: '12px', fontSize: '13px', color: '#6e776e' }}>
                    You can return items until {formatDateTime(actions.return_deadline)}.
                  </span>
                )}
              </div>
            )}
            {actions?.can_request_return && returning && (
              <ReturnRequestForm
                order={order}
                onClose={() => setReturning(false)}
                onSubmitted={() => {
                  setReturning(false);
                  setNotice('Your return request has been sent. We will review it soon.');
                  load();
                }}
              />
            )}
          </div>
        )}
      </section>

      {order.returns.length > 0 && (
        <section style={card} aria-labelledby="returns-title">
          <h2 id="returns-title" style={heading}>Return request</h2>
          {order.returns.map((ret) => (
            <div key={ret.id} style={{ padding: '10px 0', borderBottom: '1px solid #f5f2eb' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                <strong>Requested {formatDateTime(ret.requested_at)}</strong>
                <OrderStatusBadge status={ret.status} />
              </div>
              <ul style={{ margin: '8px 0 0', paddingLeft: '18px', fontSize: '14px' }}>
                {ret.items.map((line) => {
                  const item = itemsById.get(line.order_item_id);
                  return (
                    <li key={line.order_item_id}>
                      {item ? itemLabel(item.product_id, item.variant_id) : `Item ${line.order_item_id}`} × {line.quantity}
                    </li>
                  );
                })}
              </ul>
              <p style={{ margin: '8px 0 0', fontSize: '14px', color: '#6e776e' }}>Reason: {ret.reason}</p>
              {ret.admin_remarks && <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#6e776e' }}>Our note: {ret.admin_remarks}</p>}
              {ret.refund_amount !== null && (
                <p style={{ margin: '4px 0 0', fontSize: '14px', fontWeight: 600 }}>Refund: {formatMoney(ret.refund_amount)}</p>
              )}
            </div>
          ))}
        </section>
      )}

      <section style={card} aria-labelledby="timeline-title">
        <h2 id="timeline-title" style={heading}>Order tracking</h2>
        <ol style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {order.status_history.map((entry, index) => {
            const latest = index === order.status_history.length - 1;
            return (
              <li key={index} aria-current={latest ? 'step' : undefined}
                  style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', padding: '10px 0', borderBottom: '1px solid #f5f2eb' }}>
                <span style={{ display: 'flex', gap: '10px', alignItems: 'baseline' }}>
                  <i aria-hidden="true" className={`bi ${latest ? 'bi-record-circle-fill' : 'bi-check-circle-fill'}`}
                     style={{ color: latest ? '#1f6fa8' : '#2f7d3b' }} />
                  <span>
                    <strong>{statusLabel(entry.new_status)}</strong>
                    {entry.remarks && <span style={{ color: '#6e776e' }}> · {entry.remarks}</span>}
                  </span>
                </span>
                <span style={{ color: '#6e776e', whiteSpace: 'nowrap', fontSize: '13px' }}>{formatDateTime(entry.changed_at)}</span>
              </li>
            );
          })}
        </ol>
      </section>

      <section style={card} aria-labelledby="tracking-items-title">
        <h2 id="tracking-items-title" style={heading}>Items</h2>
        <div style={{ overflowX: 'auto' }}>
          <table className="table align-middle" style={{ fontSize: '14px', marginBottom: 0 }}>
            <thead>
              <tr style={{ color: '#6e776e', fontSize: '12px', textTransform: 'uppercase' }}>
                <th scope="col">Product</th>
                <th scope="col" className="text-end">Qty</th>
                <th scope="col" className="text-end">Price</th>
                <th scope="col" className="text-end">Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id}>
                  <td>{itemLabel(item.product_id, item.variant_id)}</td>
                  <td className="text-end">{item.quantity}</td>
                  <td className="text-end">{formatMoney(item.unit_price)}</td>
                  <td className="text-end">{formatMoney(lineTotal(item.unit_price, item.quantity))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <dl style={{ margin: '14px 0 0', marginLeft: 'auto', maxWidth: '280px', fontSize: '14px' }}>
          <Row label="Subtotal" value={formatMoney(order.subtotal)} />
          {hasDiscount && <Row label="Discount" value={`−${formatMoney(order.discount_amount)}`} />}
          {hasTax && <Row label="Tax" value={formatMoney(order.tax_amount)} />}
          <Row label="Shipping" value={formatMoney(order.shipping_cost)} />
          <Row label="Total" value={formatMoney(order.total_amount)} strong />
        </dl>
      </section>
    </div>
  );
}

function Row({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: strong ? 700 : 400,
                  borderTop: strong ? '1px solid #e8e5de' : undefined, marginTop: strong ? '6px' : 0,
                  paddingTop: strong ? '8px' : '3px', paddingBottom: '3px' }}>
      <dt style={{ fontWeight: 'inherit' }}>{label}</dt>
      <dd style={{ margin: 0 }}>{value}</dd>
    </div>
  );
}
