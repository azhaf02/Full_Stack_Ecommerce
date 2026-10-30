import { AxiosError } from 'axios';
import type { Order, OrderActions, OrderReturn, OrderSummary } from '../types/order';

export const noActions: OrderActions = { can_cancel: false, can_request_return: false, return_deadline: null };

export function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 7,
    order_number: 'ORD-20261004-0EAC24',
    status: 'CONFIRMED',
    payment_method: 'ONLINE',
    payment_status: 'SUCCESS',
    subtotal: '4497.00',
    discount_amount: '0.00',
    tax_amount: '0.00',
    shipping_cost: '50.00',
    total_amount: '4547.00',
    created_at: '2026-10-04T01:30:25',
    address_id: 1,
    shipping_method_id: 2,
    items: [
      { id: 1, product_id: 4, variant_id: null, quantity: 2, unit_price: '1599.00' },
      { id: 2, product_id: 3, variant_id: 1, quantity: 1, unit_price: '1299.00' },
    ],
    status_history: [
      { previous_status: null, new_status: 'PLACED', changed_by: 1, remarks: 'Order placed', changed_at: '2026-10-04T01:30:25' },
      { previous_status: 'PLACED', new_status: 'CONFIRMED', changed_by: 1, remarks: 'Payment verified', changed_at: '2026-10-04T01:31:00' },
    ],
    returns: [],
    actions: { ...noActions },
    ...overrides,
  };
}

export function makeSummary(id: number, overrides: Partial<OrderSummary> = {}): OrderSummary {
  return {
    id,
    order_number: `ORD-20261004-${String(id).padStart(6, '0')}`,
    status: 'CONFIRMED',
    payment_method: 'COD',
    payment_status: 'PENDING',
    total_amount: '1048.00',
    created_at: '2026-10-04T01:30:25',
    ...overrides,
  };
}

export function makeReturn(overrides: Partial<OrderReturn> = {}): OrderReturn {
  return {
    id: 3,
    order_id: 7,
    reason: 'Damaged on arrival',
    status: 'REQUESTED',
    admin_remarks: null,
    reviewed_at: null,
    refund_amount: null,
    requested_at: '2026-10-05T08:00:00',
    items: [{ order_item_id: 1, quantity: 1 }],
    ...overrides,
  };
}

/** An error like the one axios throws when the API answers with a status and a `detail` message. */
export function apiError(status: number, detail: string): AxiosError {
  return new AxiosError('Request failed', 'ERR_BAD_REQUEST', undefined, undefined, {
    status, statusText: '', headers: {}, config: {} as never, data: { detail },
  });
}
