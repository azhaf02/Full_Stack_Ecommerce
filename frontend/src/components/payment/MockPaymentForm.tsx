import { useState } from "react";

import { paymentService } from "../../services/paymentService";


interface MockPaymentFormProps {
  paymentId: number;
  onPaymentComplete?: (status: string) => void;
}


export default function MockPaymentForm({
  paymentId,
  onPaymentComplete,
}: MockPaymentFormProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [simulateFailure, setSimulateFailure] = useState(false);


  async function handlePayment() {
    setLoading(true);
    setResult("");
    setTransactionId("");

    try {
      // STEP 1:
      // The backend sends the request to the mock gateway.
      // The frontend never decides the final payment status.
      const processData = await paymentService.processMock(
        paymentId,
        simulateFailure
      );

      setTransactionId(processData.transaction_id);

      // STEP 2:
      // Verify only the transaction ID generated/stored by the backend.
      // No SUCCESS/FAILED status is sent by the frontend.
      const verifyData = await paymentService.verifyMock(
        paymentId,
        processData.transaction_id
      );

      if (verifyData.status === "SUCCESS") {
        setResult("Payment successful");
      } else {
        setResult("Payment failed");
      }

      onPaymentComplete?.(verifyData.status);
    } catch (error) {
      console.error("Mock payment error:", error);
      setResult("Unable to complete the mock payment.");
    } finally {
      setLoading(false);
    }
  }


  return (
    <section className="mx-auto max-w-lg rounded-xl bg-white p-6 shadow">
      <div className="mb-5">
        <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          Sandbox
        </p>

        <h2 className="mt-1 text-2xl font-bold text-gray-900">
          Mock Online Payment
        </h2>

        <p className="mt-2 text-sm text-gray-600">
          This is a simulated payment. Do not enter real card, bank,
          UPI, or other payment information.
        </p>
      </div>

      <div className="rounded-lg border border-gray-200 p-4">
        <p className="font-medium text-gray-900">
          Payment ID: {paymentId}
        </p>

        <label className="mt-4 flex items-center gap-3">
          <input
            type="checkbox"
            checked={simulateFailure}
            onChange={(event) =>
              setSimulateFailure(event.target.checked)
            }
            disabled={loading}
          />

          <span className="text-sm text-gray-700">
            Simulate failed payment
          </span>
        </label>

        <p className="mt-2 text-xs text-gray-500">
          Leave unchecked to simulate a successful payment. Enable it
          to test the FAILED workflow.
        </p>
      </div>

      <button
        type="button"
        onClick={handlePayment}
        disabled={loading}
        className="mt-6 w-full rounded-lg bg-green-700 px-4 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Processing..." : "Pay with Mock Gateway"}
      </button>

      {transactionId && (
        <div className="mt-5 rounded-lg bg-gray-100 p-4">
          <p className="text-xs font-semibold uppercase text-gray-500">
            Simulated Transaction ID
          </p>

          <p className="mt-1 break-all text-sm text-gray-900">
            {transactionId}
          </p>
        </div>
      )}

      {result && (
        <div
          role="status"
          className="mt-4 rounded-lg border p-4 text-sm font-semibold text-gray-900"
        >
          {result}
        </div>
      )}

      <p className="mt-5 text-xs text-gray-500">
        Payment status is controlled by the FastAPI backend after mock
        gateway verification. The frontend cannot mark a payment as
        successful.
      </p>
    </section>
  );
}