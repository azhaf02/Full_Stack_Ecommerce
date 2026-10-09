import { useState } from 'react';
import { getOrderErrorMessage, orderService } from '../services/orderService';
import type { Order } from '../types/order';

interface CancelOrderButtonProps {
  order: Order;
  /** Called with the updated order once the cancellation has gone through. */
  onCancelled: (order: Order) => void;
}

/** Shows nothing unless the server says this order can still be cancelled (`actions.can_cancel`). */
export default function CancelOrderButton({ order, onCancelled }: CancelOrderButtonProps) {
  const [confirming, setConfirming] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!order.actions?.can_cancel) return null;

  const paidOnline = order.payment_status === 'SUCCESS';

  const confirm = async () => {
    setBusy(true);
    setError(null);
    try {
      const updated = await orderService.cancel(order.id, reason.trim() || undefined);
      onCancelled(updated);
    } catch (err) {
      setError(getOrderErrorMessage(err, 'We could not cancel this order.'));
      setBusy(false);
    }
  };

  if (!confirming) {
    return (
      <button type="button" className="btn btn-outline-danger" onClick={() => setConfirming(true)}>
        Cancel order
      </button>
    );
  }

  return (
    <div role="group" aria-label="Confirm cancellation" style={{ border: '1px solid #f0cfcc', borderRadius: '14px', padding: '16px', backgroundColor: '#fff8f7' }}>
      <p style={{ margin: '0 0 6px', fontWeight: 600, color: '#8a2a22' }}>Cancel order {order.order_number}?</p>
      <p style={{ margin: '0 0 12px', fontSize: '14px', color: '#6e776e' }}>
        {paidOnline ? 'Your payment will be refunded.' : 'You have not been charged yet.'} This cannot be undone.
      </p>
      <label htmlFor="cancel-reason" className="form-label" style={{ fontSize: '13px' }}>Reason (optional)</label>
      <textarea
        id="cancel-reason"
        className="form-control"
        rows={2}
        maxLength={500}
        value={reason}
        disabled={busy}
        onChange={(e) => setReason(e.target.value)}
      />
      {error && <div className="alert alert-danger" role="alert" style={{ marginTop: '12px', marginBottom: 0 }}>{error}</div>}
      <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
        <button type="button" className="btn btn-danger" onClick={confirm} disabled={busy}>
          {busy ? 'Cancelling…' : 'Yes, cancel order'}
        </button>
        <button type="button" className="btn btn-outline-secondary" onClick={() => setConfirming(false)} disabled={busy}>
          Keep order
        </button>
      </div>
    </div>
  );
}
