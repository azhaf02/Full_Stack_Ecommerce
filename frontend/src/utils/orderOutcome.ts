import type { Order, PaymentMethod } from '../types/order';

export type OutcomeTone = 'success' | 'info' | 'warning' | 'danger';

export interface Outcome {
  tone: OutcomeTone;
  title: string;
  message: string;
}

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  ONLINE: 'Online payment',
  COD: 'Cash on delivery',
};

/** Turns an order's status and payment state into the headline the customer sees. */
export function describeOutcome(order: Order): Outcome {
  const { status, payment_status: payment, payment_method: method } = order;

  if (status === 'CANCELLED' || status === 'REFUND_PENDING' || status === 'REFUNDED') {
    return { tone: 'danger', title: 'Order cancelled', message: 'This order was cancelled.' };
  }
  if (payment === 'FAILED' || payment === 'CANCELLED') {
    return {
      tone: 'warning',
      title: 'Payment not completed',
      message: 'Your payment did not go through, so the order has not been confirmed. No items are reserved.',
    };
  }
  if (status === 'PLACED') {
    return {
      tone: 'info',
      title: 'Order received',
      message: 'We are waiting for your payment to be confirmed. We will confirm the order as soon as it is.',
    };
  }
  if (method === 'COD') {
    return { tone: 'success', title: 'Order confirmed', message: 'Pay in cash when your order is delivered.' };
  }
  return { tone: 'success', title: 'Order confirmed', message: 'Thank you! Your payment has been received.' };
}

/** "1048.00" -> "₹1,048.00". Falls back to the raw text if it isn't a number. */
export function formatMoney(value: string | number): string {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return String(value);
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
}

/** Line total for an item, kept in whole paise so 0.1 + 0.2 style rounding never shows. */
export function lineTotal(unitPrice: string, quantity: number): string {
  return ((Math.round(Number(unitPrice) * 100) * quantity) / 100).toFixed(2);
}

/** The API sends UTC times without a "Z"; add it so the browser shows the customer's local time. */
export function formatDateTime(value: string): string {
  const hasZone = /([zZ]|[+-]\d{2}:?\d{2})$/.test(value);
  const date = new Date(hasZone ? value : `${value}Z`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

export function statusLabel(status: string): string {
  return status.toLowerCase().replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
}
