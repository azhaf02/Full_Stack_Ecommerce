// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import OrderConfirmationPage from '../OrderConfirmationPage';
import { orderService } from '../../services/orderService';
import type { Order } from '../../types/order';
import { describeOutcome, formatDateTime, formatMoney, lineTotal, paymentLabel, statusLabel } from '../../utils/orderOutcome';

vi.mock('../../services/orderService', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../services/orderService')>();
  return { ...original, orderService: { ...original.orderService, get: vi.fn() } };
});

const getOrder = vi.mocked(orderService.get);

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 7,
    order_number: 'ORD-20261004-0EAC24',
    status: 'CONFIRMED',
    payment_method: 'COD',
    payment_status: 'PENDING',
    subtotal: '998.00',
    discount_amount: '0.00',
    tax_amount: '0.00',
    shipping_cost: '50.00',
    total_amount: '1048.00',
    created_at: '2026-10-04T01:30:25',
    address_id: 1,
    shipping_method_id: 1,
    items: [{ id: 1, product_id: 4, variant_id: null, quantity: 2, unit_price: '499.00' }],
    status_history: [
      { previous_status: null, new_status: 'PLACED', changed_by: 1, remarks: 'Order placed', changed_at: '2026-10-04T01:30:25' },
      { previous_status: 'PLACED', new_status: 'CONFIRMED', changed_by: 1, remarks: 'Cash on delivery accepted', changed_at: '2026-10-04T01:30:25' },
    ],
    returns: [],
    actions: null,
    ...overrides,
  };
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('describeOutcome', () => {
  it('confirms a COD order and says to pay on delivery', () => {
    const outcome = describeOutcome(makeOrder());
    expect(outcome.tone).toBe('success');
    expect(outcome.message).toMatch(/pay in cash/i);
  });

  it('confirms a paid online order', () => {
    const outcome = describeOutcome(makeOrder({ payment_method: 'ONLINE', payment_status: 'SUCCESS' }));
    expect(outcome.tone).toBe('success');
    expect(outcome.message).toMatch(/payment has been received/i);
  });

  it('says an online order is waiting for payment while it is still PLACED', () => {
    const outcome = describeOutcome(makeOrder({ payment_method: 'ONLINE', status: 'PLACED' }));
    expect(outcome.tone).toBe('info');
    expect(outcome.title).toBe('Order received');
  });

  it.each(['FAILED', 'CANCELLED'])('warns when the payment is %s and never says confirmed', (payment_status) => {
    const outcome = describeOutcome(makeOrder({ payment_method: 'ONLINE', status: 'PLACED', payment_status }));
    expect(outcome.tone).toBe('warning');
    expect(outcome.title).not.toMatch(/confirmed/i);
  });

  it.each(['CANCELLED', 'REFUND_PENDING', 'REFUNDED'])('shows a cancelled order for status %s', (status) => {
    expect(describeOutcome(makeOrder({ status })).tone).toBe('danger');
  });
});

describe('formatting', () => {
  it('formats money in rupees and leaves non-numbers alone', () => {
    expect(formatMoney('1048.00')).toBe('₹1,048.00');
    expect(formatMoney('47999')).toBe('₹47,999.00');
    expect(formatMoney('n/a')).toBe('n/a');
  });

  it('multiplies price by quantity without floating point noise', () => {
    expect(lineTotal('0.10', 3)).toBe('0.30');
    expect(lineTotal('499.00', 2)).toBe('998.00');
  });

  it('reads API times as UTC and tolerates a time that already has a zone', () => {
    expect(formatDateTime('2026-10-04T01:30:25')).toBe(formatDateTime('2026-10-04T01:30:25Z'));
    expect(formatDateTime('not a date')).toBe('not a date');
  });

  it('makes statuses readable', () => {
    expect(statusLabel('OUT_FOR_DELIVERY')).toBe('Out for delivery');
  });

  it('words payment statuses the way a customer expects', () => {
    expect(paymentLabel('SUCCESS')).toBe('Paid');
    expect(paymentLabel('REFUND_PENDING')).toBe('Refund pending');
    expect(paymentLabel('SOMETHING_NEW')).toBe('Something new');
  });
});

