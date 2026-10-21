
import apiClient from './apiClient';
import type { InvoiceData } from '../components/payment/InvoiceView';

export const invoiceService = {
  async getInvoice(orderId: number): Promise<InvoiceData> {
    const response = await apiClient.get<InvoiceData>(
      `/api/orders/${orderId}/invoice`
    );
    return response.data;
  },
};
