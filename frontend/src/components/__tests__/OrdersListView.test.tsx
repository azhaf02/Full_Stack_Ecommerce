// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import OrdersListView from '../OrdersListView';
import { orderService } from '../../services/orderService';
import { apiError, makeOrder, makeSummary } from '../../test-utils/orderFixtures';

vi.mock('../../services/orderService', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../services/orderService')>();
  return { ...original, orderService: { ...original.orderService, list: vi.fn(), get: vi.fn() } };
});

// The review form posts with axios on its own; it is Aliza's component, so keep it out of these tests.
vi.mock('../ReviewSubmissionModal', () => ({
  default: ({ order }: { order?: { id?: number; product_id?: number } }) => (
    <div role="dialog">review order {order?.id} product {order?.product_id}</div>
  ),
}));

const list = vi.mocked(orderService.list);
const get = vi.mocked(orderService.get);

const renderView = () => render(<MemoryRouter><OrdersListView /></MemoryRouter>);

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('OrdersListView', () => {
  it('lists the customer\'s real orders from GET /api/account/orders', async () => {
    list.mockResolvedValue([
      makeSummary(1, { status: 'DELIVERED', total_amount: '4547.00' }),
      makeSummary(2, { status: 'OUT_FOR_DELIVERY', total_amount: '999.00' }),
    ]);
    renderView();

    await waitFor(() => expect(screen.getByText('ORD-20261004-000001')).toBeTruthy());
    expect(list).toHaveBeenCalledWith(1, 10);
    const rows = screen.getAllByRole('row').slice(1);
    expect(rows).toHaveLength(2);
    expect(within(rows[0]).getByText(/Delivered/)).toBeTruthy();
    expect(within(rows[0]).getByText('₹4,547.00')).toBeTruthy();
    expect(within(rows[1]).getByText('Out for delivery')).toBeTruthy();
    expect(within(rows[1]).getByText('₹999.00')).toBeTruthy();
  });

  it('never shows made-up orders when there are none', async () => {
    list.mockResolvedValue([]);
    renderView();
    await waitFor(() => expect(screen.getByText(/have not placed any orders/i)).toBeTruthy());
    expect(screen.queryByText(/Bluetooth/i)).toBeNull();
    expect(screen.queryByText(/Smart Fitness Watch/i)).toBeNull();
  });

  it('shows the login message on 401 instead of fake orders, and retries', async () => {
    list.mockRejectedValueOnce(apiError(401, 'Not authenticated')).mockResolvedValueOnce([makeSummary(3)]);
    renderView();
    await waitFor(() => expect(screen.getByRole('alert').textContent).toMatch(/log in to see your orders/i));
    expect(screen.queryByText(/Bluetooth/i)).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /try again/i }));
    await waitFor(() => expect(screen.getByText('ORD-20261004-000003')).toBeTruthy());
    expect(list).toHaveBeenCalledTimes(2);
  });

  it('links each order to its tracking page', async () => {
    list.mockResolvedValue([makeSummary(9)]);
    renderView();
    const link = await screen.findByRole('link', { name: 'ORD-20261004-000009' });
    expect(link.getAttribute('href')).toBe('/orders/9');
  });

  it('only offers a review on delivered orders, using the real product id from the order', async () => {
    list.mockResolvedValue([makeSummary(1, { status: 'CONFIRMED' }), makeSummary(2, { status: 'DELIVERED' })]);
    get.mockResolvedValue(makeOrder({ id: 2 }));
    renderView();

    await waitFor(() => expect(screen.getByText('ORD-20261004-000002')).toBeTruthy());
    expect(screen.getAllByRole('button', { name: /write review/i })).toHaveLength(1);

    fireEvent.click(screen.getByRole('button', { name: /write review/i }));
    await waitFor(() => expect(screen.getByRole('dialog').textContent).toBe('review order 2 product 4'));
    expect(get).toHaveBeenCalledWith(2);
  });

  it('tells the customer when the review form cannot be opened', async () => {
    list.mockResolvedValue([makeSummary(2, { status: 'DELIVERED' })]);
    get.mockRejectedValue(apiError(404, 'Order not found'));
    renderView();

    fireEvent.click(await screen.findByRole('button', { name: /write review/i }));
    await waitFor(() => expect(screen.getByRole('alert').textContent).toMatch(/order not found/i));
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
