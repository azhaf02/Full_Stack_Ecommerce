import axios from "axios";

const TOKEN_KEY = "viora_token";

const client = axios.create({
  baseURL: "http://localhost:8000",
  headers: {
    "Content-Type": "application/json",
  },
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});


export interface PaymentByOrder {
  payment_id: number;
  order_id: number;
  method: "ONLINE" | "COD";
  status: string;
  transaction_id: string | null;
}

export interface MockPaymentProcessResponse {
  payment_id: number;
  transaction_id: string;
  gateway_status: string;
  message: string;
}

export interface MockPaymentVerifyResponse {
  payment_id: number;
  transaction_id: string;
  status: string;
  message: string;
}


export const paymentService = {
  getByOrder: (orderId: number) =>
    client
      .get<PaymentByOrder>(`/api/payment/order/${orderId}`)
      .then((response) => response.data),

  processMock: (
    paymentId: number,
    simulateFailure: boolean = false
  ) =>
    client
      .post<MockPaymentProcessResponse>(
        "/api/payment/mock/process",
        {
          payment_id: paymentId,
          simulate_failure: simulateFailure,
        }
      )
      .then((response) => response.data),

  verifyMock: (
    paymentId: number,
    transactionId: string
  ) =>
    client
      .post<MockPaymentVerifyResponse>(
        "/api/payment/mock/verify",
        {
          payment_id: paymentId,
          transaction_id: transactionId,
        }
      )
      .then((response) => response.data),
};