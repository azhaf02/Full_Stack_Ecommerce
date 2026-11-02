
import { useState } from "react";

export type InvoiceData = {
  invoice_id: number;
  invoice_number: string;
  issued_at: string;
  order_id: number;
  order_number: string;
  customer_id: number;
  customer_name: string;
  customer_email: string;
  subtotal: number | string;
  discount_amount: number | string;
  tax_amount: number | string;
  shipping_cost: number | string;
  total_amount: number | string;
  payment_method: string;
  payment_status: string;
  items: {
    product_id: number;
    variant_id: number | null;
    quantity: number;
    unit_price: number | string;
    line_total: number | string;
  }[];
};

type Props = {
  invoice: InvoiceData;
};

const money = (value: number | string) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(Number(value));

export default function InvoiceView({ invoice }: Props) {
  const [showDetails, setShowDetails] = useState(true);

  const paid = invoice.payment_status === "SUCCESS";

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="viora-invoice-page">
      <style>{`
        .viora-invoice-page {
          min-height: 100vh;
          padding: 40px 20px;
          background: #f5f6f0;
          color: #29321e;
          font-family: Inter, Arial, sans-serif;
        }

        .viora-invoice-card {
          max-width: 900px;
          margin: auto;
          background: white;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 15px 45px rgba(47, 65, 31, 0.1);
        }

        .viora-invoice-header {
          background: linear-gradient(135deg, #4d572f, #768553);
          color: white;
          padding: 38px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 20px;
        }

        .viora-invoice-brand {
          font-size: 32px;
          font-weight: 800;
          letter-spacing: 5px;
        }

        .viora-invoice-content {
          padding: 38px;
        }

        .viora-invoice-meta {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 25px;
          margin-bottom: 32px;
        }

        .viora-invoice-label {
          color: #7a856c;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 8px;
        }

        .viora-invoice-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 18px;
        }

        .viora-invoice-table th {
          background: #edf1e6;
          color: #4d572f;
          text-align: left;
          padding: 15px;
        }

        .viora-invoice-table td {
          padding: 15px;
          border-bottom: 1px solid #e8ecdf;
        }

        .viora-invoice-summary {
          max-width: 340px;
          margin: 30px 0 0 auto;
        }

        .viora-invoice-summary div {
          display: flex;
          justify-content: space-between;
          padding: 9px 0;
        }

        .viora-invoice-total {
          border-top: 2px solid #5f6b3a;
          font-size: 20px;
          font-weight: 800;
          color: #4d572f;
        }

        .viora-invoice-status {
          display: inline-block;
          padding: 8px 16px;
          border-radius: 30px;
          background: #e8f3e4;
          color: #356b38;
          font-weight: 700;
        }

        .viora-invoice-status.pending {
          background: #fff1d7;
          color: #956116;
        }

        .viora-invoice-actions {
          max-width: 900px;
          margin: 25px auto;
          display: flex;
          justify-content: center;
          flex-wrap: wrap;
          gap: 12px;
        }

        .viora-invoice-button {
          background: #5f6b3a;
          color: white;
          border: none;
          padding: 13px 24px;
          border-radius: 10px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          transition: transform 0.2s, background 0.2s;
        }

        .viora-invoice-button:hover {
          background: #4d572f;
          transform: translateY(-2px);
        }

        .viora-invoice-button.secondary {
          background: white;
          color: #4d572f;
          border: 1px solid #b8c2a7;
        }

        .viora-invoice-footer {
          text-align: center;
          padding: 25px;
          background: #f8faf5;
          color: #718063;
          font-size: 13px;
        }

        @media (max-width: 600px) {
          .viora-invoice-content,
          .viora-invoice-header {
            padding: 22px;
          }

          .viora-invoice-meta {
            grid-template-columns: 1fr;
          }

          .viora-invoice-table th,
          .viora-invoice-table td {
            padding: 9px;
            font-size: 12px;
          }
        }

        @media print {
          @page { margin: 12mm; }

          body { background: white !important; }

          .viora-invoice-page {
            padding: 0;
            background: white;
          }

          .viora-invoice-card {
            box-shadow: none;
            border-radius: 0;
            max-width: none;
          }

          .viora-invoice-actions {
            display: none !important;
          }
        }
      `}</style>

      <div className="viora-invoice-actions">
        <button
          className="viora-invoice-button"
          onClick={handlePrint}
        >
          Print Invoice
        </button>

        <button
           className="viora-invoice-button"
           onClick={handlePrint}
         >
           Print / Save as PDF
      </button>

        <button
          className="viora-invoice-button secondary"
          onClick={() => setShowDetails(!showDetails)}
        >
          {showDetails ? "Hide Details" : "Show Details"}
        </button>
      </div>

      <div className="viora-invoice-card">
        <div className="viora-invoice-header">
          <div>
            <div className="viora-invoice-brand">VIORA</div>
            <p>Thank you for shopping with us.</p>
          </div>

          <div>
            <h1>INVOICE</h1>
            <p>{invoice.invoice_number}</p>
          </div>
        </div>

        <div className="viora-invoice-content">
          <div className="viora-invoice-meta">
            <div>
              <p className="viora-invoice-label">Billed To</p>
              <strong>{invoice.customer_name}</strong>
              <p>{invoice.customer_email}</p>
            </div>

            <div>
              <p className="viora-invoice-label">Order Details</p>
              <p>Order: {invoice.order_number}</p>
              <p>
                Date:{" "}
                {new Date(invoice.issued_at).toLocaleDateString("en-IN")}
              </p>
            </div>
          </div>

          <div className="viora-invoice-meta">
            <div>
              <p className="viora-invoice-label">Payment Method</p>
              <strong>{invoice.payment_method}</strong>
            </div>

            <div>
              <p className="viora-invoice-label">Payment Status</p>
              <span
                className={`viora-invoice-status ${
                  paid ? "" : "pending"
                }`}
              >
                {invoice.payment_status.replace(/_/g, " ")}
              </span>
            </div>
          </div>

          {showDetails && (
            <>
              <h3>Purchased Items</h3>

              <table className="viora-invoice-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Unit Price</th>
                    <th>Total</th>
                  </tr>
                </thead>

                <tbody>
                  {invoice.items.map((item, index) => (
                    <tr key={`${item.product_id}-${index}`}>
                      <td>Product #{item.product_id}</td>
                      <td>{item.quantity}</td>
                      <td>{money(item.unit_price)}</td>
                      <td>{money(item.line_total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="viora-invoice-summary">
                <div>
                  <span>Subtotal</span>
                  <span>{money(invoice.subtotal)}</span>
                </div>

                <div>
                  <span>Discount</span>
                  <span>- {money(invoice.discount_amount)}</span>
                </div>

                <div>
                  <span>Tax</span>
                  <span>{money(invoice.tax_amount)}</span>
                </div>

                <div>
                  <span>Shipping</span>
                  <span>{money(invoice.shipping_cost)}</span>
                </div>

                <div className="viora-invoice-total">
                  <span>Total</span>
                  <span>{money(invoice.total_amount)}</span>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="viora-invoice-footer">
          VIORA • Find Your Vibe
          <p>Thank you for being part of our journey.</p>
        </div>
      </div>
    </div>
  );
}
