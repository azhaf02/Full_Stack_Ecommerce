// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import OrderTrackingPage from '../OrderTrackingPage';
import { orderService } from '../../services/orderService';
import { apiError, makeOrder, makeReturn, noActions } from '../../test-utils/orderFixtures';

vi.mock('../../services/orderService', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../services/orderService')>();
  return { ...original, orderService: { ...original.orderService, get: vi.fn(), cancel: vi.fn(), requestReturn: vi.fn() } };
});

const get = vi.mocked(orderService.get);
const cancel = vi.mocked(orderService.cancel);
const requestReturn = vi.mocked(orderService.requestReturn);

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const loaded = () => waitFor(() => expect(screen.getByTestId('order-number')).toBeTruthy());

describe('OrderTrackingPage', () => {
  it('shows the order number, status, timeline, items and totals', async () => {
    get.mockResolvedValue(makeOrder());
    render(<OrderTrackingPage orderId={7} />);
    expect(screen.getByRole('status').textContent).toMatch(/loading/i);
    await loaded();

    expect(get).toHaveBeenCalledWith(7);
    expect(screen.getByTestId('order-number').textContent).toBe('ORD-20261004-0EAC24');
    expect(screen.getByTestId('status-badge').textContent).toBe('Confirmed');
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByText('Payment verified', { exact: false })).toBeTruthy();
    expect(screen.getByText('Product #3 (variant 1)')).toBeTruthy();
    expect(screen.getByText('₹4,547.00')).toBeTruthy();
    expect(screen.getByText('Shipping').nextSibling?.textContent).toBe('₹50.00');
  });

  it('marks the latest step of the timeline', async () => {
    get.mockResolvedValue(makeOrder());
    render(<OrderTrackingPage orderId={7} />);
    await loaded();
    const steps = screen.getAllByRole('listitem');
    expect(steps[0].getAttribute('aria-current')).toBeNull();
    expect(steps[1].getAttribute('aria-current')).toBe('step');
  });

  it('shows no action buttons when the order can neither be cancelled nor returned', async () => {
    get.mockResolvedValue(makeOrder({ status: 'SHIPPED' }));
    render(<OrderTrackingPage orderId={7} />);
    await loaded();
    expect(screen.queryByRole('button', { name: 'Cancel order' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Return items' })).toBeNull();
  });

  it('cancels the order and shows the cancelled state without reloading', async () => {
    get.mockResolvedValue(makeOrder({ actions: { ...noActions, can_cancel: true } }));
    cancel.mockResolvedValue(makeOrder({
      status: 'REFUND_PENDING', payment_status: 'REFUND_PENDING', actions: noActions,
      status_history: [
        { previous_status: null, new_status: 'PLACED', changed_by: 1, remarks: 'Order placed', changed_at: '2026-10-04T01:30:25' },
        { previous_status: 'PLACED', new_status: 'CANCELLED', changed_by: 1, remarks: 'Cancelled by customer', changed_at: '2026-10-04T02:00:00' },
        { previous_status: 'CANCELLED', new_status: 'REFUND_PENDING', changed_by: 1, remarks: 'Refund started after cancellation', changed_at: '2026-10-04T02:00:00' },
      ],
    }));
    render(<OrderTrackingPage orderId={7} />);
    await loaded();

    fireEvent.click(screen.getByRole('button', { name: 'Cancel order' }));
    fireEvent.click(screen.getByRole('button', { name: 'Yes, cancel order' }));

    await waitFor(() => expect(screen.getByRole('status').textContent).toMatch(/has been cancelled/i));
    expect(screen.getByTestId('status-badge').textContent).toBe('Refund pending');
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    expect(screen.queryByRole('button', { name: 'Cancel order' })).toBeNull();
    expect(get).toHaveBeenCalledTimes(1);
  });

  it('offers a return with its deadline, and opens the form', async () => {
    get.mockResolvedValue(makeOrder({
      status: 'DELIVERED', actions: { ...noActions, can_request_return: true, return_deadline: '2026-10-11T12:00:00' },
    }));
    render(<OrderTrackingPage orderId={7} />);
    await loaded();
    expect(screen.getByText(/you can return items until/i)).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Return items' }));
    expect(screen.getByRole('form', { name: 'Return request' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Return items' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.getByRole('button', { name: 'Return items' })).toBeTruthy();
  });

  it('sends a return, closes the form and reloads the order to show the request', async () => {
    const delivered = makeOrder({
      status: 'DELIVERED', actions: { ...noActions, can_request_return: true, return_deadline: '2026-10-11T12:00:00' },
    });
    get.mockResolvedValueOnce(delivered).mockResolvedValueOnce(makeOrder({
      status: 'RETURN_REQUESTED', actions: noActions, returns: [makeReturn()],
    }));
    requestReturn.mockResolvedValue(makeReturn());
    render(<OrderTrackingPage orderId={7} />);
    await loaded();

    fireEvent.click(screen.getByRole('button', { name: 'Return items' }));
    fireEvent.click(screen.getByRole('checkbox', { name: /Product #4/ }));
    fireEvent.change(screen.getByLabelText('Reason for return'), { target: { value: 'Damaged on arrival' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send return request' }));

    await waitFor(() => expect(screen.getByRole('status').textContent).toMatch(/return request has been sent/i));
    expect(requestReturn).toHaveBeenCalledWith(7, { reason: 'Damaged on arrival', items: [{ order_item_id: 1, quantity: 1 }] });
    expect(get).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole('form', { name: 'Return request' })).toBeNull();
    expect(screen.getByRole('heading', { name: 'Return request' })).toBeTruthy();
  });

  it('shows an existing return with its status, items, reason, our note and refund', async () => {
    get.mockResolvedValue(makeOrder({
      status: 'REFUND_PENDING',
      returns: [makeReturn({ status: 'REFUND_PENDING', admin_remarks: 'Approved, thanks', refund_amount: '1599.00' })],
    }));
    render(<OrderTrackingPage orderId={7} />);
    await loaded();

    expect(screen.getByText('Product #4 × 1')).toBeTruthy();
    expect(screen.getByText('Reason: Damaged on arrival')).toBeTruthy();
    expect(screen.getByText('Our note: Approved, thanks')).toBeTruthy();
    expect(screen.getByText('Refund: ₹1,599.00')).toBeTruthy();
    expect(screen.getAllByTestId('status-badge').map((b) => b.textContent)).toEqual(['Refund pending', 'Refund pending']);
  });

  it('shows no return panel when there are no returns', async () => {
    get.mockResolvedValue(makeOrder());
    render(<OrderTrackingPage orderId={7} />);
    await loaded();
    expect(screen.queryByRole('heading', { name: 'Return request' })).toBeNull();
  });

  it('shows the error with Try again, and Back when it can go back', async () => {
    get.mockRejectedValueOnce(apiError(404, 'Order 7 not found')).mockResolvedValueOnce(makeOrder());
    const onBack = vi.fn();
    render(<OrderTrackingPage orderId={7} onBack={onBack} />);
    await waitFor(() => expect(screen.getByRole('alert').textContent).toBe('Order 7 not found'));

    fireEvent.click(screen.getByRole('button', { name: 'Back to my orders' }));
    expect(onBack).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: /try again/i }));
    await loaded();
    expect(get).toHaveBeenCalledTimes(2);
  });

  it('has a back link only when given a handler', async () => {
    get.mockResolvedValue(makeOrder());
    const onBack = vi.fn();
    const { unmount } = render(<OrderTrackingPage orderId={7} onBack={onBack} />);
    await loaded();
    fireEvent.click(screen.getByRole('button', { name: /back to my orders/i }));
    expect(onBack).toHaveBeenCalledTimes(1);
    unmount();

    render(<OrderTrackingPage orderId={7} />);
    await loaded();
    expect(screen.queryByRole('button', { name: /back to my orders/i })).toBeNull();
  });
});
