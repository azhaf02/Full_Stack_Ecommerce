import MockPaymentForm from "../components/payment/MockPaymentForm";
import { paymentService } from "../services/paymentService";
import { useCallback, useEffect, useState } from 'react';
import { getOrderErrorMessage, orderService } from '../services/orderService';
import type { Order } from '../types/order';
import {
  PAYMENT_METHOD_LABEL,
  describeOutcome,
  formatDateTime,
  formatMoney,
  lineTotal,
  statusLabel,
  type OutcomeTone,
} from '../utils/orderOutcome';

interface OrderConfirmationPageProps {
  /** The order to show. Pass the id returned by POST /api/orders. */
  orderId: number;
  onViewOrders?: () => void;
  onContinueShopping?: () => void;
}

const TONE_STYLE: Record<OutcomeTone, { icon: string; color: string; background: string }> = {
  success: { icon: 'bi-check-circle-fill', color: '#2f7d3b', background: '#eaf5ec' },
  info: { icon: 'bi-hourglass-split', color: '#1f6fa8', background: '#e8f2fa' },
  warning: { icon: 'bi-exclamation-triangle-fill', color: '#a86b00', background: '#fdf3e0' },
  danger: { icon: 'bi-x-circle-fill', color: '#b3352b', background: '#fbeceb' },
};

const card = {
  backgroundColor: '#ffffff',
  borderRadius: '18px',
  padding: '24px',
  border: '1px solid #e8e5de',
  boxShadow: '0 6px 20px rgba(0,0,0,0.02)',
} as const;

