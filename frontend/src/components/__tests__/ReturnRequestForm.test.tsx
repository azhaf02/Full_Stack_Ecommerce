// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ReturnRequestForm from '../ReturnRequestForm';
import { orderService } from '../../services/orderService';
import { apiError, makeOrder, makeReturn } from '../../test-utils/orderFixtures';

vi.mock('../../services/orderService', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../services/orderService')>();
  return { ...original, orderService: { ...original.orderService, requestReturn: vi.fn() } };
});

const requestReturn = vi.mocked(orderService.requestReturn);
const order = makeOrder({ status: 'DELIVERED' }); // item 1: Product #4 x2, item 2: Product #3 (variant 1) x1

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const tick = (name: RegExp) => fireEvent.click(screen.getByRole('checkbox', { name }));
const setReason = (text: string) => fireEvent.change(screen.getByLabelText('Reason for return'), { target: { value: text } });
const send = () => fireEvent.click(screen.getByRole('button', { name: 'Send return request' }));

describe('ReturnRequestForm', () => {
  it('lists every item, with the quantity picker locked until the item is ticked', () => {
    render(<ReturnRequestForm order={order} onSubmitted={vi.fn()} />);
    expect(screen.getAllByRole('checkbox')).toHaveLength(2);
    const picker = screen.getByLabelText('Quantity to return for Product #4') as HTMLSelectElement;
    expect(picker.disabled).toBe(true);

    tick(/Product #4/);
    expect(picker.disabled).toBe(false);
  });

  it('only offers quantities up to what was ordered', () => {
    render(<ReturnRequestForm order={order} onSubmitted={vi.fn()} />);
    const two = screen.getByLabelText('Quantity to return for Product #4');
    expect(within(two).getAllByRole('option').map((o) => o.textContent)).toEqual(['1', '2']);
    const one = screen.getByLabelText('Quantity to return for Product #3 (variant 1)');
    expect(within(one).getAllByRole('option').map((o) => o.textContent)).toEqual(['1']);
  });

  it('asks for an item before sending anything', () => {
    render(<ReturnRequestForm order={order} onSubmitted={vi.fn()} />);
    setReason('damaged');
    send();
    expect(screen.getByRole('alert').textContent).toMatch(/choose at least one item/i);
    expect(requestReturn).not.toHaveBeenCalled();
  });

  it('asks for a reason before sending anything, and treats spaces as empty', () => {
    render(<ReturnRequestForm order={order} onSubmitted={vi.fn()} />);
    tick(/Product #4/);
    setReason('    ');
    send();
    expect(screen.getByRole('alert').textContent).toMatch(/why you are returning/i);
    expect(requestReturn).not.toHaveBeenCalled();
  });

  it('sends the ticked items with their quantities and the trimmed reason', async () => {
    const created = makeReturn();
    requestReturn.mockResolvedValue(created);
    const onSubmitted = vi.fn();
    render(<ReturnRequestForm order={order} onSubmitted={onSubmitted} />);

    tick(/Product #4/);
    fireEvent.change(screen.getByLabelText('Quantity to return for Product #4'), { target: { value: '2' } });
    tick(/Product #3/);
    setReason('  wrong size ');
    send();

    await waitFor(() => expect(onSubmitted).toHaveBeenCalledWith(created));
    expect(requestReturn).toHaveBeenCalledWith(7, {
      reason: 'wrong size',
      items: [{ order_item_id: 1, quantity: 2 }, { order_item_id: 2, quantity: 1 }],
    });
  });

  it('leaves out an item that was ticked and then unticked', async () => {
    requestReturn.mockResolvedValue(makeReturn());
    render(<ReturnRequestForm order={order} onSubmitted={vi.fn()} />);
    tick(/Product #4/);
    tick(/Product #3/);
    tick(/Product #3/);
    setReason('damaged');
    send();
    await waitFor(() => expect(requestReturn).toHaveBeenCalled());
    expect(requestReturn.mock.calls[0][1].items).toEqual([{ order_item_id: 1, quantity: 1 }]);
  });

  it('shows the server message when the return window has closed', async () => {
    requestReturn.mockRejectedValue(apiError(409, 'The 7-day return window for order ORD-20261004-0EAC24 has closed'));
    const onSubmitted = vi.fn();
    render(<ReturnRequestForm order={order} onSubmitted={onSubmitted} />);
    tick(/Product #4/);
    setReason('damaged');
    send();

    await waitFor(() => expect(screen.getByRole('alert').textContent).toMatch(/return window/));
    expect(onSubmitted).not.toHaveBeenCalled();
    expect((screen.getByRole('button', { name: 'Send return request' }) as HTMLButtonElement).disabled).toBe(false);
  });

  it('closes when asked', () => {
    const onClose = vi.fn();
    render(<ReturnRequestForm order={order} onSubmitted={vi.fn()} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('has no Close button when no handler is given', () => {
    render(<ReturnRequestForm order={order} onSubmitted={vi.fn()} />);
    expect(screen.queryByRole('button', { name: 'Close' })).toBeNull();
  });
});
