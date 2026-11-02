import { useState, type FormEvent } from 'react';
import { getOrderErrorMessage, orderService } from '../services/orderService';
import type { Order, OrderReturn } from '../types/order';
import { itemLabel } from '../utils/orderOutcome';

interface ReturnRequestFormProps {
  order: Order;
  onSubmitted: (created: OrderReturn) => void;
  onClose?: () => void;
}

const MAX_REASON = 1000;

export default function ReturnRequestForm({ order, onSubmitted, onClose }: ReturnRequestFormProps) {
  // order item id -> how many to return (only items that are ticked are in here)
  const [selected, setSelected] = useState<Record<number, number>>({});
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = (itemId: number, checked: boolean) =>
    setSelected((current) => {
      const next = { ...current };
      if (checked) next[itemId] = 1;
      else delete next[itemId];
      return next;
    });

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const items = Object.entries(selected).map(([id, quantity]) => ({ order_item_id: Number(id), quantity }));
    if (items.length === 0) {
      setError('Choose at least one item to return.');
      return;
    }
    if (!reason.trim()) {
      setError('Tell us why you are returning these items.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      onSubmitted(await orderService.requestReturn(order.id, { reason: reason.trim(), items }));
    } catch (err) {
      setError(getOrderErrorMessage(err, 'We could not send your return request.'));
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} aria-label="Return request" noValidate
          style={{ border: '1px solid #e8e5de', borderRadius: '14px', padding: '18px', backgroundColor: '#fcfbf8' }}>
      <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#2f3e30', margin: '0 0 4px' }}>Return items from {order.order_number}</h3>
      <p style={{ margin: '0 0 14px', fontSize: '13px', color: '#6e776e' }}>
        Tick what you want to send back. Shipping is not refunded.
      </p>

      <fieldset disabled={busy} style={{ border: 0, padding: 0, margin: 0 }}>
        <legend className="visually-hidden">Items to return</legend>
        {order.items.map((item) => {
          const checked = item.id in selected;
          const label = itemLabel(item.product_id, item.variant_id);
          return (
            <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', padding: '8px 0', borderBottom: '1px solid #f0ede6' }}>
              <div className="form-check" style={{ margin: 0 }}>
                <input className="form-check-input" type="checkbox" id={`return-item-${item.id}`} checked={checked}
                       onChange={(e) => toggle(item.id, e.target.checked)} />
                <label className="form-check-label" htmlFor={`return-item-${item.id}`}>
                  {label} <span style={{ color: '#6e776e' }}>(ordered {item.quantity})</span>
                </label>
              </div>
              <select className="form-select form-select-sm" style={{ width: '84px' }} disabled={!checked || busy}
                      aria-label={`Quantity to return for ${label}`}
                      value={selected[item.id] ?? 1}
                      onChange={(e) => setSelected((c) => ({ ...c, [item.id]: Number(e.target.value) }))}>
                {Array.from({ length: item.quantity }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          );
        })}

        <label htmlFor="return-reason" className="form-label" style={{ marginTop: '14px', fontSize: '13px' }}>Reason for return</label>
        <textarea id="return-reason" className="form-control" rows={3} maxLength={MAX_REASON} value={reason}
                  onChange={(e) => setReason(e.target.value)} />
      </fieldset>

      {error && <div className="alert alert-danger" role="alert" style={{ marginTop: '12px', marginBottom: 0 }}>{error}</div>}

      <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
        <button type="submit" className="btn btn-success" disabled={busy}>{busy ? 'Sending…' : 'Send return request'}</button>
        {onClose && <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={busy}>Close</button>}
      </div>
    </form>
  );
}
