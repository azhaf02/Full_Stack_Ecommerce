export type PaymentMethod = 'ONLINE' | 'COD';

// Money comes from the API as strings such as "1048.00".
export interface OrderItem {
  id: number;
  product_id: number;
  variant_id: number | null;
  quantity: number;
  unit_price: string;
}

export interface StatusHistoryEntry {
  previous_status: string | null;
  new_status: string;
  changed_by: number | null;
  remarks: string | null;
  changed_at: string; // UTC, no timezone suffix
}

export interface OrderActions {
  can_cancel: boolean;
  can_request_return: boolean;
  return_deadline: string | null; // last moment a return can be requested (UTC, no timezone suffix)
  allowed_next_statuses?: string[] | null; // admin responses only
}

export interface ReturnItem {
  order_item_id: number;
  quantity: number;
}

export interface OrderReturn {
  id: number;
  order_id: number;
  reason: string;
  status: string; // REQUESTED, APPROVED, REJECTED, RETURNED, REFUND_PENDING, REFUNDED
  admin_remarks: string | null;
  reviewed_at: string | null;
  refund_amount: string | null;
  requested_at: string;
  items: ReturnItem[];
}

// One row of GET /api/account/orders
export interface OrderSummary {
  id: number;
  order_number: string;
  status: string;
  payment_method: PaymentMethod;
  payment_status: string;
  total_amount: string;
  created_at: string;
}

export interface Order {
  id: number;
  order_number: string; // the human-readable Order ID, e.g. ORD-20261004-0EAC24
  status: string;
  payment_method: PaymentMethod;
  payment_status: string;
  subtotal: string;
  discount_amount: string;
  tax_amount: string;
  shipping_cost: string;
  total_amount: string;
  created_at: string;
  address_id: number;
  shipping_method_id: number;
  items: OrderItem[];
  status_history: StatusHistoryEntry[];
  returns: OrderReturn[];
  actions: OrderActions | null;
}

export interface ReturnRequestInput {
  reason: string;
  items: ReturnItem[];
}

// What the customer sends to place an order. There is no price here on purpose: the server prices the order.
export interface OrderLineInput {
  product_id: number;
  variant_id?: number | null;
  quantity: number;
}

export interface PlaceOrderInput {
  address_id: number;
  shipping_method_id: number;
  payment_method: PaymentMethod;
  items: OrderLineInput[];
}
