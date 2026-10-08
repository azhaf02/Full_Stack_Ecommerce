// Data shapes for the admin pages. The lists are empty until each page is
// connected to its FastAPI endpoint through services/adminService.ts.

export interface Order {
  id: number;
  orderNumber: string;
  customer: string;
  date: string;
  paymentMethod: string;
  total: number;
  status: string;
}

export interface OrderItem {
  id: number;
  name: string;
  variant: string;
  qty: number;
  price: number;
}

export interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  joined: string;
  status: string;
}

export interface Payment {
  id: string;
  orderId: number;
  orderNumber: string;
  customer: string;
  method: string;
  amount: number;
  date: string;
  status: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

export const orders: Order[] = [];

// Extra details shown on the order detail page
export const orderDetailExtras: { email: string; phone: string; address: string; items: OrderItem[] } = {
  email: "",
  phone: "",
  address: "",
  items: [],
};

// Which status each status may move to next (from the plan's order lifecycle)
export const allowedTransitions: Record<string, string[]> = {
  PLACED: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["PACKED", "CANCELLED"],
  PACKED: ["SHIPPED"],
  SHIPPED: ["OUT_FOR_DELIVERY"],
  OUT_FOR_DELIVERY: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

export const customers: Customer[] = [];

export const payments: Payment[] = [];

// The admin who is currently logged in (later this comes from AuthContext)
export const CURRENT_ADMIN_ID = 100;

export const users: User[] = [];
