// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { orderRoutes, parseOrderId } from '../orderRoutes';
import { orderService } from '../../services/orderService';
import { makeOrder, makeSummary } from '../../test-utils/orderFixtures';

vi.mock('../../services/orderService', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../services/orderService')>();
  return { ...original, orderService: { ...original.orderService, list: vi.fn(), get: vi.fn() } };
});

const list = vi.mocked(orderService.list);
const get = vi.mocked(orderService.get);

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function Where() {
  return <div data-testid="where">{useLocation().pathname}</div>;
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        {orderRoutes}
        <Route path="*" element={<div>the dashboard</div>} />
      </Routes>
      <Where />
    </MemoryRouter>,
  );
}

describe('parseOrderId', () => {
  it('accepts positive whole numbers only', () => {
    expect(parseOrderId('12')).toBe(12);
    for (const bad of ['abc', '0', '-3', '1.5', '', '12abc', ' 7', undefined]) {
      expect(parseOrderId(bad)).toBeNull();
    }
  });
});

describe('order routes', () => {
  it('shows my orders at /orders', async () => {
    list.mockResolvedValue([makeSummary(5)]);
    renderAt('/orders');
    await waitFor(() => expect(screen.getByText('ORD-20261004-000005')).toBeTruthy());
    expect(screen.getByRole('heading', { name: 'My orders' })).toBeTruthy();
    expect(screen.getByRole('link', { name: /back to dashboard/i }).getAttribute('href')).toBe('/');
  });

  it('opens an order from the list, and comes back', async () => {
    list.mockResolvedValue([makeSummary(5)]);
    get.mockResolvedValue(makeOrder({ id: 5, order_number: 'ORD-20261004-000005' }));
    renderAt('/orders');
    await waitFor(() => screen.getByText('ORD-20261004-000005'));

    fireEvent.click(screen.getByRole('button', { name: 'View order ORD-20261004-000005' }));
    await waitFor(() => expect(screen.getByTestId('order-number').textContent).toBe('ORD-20261004-000005'));
    expect(screen.getByTestId('where').textContent).toBe('/orders/5');
    expect(get).toHaveBeenCalledWith(5);

    fireEvent.click(screen.getByRole('button', { name: /back to my orders/i }));
    await waitFor(() => expect(screen.getByRole('heading', { name: 'My orders' })).toBeTruthy());
    expect(screen.getByTestId('where').textContent).toBe('/orders');
  });

  it('shows the confirmation page with its Order ID, and its buttons navigate', async () => {
    list.mockResolvedValue([makeSummary(7)]);
    get.mockResolvedValue(makeOrder());
    renderAt('/orders/7/confirmation');
    await waitFor(() => expect(screen.getByTestId('order-id').textContent).toBe('ORD-20261004-0EAC24'));
    expect(get).toHaveBeenCalledWith(7);

    fireEvent.click(screen.getByRole('button', { name: /view my orders/i }));
    await waitFor(() => expect(screen.getByTestId('where').textContent).toBe('/orders'));
  });

  it('continue shopping goes to the dashboard', async () => {
    get.mockResolvedValue(makeOrder());
    renderAt('/orders/7/confirmation');
    await waitFor(() => screen.getByTestId('order-id'));
    fireEvent.click(screen.getByRole('button', { name: /continue shopping/i }));
    await waitFor(() => expect(screen.getByText('the dashboard')).toBeTruthy());
  });

  it.each(['/orders/abc', '/orders/0', '/orders/-3', '/orders/abc/confirmation'])(
    'shows a friendly message for a bad order id (%s) without calling the API',
    (path) => {
      renderAt(path);
      expect(screen.getByRole('alert').textContent).toMatch(/could not find that order/i);
      expect(screen.getByRole('link', { name: /see all your orders/i }).getAttribute('href')).toBe('/orders');
      expect(get).not.toHaveBeenCalled();
    },
  );

  it('loads the new order when the id in the address changes', async () => {
    get.mockImplementation(async (id) => makeOrder({ id, order_number: `ORD-${id}` }));
    list.mockResolvedValue([]);
    renderAt('/orders/1');
    await waitFor(() => expect(screen.getByTestId('order-number').textContent).toBe('ORD-1'));
  });

  it('leaves every other address to the dashboard', () => {
    renderAt('/anything/else');
    expect(screen.getByText('the dashboard')).toBeTruthy();
    expect(list).not.toHaveBeenCalled();
  });
});
