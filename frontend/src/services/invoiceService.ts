
import apiClient from './apiClient';
import type { InvoiceData } from '../components/payment/InvoiceView';

export const invoiceService = {
  async getInvoice(orderId: number): Promise<InvoiceData> {
    const response = await apiClient.get<InvoiceData>(
      `/api/orders/${orderId}/invoice`
    );

    return response.data;
  },

  async downloadInvoice(orderId: number): Promise<void> {
    const response = await apiClient.get<Blob>(
      `/api/orders/${orderId}/invoice/pdf`,
      {
        responseType: 'blob',
      }
    );

    const pdfBlob = new Blob([response.data], {
      type: 'application/pdf',
    });

    const downloadUrl = window.URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');

    link.href = downloadUrl;
    link.download = `VIORA-Invoice-${orderId}.pdf`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    window.URL.revokeObjectURL(downloadUrl);
  },
};
