
import { useEffect, useState } from "react";
import axios from "axios";
import {
  paymentService,
  type PaymentHistoryRecord,
} from "../services/paymentService";

export default function PaymentHistoryPage() {
  const [payments, setPayments] = useState<PaymentHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryingId, setRetryingId] = useState<number | null>(null);
  const [retryMessage, setRetryMessage] = useState("");

  async function loadPayments() {
    try {
      setError("");
      const data = await paymentService.getPaymentHistory();
      setPayments(data);
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        setError("Please log in to view your payment history.");
      } else {
        setError("Unable to load payment history. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadPayments();
  }, []);

  async function handleRetry(payment: PaymentHistoryRecord) {
    setRetryingId(payment.payment_id);
    setError("");
    setRetryMessage("");

    try {
      const attempt = await paymentService.processMock(
        payment.payment_id,
        false
      );

      await paymentService.verifyMock(
        payment.payment_id,
        attempt.transaction_id
      );

      setRetryMessage(
        `Payment retry completed for Order #${payment.order_id}.`
      );

      await loadPayments();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const detail = err.response?.data?.detail;
        setError(
          typeof detail === "string"
            ? detail
            : "Payment retry failed. Please try again."
        );
      } else {
        setError("Payment retry failed. Please try again.");
      }
    } finally {
      setRetryingId(null);
    }
  }

  const cellStyle: React.CSSProperties = {
    padding: "12px",
    borderBottom: "1px solid #ddd",
    textAlign: "left",
    whiteSpace: "nowrap",
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f4f1ea",
        padding: "32px 16px",
        color: "#252525",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <h1>Payment History</h1>
        <p>Review payments associated with your orders.</p>

        {loading && <p>Loading payment history...</p>}

        {!loading && error && (
          <p role="alert" style={{ color: "#b42318" }}>
            {error}
          </p>
        )}

        {retryMessage && (
          <p role="status" style={{ color: "#18794e" }}>
            {retryMessage}
          </p>
        )}

        {!loading && !error && payments.length === 0 && (
          <p>No payment records found.</p>
        )}

        {!loading && payments.length > 0 && (
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                background: "#fff",
              }}
            >
              <thead>
                <tr>
                  {[
                    "Payment ID",
                    "Order ID",
                    "Date",
                    "Method",
                    "Amount",
                    "Status",
                    "Transaction ID",
                    "Action",
                  ].map((heading) => (
                    <th key={heading} style={cellStyle}>
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.payment_id}>
                    <td style={cellStyle}>{payment.payment_id}</td>
                    <td style={cellStyle}>{payment.order_id}</td>
                    <td style={cellStyle}>
                      {payment.created_at
                        ? new Date(payment.created_at).toLocaleString()
                        : "—"}
                    </td>
                    <td style={cellStyle}>{payment.method}</td>
                    <td style={cellStyle}>
                      ₹{Number(payment.amount).toFixed(2)}
                    </td>
                    <td style={cellStyle}>
                      <strong>{payment.status}</strong>
                    </td>
                    <td style={cellStyle}>
                      {payment.transaction_id || "—"}
                    </td>
                    <td style={cellStyle}>
                      {payment.status === "FAILED" &&
                      payment.method === "ONLINE" ? (
                        <button
                          type="button"
                          disabled={retryingId !== null}
                          onClick={() => void handleRetry(payment)}
                          style={{
                            padding: "8px 12px",
                            border: "none",
                            borderRadius: 6,
                            background:
                              retryingId === payment.payment_id
                                ? "#999"
                                : "#252525",
                            color: "#fff",
                            cursor:
                              retryingId !== null ? "not-allowed" : "pointer",
                            opacity:
                              retryingId !== null &&
                              retryingId !== payment.payment_id
                                ? 0.6
                                : 1,
                          }}
                        >
                          {retryingId === payment.payment_id
                            ? "Retrying..."
                            : "Retry Payment"}
                        </button>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