describe('OrderConfirmationPage', () => {
  it('shows a loading state, then the Order ID, totals, items and history', async () => {
    getOrder.mockResolvedValue(makeOrder());
    render(<OrderConfirmationPage orderId={7} />);
    expect(screen.getByRole('status').textContent).toMatch(/loading/i);

    await waitFor(() => expect(screen.getByTestId('order-id').textContent).toBe('ORD-20261004-0EAC24'));
    expect(getOrder).toHaveBeenCalledWith(7);
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Order confirmed');
    expect(screen.getByText('Cash on delivery')).toBeTruthy();
    expect(screen.getByText('Product #4')).toBeTruthy();
    expect(screen.getByText('₹1,048.00')).toBeTruthy();
    expect(screen.getByText('Shipping').nextSibling?.textContent).toBe('₹50.00');
    expect(screen.queryByText('Discount')).toBeNull();
    expect(screen.getByText('Placed')).toBeTruthy();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  it('shows the discount and tax rows only when there are some', async () => {
    getOrder.mockResolvedValue(makeOrder({ discount_amount: '100.00', tax_amount: '45.00' }));
    render(<OrderConfirmationPage orderId={7} />);
    await waitFor(() => expect(screen.getByText('Discount')).toBeTruthy());
    expect(screen.getByText('−₹100.00')).toBeTruthy();
    expect(screen.getByText('Tax')).toBeTruthy();
  });

  it('names the variant when the item has one', async () => {
    getOrder.mockResolvedValue(makeOrder({ items: [{ id: 1, product_id: 3, variant_id: 2, quantity: 1, unit_price: '90.00' }] }));
    render(<OrderConfirmationPage orderId={7} />);
    await waitFor(() => expect(screen.getByText(/variant 2/)).toBeTruthy());
  });

  it('warns instead of confirming when the online payment failed', async () => {
    getOrder.mockResolvedValue(makeOrder({ payment_method: 'ONLINE', status: 'PLACED', payment_status: 'FAILED' }));
    render(<OrderConfirmationPage orderId={7} />);
    await waitFor(() => expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Payment not completed'));
    expect(screen.queryByText('Order confirmed')).toBeNull();
  });

  it('shows a readable error and retries when loading fails', async () => {
    getOrder.mockRejectedValueOnce(new Error('boom')).mockResolvedValueOnce(makeOrder());
    render(<OrderConfirmationPage orderId={7} />);
    await waitFor(() => expect(screen.getByRole('alert').textContent).toMatch(/could not load your order/i));

    fireEvent.click(screen.getByRole('button', { name: /try again/i }));
    await waitFor(() => expect(screen.getByTestId('order-id').textContent).toBe('ORD-20261004-0EAC24'));
    expect(getOrder).toHaveBeenCalledTimes(2);
  });

  it('copies the Order ID', async () => {
    getOrder.mockResolvedValue(makeOrder());
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    render(<OrderConfirmationPage orderId={7} />);
    await waitFor(() => screen.getByTestId('order-id'));

    fireEvent.click(screen.getByRole('button', { name: /copy order id/i }));
    await waitFor(() => expect(screen.getByText('Copied')).toBeTruthy());
    expect(writeText).toHaveBeenCalledWith('ORD-20261004-0EAC24');
  });

  it('only shows navigation buttons that were given a handler', async () => {
    getOrder.mockResolvedValue(makeOrder());
    const onViewOrders = vi.fn();
    render(<OrderConfirmationPage orderId={7} onViewOrders={onViewOrders} />);
    await waitFor(() => screen.getByTestId('order-id'));
    expect(screen.queryByRole('button', { name: /continue shopping/i })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /view my orders/i }));
    expect(onViewOrders).toHaveBeenCalledTimes(1);
  });
});
