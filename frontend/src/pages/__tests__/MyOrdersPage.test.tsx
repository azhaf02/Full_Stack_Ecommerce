// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import MyOrdersPage from '../MyOrdersPage';
import { orderService } from '../../services/orderService';
import { apiError, makeSummary } from '../../test-utils/orderFixtures';

vi.mock('../../services/orderService', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../services/orderService')>();
  return { ...original, orderService: { ...original.orderService, list: vi.fn() } };
});

const list = vi.mocked(orderService.list);

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('MyOrdersPage', () => {
  it('shows a loading state, then one row per order', async () => {
    list.mockResolvedValue([
      makeSummary(1, { status: 'DELIVERED', payment_method: 'ONLINE', payment_status: 'SUCCESS', total_amount: '4547.00' }),
      makeSummary(2, { status: 'CANCELLED' }),
    ]);
    render(<MyOrdersPage />);
    expect(screen.getByRole('status').textContent).toMatch(/loading/i);

    await waitFor(() => expect(screen.getByText('ORD-20261004-000001')).toBeTruthy());
    const rows = screen.getAllByRole('listitem');
    expect(rows).toHaveLength(2);
    expect(within(rows[0]).getByText('Delivered')).toBeTruthy();
    expect(within(rows[0]).getByText('Online payment')).toBeTruthy();
    expect(within(rows[0]).getByText('₹4,547.00')).toBeTruthy();
    expect(within(rows[1]).getByText('Cancelled')).toBeTruthy();
    expect(within(rows[1]).getByText('Cash on delivery')).toBeTruthy();
    expect(list).toHaveBeenCalledWith(1, 10);
  });

  it('shows a friendly message when there are no orders', async () => {
    list.mockResolvedValue([]);
    render(<MyOrdersPage />);
    await waitFor(() => expect(screen.getByText(/have not placed any orders/i)).toBeTruthy());
    expect(screen.queryByRole('list')).toBeNull();
    expect(screen.queryByRole('navigation')).toBeNull();
  });

  it('shows the error and retries', async () => {
    list.mockRejectedValueOnce(apiError(401, 'Not authenticated')).mockResolvedValueOnce([makeSummary(1)]);
    render(<MyOrdersPage />);
    await waitFor(() => expect(screen.getByRole('alert').textContent).toMatch(/log in to see your orders/i));

    fireEvent.click(screen.getByRole('button', { name: /try again/i }));
    await waitFor(() => expect(screen.getByText('ORD-20261004-000001')).toBeTruthy());
    expect(list).toHaveBeenCalledTimes(2);
  });

  it('opens an order when View is pressed', async () => {
    list.mockResolvedValue([makeSummary(5)]);
    const onSelectOrder = vi.fn();
    render(<MyOrdersPage onSelectOrder={onSelectOrder} />);
    await waitFor(() => screen.getByText('ORD-20261004-000005'));

    fireEvent.click(screen.getByRole('button', { name: 'View order ORD-20261004-000005' }));
    expect(onSelectOrder).toHaveBeenCalledWith(5);
  });

  it('has no View buttons when nobody handles them', async () => {
    list.mockResolvedValue([makeSummary(5)]);
    render(<MyOrdersPage />);
    await waitFor(() => screen.getByText('ORD-20261004-000005'));
    expect(screen.queryByRole('button', { name: /view order/i })).toBeNull();
  });

  it('moves between pages, and only offers Next while pages are full', async () => {
    list.mockImplementation(async (page = 1) =>
      page === 1 ? [makeSummary(1), makeSummary(2)] : page === 2 ? [makeSummary(3), makeSummary(4)] : [makeSummary(5)]);
    render(<MyOrdersPage pageSize={2} />);
    await waitFor(() => screen.getByText('ORD-20261004-000001'));
    expect((screen.getByRole('button', { name: 'Previous' }) as HTMLButtonElement).disabled).toBe(true);

    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    await waitFor(() => screen.getByText('ORD-20261004-000003'));
    expect(list).toHaveBeenLastCalledWith(2, 2);
    expect(screen.getByText('Page 2')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    await waitFor(() => screen.getByText('ORD-20261004-000005'));
    expect((screen.getByRole('button', { name: 'Next' }) as HTMLButtonElement).disabled).toBe(true);

    fireEvent.click(screen.getByRole('button', { name: 'Previous' }));
    await waitFor(() => screen.getByText('ORD-20261004-000003'));
    expect(list).toHaveBeenLastCalledWith(2, 2);
  });

  it('says there are no more orders when a later page turns out to be empty', async () => {
    list.mockImplementation(async (page = 1) => (page === 1 ? [makeSummary(1), makeSummary(2)] : []));
    render(<MyOrdersPage pageSize={2} />);
    await waitFor(() => screen.getByText('ORD-20261004-000001'));
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    await waitFor(() => expect(screen.getByText('No more orders.')).toBeTruthy());
    expect(screen.queryByText(/have not placed/i)).toBeNull();
    expect((screen.getByRole('button', { name: 'Previous' }) as HTMLButtonElement).disabled).toBe(false);
  });
});
