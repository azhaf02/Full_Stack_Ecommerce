// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import CancelOrderButton from '../CancelOrderButton';
import { orderService } from '../../services/orderService';
import { apiError, makeOrder, noActions } from '../../test-utils/orderFixtures';

vi.mock('../../services/orderService', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../services/orderService')>();
  return { ...original, orderService: { ...original.orderService, cancel: vi.fn() } };
});

const cancel = vi.mocked(orderService.cancel);
const cancellable = makeOrder({ actions: { ...noActions, can_cancel: true } });

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('CancelOrderButton', () => {
  it('shows nothing when the order can no longer be cancelled', () => {
    const { container } = render(<CancelOrderButton order={makeOrder()} onCancelled={vi.fn()} />);
    expect(container.innerHTML).toBe('');
  });

  it('shows nothing when the server sent no actions', () => {
    const { container } = render(<CancelOrderButton order={makeOrder({ actions: null })} onCancelled={vi.fn()} />);
    expect(container.innerHTML).toBe('');
  });

  it('asks for confirmation first and does not call the API yet', () => {
    render(<CancelOrderButton order={cancellable} onCancelled={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel order' }));
    expect(screen.getByText(/cancel order ORD-20261004-0EAC24\?/i)).toBeTruthy();
    expect(cancel).not.toHaveBeenCalled();
  });

  it('promises a refund for a paid order and a clear message for an unpaid one', () => {
    const { unmount } = render(<CancelOrderButton order={cancellable} onCancelled={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel order' }));
    expect(screen.getByText(/payment will be refunded/i)).toBeTruthy();
    unmount();

    render(<CancelOrderButton order={{ ...cancellable, payment_method: 'COD', payment_status: 'PENDING' }} onCancelled={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel order' }));
    expect(screen.getByText(/not been charged yet/i)).toBeTruthy();
  });

  it('goes back to the button when the customer keeps the order', () => {
    render(<CancelOrderButton order={cancellable} onCancelled={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel order' }));
    fireEvent.click(screen.getByRole('button', { name: 'Keep order' }));
    expect(screen.getByRole('button', { name: 'Cancel order' })).toBeTruthy();
    expect(cancel).not.toHaveBeenCalled();
  });

  it('cancels with the reason and passes the updated order to the page', async () => {
    const updated = makeOrder({ status: 'CANCELLED', actions: noActions });
    cancel.mockResolvedValue(updated);
    const onCancelled = vi.fn();
    render(<CancelOrderButton order={cancellable} onCancelled={onCancelled} />);

    fireEvent.click(screen.getByRole('button', { name: 'Cancel order' }));
    fireEvent.change(screen.getByLabelText(/reason/i), { target: { value: '  ordered by mistake ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Yes, cancel order' }));

    await waitFor(() => expect(onCancelled).toHaveBeenCalledWith(updated));
    expect(cancel).toHaveBeenCalledWith(7, 'ordered by mistake');
  });

  it('sends no reason when the box is left empty', async () => {
    cancel.mockResolvedValue(makeOrder({ status: 'CANCELLED' }));
    render(<CancelOrderButton order={cancellable} onCancelled={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel order' }));
    fireEvent.click(screen.getByRole('button', { name: 'Yes, cancel order' }));
    await waitFor(() => expect(cancel).toHaveBeenCalledWith(7, undefined));
  });

  it('shows the server message and lets the customer try again when cancelling fails', async () => {
    cancel.mockRejectedValue(apiError(409, 'Order ORD-20261004-0EAC24 is PACKED and can no longer be cancelled'));
    const onCancelled = vi.fn();
    render(<CancelOrderButton order={cancellable} onCancelled={onCancelled} />);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel order' }));
    fireEvent.click(screen.getByRole('button', { name: 'Yes, cancel order' }));

    await waitFor(() => expect(screen.getByRole('alert').textContent).toMatch(/can no longer be cancelled/));
    expect(onCancelled).not.toHaveBeenCalled();
    expect((screen.getByRole('button', { name: 'Yes, cancel order' }) as HTMLButtonElement).disabled).toBe(false);
  });

  it('cannot be submitted twice while the request is running', async () => {
    let finish: (order: ReturnType<typeof makeOrder>) => void = () => {};
    cancel.mockReturnValue(new Promise((resolve) => { finish = resolve; }));
    render(<CancelOrderButton order={cancellable} onCancelled={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel order' }));

    const confirm = screen.getByRole('button', { name: 'Yes, cancel order' });
    fireEvent.click(confirm);
    await waitFor(() => expect((screen.getByRole('button', { name: /cancelling/i }) as HTMLButtonElement).disabled).toBe(true));
    fireEvent.click(screen.getByRole('button', { name: /cancelling/i }));
    expect(cancel).toHaveBeenCalledTimes(1);
    finish(makeOrder({ status: 'CANCELLED' }));
  });
});
