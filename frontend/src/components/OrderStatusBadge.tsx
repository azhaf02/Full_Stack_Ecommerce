import { statusLabel, statusTone, type BadgeTone } from '../utils/orderOutcome';

const COLORS: Record<BadgeTone, { color: string; background: string }> = {
  success: { color: '#2f7d3b', background: '#eaf5ec' },
  info: { color: '#1f6fa8', background: '#e8f2fa' },
  warning: { color: '#a86b00', background: '#fdf3e0' },
  danger: { color: '#b3352b', background: '#fbeceb' },
  neutral: { color: '#5b645b', background: '#eeece6' },
};

/** A small coloured pill for an order status (or a return status). */
export default function OrderStatusBadge({ status }: { status: string }) {
  const { color, background } = COLORS[statusTone(status)];
  return (
    <span
      data-testid="status-badge"
      style={{ color, background, padding: '3px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap' }}
    >
      {statusLabel(status)}
    </span>
  );
}