export default function OrderConfirmationPage({ orderId, onViewOrders, onContinueShopping }: OrderConfirmationPageProps) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [paymentId, setPaymentId] = useState<number | null>(null);

  const load = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    orderService
      .get(orderId)
      .then((data) => !cancelled && setOrder(data))
      .catch((err) => !cancelled && setError(getOrderErrorMessage(err, 'We could not load your order.')))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  useEffect(() => load(), [load]);
  useEffect(() => {
  if (!order || order.payment_method !== "ONLINE") {
    setPaymentId(null);
    return;
  }

  let cancelled = false;

  paymentService
    .getByOrder(order.id)
    .then((payment) => {
      if (!cancelled) {
        setPaymentId(payment.payment_id);
      }
    })
    .catch((err) => {
      console.error("Could not load payment:", err);

      if (!cancelled) {
        setPaymentId(null);
      }
    });

  return () => {
    cancelled = true;
  };
}, [order]);

  const copyOrderId = async () => {
    if (!order) return;
    try {
      await navigator.clipboard.writeText(order.order_number);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Copying is a convenience; the Order ID is still on screen.
    }
  };

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
        <div className="alert alert-danger" role="alert" style={{ marginBottom: '16px' }}>
          {error ?? 'We could not load your order.'}
        </div>
        <button type="button" className="btn btn-outline-success" onClick={load}>
          Try again
        </button>
      </div>
    );
  }

  const outcome = describeOutcome(order);
  const tone = TONE_STYLE[outcome.tone];
  const hasDiscount = Number(order.discount_amount) > 0;
  const hasTax = Number(order.tax_amount) > 0;

  return (
    <div style={{ display: 'grid', gap: '20px', maxWidth: '760px', margin: '0 auto' }}>
      <section style={{ ...card, textAlign: 'center' }} aria-labelledby="order-outcome-title">
        <div
          aria-hidden="true"
          style={{
            width: '64px', height: '64px', borderRadius: '50%', margin: '0 auto 14px', fontSize: '30px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: tone.color, backgroundColor: tone.background,
          }}
        >
          <i className={`bi ${tone.icon}`} />
        </div>
        <h1 id="order-outcome-title" style={{ fontSize: '24px', fontWeight: 700, color: '#2f3e30', margin: 0 }}>
          {outcome.title}
        </h1>
        <p style={{ margin: '8px 0 20px', color: '#6e776e' }}>{outcome.message}</p>

        <div style={{ display: 'inline-block', padding: '14px 22px', borderRadius: '14px', backgroundColor: '#f7f5f0' }}>
          <div style={{ fontSize: '12px', textTransform: 'uppercase', color: '#6e776e', letterSpacing: '0.04em' }}>
            Your Order ID
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center' }}>
            <strong data-testid="order-id" style={{ fontSize: '22px', color: '#2f3e30', fontFamily: 'monospace' }}>
              {order.order_number}
            </strong>
            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={copyOrderId} aria-label="Copy order ID">
              <i className={`bi ${copied ? 'bi-check2' : 'bi-clipboard'}`} aria-hidden="true" /> {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>

        <dl style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', justifyContent: 'center', margin: '20px 0 0' }}>
          <div>
            <dt style={{ fontSize: '12px', color: '#6e776e', fontWeight: 500 }}>Placed on</dt>
            <dd style={{ margin: 0, fontWeight: 600 }}>{formatDateTime(order.created_at)}</dd>
          </div>
          <div>
            <dt style={{ fontSize: '12px', color: '#6e776e', fontWeight: 500 }}>Payment</dt>
            <dd style={{ margin: 0, fontWeight: 600 }}>{PAYMENT_METHOD_LABEL[order.payment_method] ?? order.payment_method}</dd>
          </div>
          <div>
            <dt style={{ fontSize: '12px', color: '#6e776e', fontWeight: 500 }}>Order status</dt>
            <dd style={{ margin: 0, fontWeight: 600 }}>{statusLabel(order.status)}</dd>
          </div>
        </dl>
      </section>
      {order.payment_method === "ONLINE" && paymentId !== null && (
  <MockPaymentForm
    paymentId={paymentId}
    onPaymentComplete={() => load()}
  />
)}

      <section style={card} aria-labelledby="order-items-title">
        <h2 id="order-items-title" style={{ fontSize: '17px', fontWeight: 700, color: '#2f3e30', margin: '0 0 14px' }}>
          Items in this order
        </h2>
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
                  <td>
                    Product #{item.product_id}
                    {item.variant_id !== null && <span style={{ color: '#6e776e' }}> (variant {item.variant_id})</span>}
                  </td>
                  <td className="text-end">{item.quantity}</td>
                  <td className="text-end">{formatMoney(item.unit_price)}</td>
                  <td className="text-end">{formatMoney(lineTotal(item.unit_price, item.quantity))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <dl style={{ margin: '14px 0 0', marginLeft: 'auto', maxWidth: '280px', fontSize: '14px' }}>
          <TotalRow label="Subtotal" value={formatMoney(order.subtotal)} />
          {hasDiscount && <TotalRow label="Discount" value={`−${formatMoney(order.discount_amount)}`} />}
          {hasTax && <TotalRow label="Tax" value={formatMoney(order.tax_amount)} />}
          <TotalRow label="Shipping" value={formatMoney(order.shipping_cost)} />
          <TotalRow label="Total" value={formatMoney(order.total_amount)} strong />
        </dl>
      </section>

      <section style={card} aria-labelledby="order-history-title">
        <h2 id="order-history-title" style={{ fontSize: '17px', fontWeight: 700, color: '#2f3e30', margin: '0 0 14px' }}>
          Order history
        </h2>
        <ol style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {order.status_history.map((entry, index) => (
            <li key={index} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', padding: '8px 0', borderBottom: '1px solid #f5f2eb' }}>
              <span>
                <strong>{statusLabel(entry.new_status)}</strong>
                {entry.remarks && <span style={{ color: '#6e776e' }}> · {entry.remarks}</span>}
              </span>
              <span style={{ color: '#6e776e', whiteSpace: 'nowrap', fontSize: '13px' }}>{formatDateTime(entry.changed_at)}</span>
            </li>
          ))}
        </ol>
      </section>

      {(onViewOrders || onContinueShopping) && (
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {onViewOrders && (
            <button type="button" className="btn btn-success" onClick={onViewOrders}>
              View my orders
            </button>
          )}
          {onContinueShopping && (
            <button type="button" className="btn btn-outline-success" onClick={onContinueShopping}>
              Continue shopping
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function TotalRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontWeight: strong ? 700 : 400,
                  borderTop: strong ? '1px solid #e8e5de' : undefined, marginTop: strong ? '6px' : 0, paddingTop: strong ? '8px' : '3px' }}>
      <dt style={{ fontWeight: 'inherit' }}>{label}</dt>
      <dd style={{ margin: 0 }}>{value}</dd>
    </div>
  );
}
