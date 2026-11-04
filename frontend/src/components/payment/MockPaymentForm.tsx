
import { useState } from "react";
import { paymentService } from "../../services/paymentService";

interface MockPaymentFormProps {
  paymentId: number;
  onPaymentComplete?: (status: string) => void;
  previewOnly?: boolean;
}

export default function MockPaymentForm({
  paymentId,
  onPaymentComplete,
  previewOnly = false,
}: MockPaymentFormProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [showInformation, setShowInformation] = useState(false);

  async function handlePayment() {
    if (previewOnly || loading) return;

    setLoading(true);
    setResult("");
    setTransactionId("");

    try {
      // Backend processes the selected mock payment scenario.
      const processData = await paymentService.processMock(
        paymentId,
        simulateFailure
      );

      setTransactionId(processData.transaction_id);

      // Backend verifies the generated transaction ID.
      const verifyData = await paymentService.verifyMock(
        paymentId,
        processData.transaction_id
      );

      setResult(
        verifyData.status === "SUCCESS" ? "SUCCESS" : "FAILED"
      );

      onPaymentComplete?.(verifyData.status);
    } catch (error) {
      console.error("Mock payment error:", error);
      setResult("ERROR");
    } finally {
      setLoading(false);
    }
  }

  const successful = result === "SUCCESS";
  const unsuccessful = result === "FAILED" || result === "ERROR";

  return (
    <main className="min-h-screen overflow-hidden bg-[#F4F0E7] text-[#28372A]">

      {/* Luxury navigation */}
      <header className="border-b border-[#ddd8c9] bg-[#F9F7F0]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-12">

          <div>
            <h1 className="font-serif text-3xl font-bold tracking-[0.22em] text-[#304431]">
              VIORA
            </h1>
            <p className="mt-1 text-[8px] font-semibold tracking-[0.32em] text-[#87917B]">
              EVERYTHING YOU NEED, ALL IN ONE PLACE
            </p>
          </div>

          <div className="flex items-center gap-2 text-[#68745E]">
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
            >
              <rect x="5" y="10" width="14" height="11" rx="2" />
              <path d="M8 10V7a4 4 0 0 1 8 0v3" />
            </svg>
            <span className="hidden text-[10px] font-semibold tracking-[0.15em] sm:block">
              SECURE CHECKOUT
            </span>
          </div>
        </div>
      </header>

      {/* Hero section */}
      <section className="relative overflow-hidden bg-[#293C2D] text-[#F7F3E9]">

        <div className="pointer-events-none absolute -right-20 -top-40 h-96 w-96 rounded-full border border-[#71836C]/30" />
        <div className="pointer-events-none absolute -right-4 -top-24 h-72 w-72 rounded-full border border-[#71836C]/20" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-8 px-6 py-14 sm:py-20 lg:grid-cols-[1.3fr_0.7fr] lg:px-12">

          <div>
            <p className="mb-5 text-[10px] font-semibold uppercase tracking-[0.35em] text-[#C3CEB5]">
              The final touch
            </p>

            <h2 className="max-w-2xl font-serif text-5xl leading-[1.12] sm:text-6xl lg:text-7xl">
              A beautiful
              <br />
              purchase begins
              <br />
              <span className="italic text-[#B9C7A9]">
                here.
              </span>
            </h2>

            <p className="mt-7 max-w-md text-sm leading-7 text-[#D4DCCC]">
              You're just one step away. Complete your payment
              and let us take care of the rest.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-[#82947B]/50 px-4 py-2 text-[9px] font-semibold tracking-[0.18em] text-[#D4DCCC]">
                01 &nbsp; DELIVERY
              </span>
              <span className="h-px w-7 bg-[#82947B]" />
              <span className="rounded-full bg-[#D7E0CC] px-4 py-2 text-[9px] font-bold tracking-[0.18em] text-[#293C2D]">
                02 &nbsp; PAYMENT
              </span>
              <span className="h-px w-7 bg-[#82947B]" />
              <span className="rounded-full border border-[#82947B]/50 px-4 py-2 text-[9px] font-semibold tracking-[0.18em] text-[#D4DCCC]">
                03 &nbsp; COMPLETE
              </span>
            </div>
          </div>

          <div className="hidden justify-end lg:flex">
            <div className="relative flex h-64 w-64 items-center justify-center rounded-full border border-[#9BAA8E]/40">
              <div className="absolute inset-4 rounded-full border border-[#9BAA8E]/30" />
              <div className="absolute inset-8 rounded-full border border-[#9BAA8E]/20" />
              <span className="font-serif text-8xl italic text-[#C6D2B9]">
                V
              </span>
              <span className="absolute bottom-8 text-[9px] tracking-[0.3em] text-[#C6D2B9]">
                MADE WITH CARE
              </span>
            </div>
          </div>

        </div>
      </section>

      {/* Checkout content */}
      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:px-12 lg:py-16">

        <div className="mb-10">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#89947D]">
            VIORA / CHECKOUT
          </p>
          <h3 className="mt-3 font-serif text-3xl text-[#304431] sm:text-4xl">
            Complete your payment
          </h3>
          <p className="mt-3 text-sm text-[#858A7B]">
            Choose your preferred simulation outcome below.
          </p>
        </div>

        <div className="grid items-start gap-8 lg:grid-cols-[1.5fr_0.8fr]">

          {/* Main payment card */}
          <section className="border border-[#E2DDCF] bg-[#FBFAF6] shadow-[0_20px_55px_rgba(47,62,46,0.07)]">

            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E9E5DA] px-6 py-6 sm:px-9">

              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-[#929783]">
                  PAYMENT DETAILS
                </p>
                <h4 className="mt-2 font-serif text-2xl text-[#304431]">
                  Your payment
                </h4>
              </div>

              <span className="border border-[#D7DDCD] bg-[#EDF1E8] px-4 py-2 text-[9px] font-bold tracking-[0.17em] text-[#52684D]">
                {previewOnly ? "DESIGN PREVIEW" : "SANDBOX"}
              </span>

            </div>

            <div className="space-y-8 p-6 sm:p-9">

              {/* Reference information */}
              <div className="flex items-center justify-between border-b border-[#E8E4D9] pb-6">
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#969B8A]">
                    PAYMENT REFERENCE
                  </p>
                  <p className="mt-2 font-serif text-xl text-[#304431]">
                    #{paymentId}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#969B8A]">
                    STATUS
                  </p>
                  <p className="mt-2 text-xs font-semibold text-[#718269]">
                    {successful
                      ? "Verified"
                      : unsuccessful
                      ? "Unsuccessful"
                      : "Awaiting payment"}
                  </p>
                </div>
              </div>

              {/* Payment outcome */}
              <div>
                <div className="mb-5">
                  <p className="font-serif text-2xl text-[#304431]">
                    Select an experience
                  </p>
                  <p className="mt-2 text-xs leading-6 text-[#929587]">
                    Choose a mock payment result to test your checkout.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">

                  {/* Successful payment */}
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => {
                      setSimulateFailure(false);
                      setResult("");
                      setTransactionId("");
                    }}
                    className={`group relative border p-5 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
                      !simulateFailure
                        ? "border-[#607B59] bg-[#EEF2E9] shadow-sm"
                        : "border-[#E7E3D8] bg-white hover:border-[#A7B39C]"
                    }`}
                  >
                    <div className="flex items-center justify-between">

                      <div className="flex h-11 w-11 items-center justify-center bg-[#DCE6D5] text-[#526B4E]">
                        <svg
                          viewBox="0 0 24 24"
                          className="h-5 w-5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.7"
                        >
                          <path d="m5 12 5 5L20 7" />
                        </svg>
                      </div>

                      <span className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                        !simulateFailure
                          ? "border-[#526B4E]"
                          : "border-[#D6D8CE]"
                      }`}>
                        {!simulateFailure && (
                          <span className="h-2.5 w-2.5 rounded-full bg-[#526B4E]" />
                        )}
                      </span>

                    </div>

                    <p className="mt-5 font-serif text-xl text-[#304431]">
                      Successful
                    </p>

                    <p className="mt-2 text-[11px] leading-5 text-[#8A9182]">
                      Experience a successful payment confirmation.
                    </p>

                    {!simulateFailure && (
                      <span className="absolute bottom-0 left-0 h-1 w-full bg-[#526B4E]" />
                    )}
                  </button>

                  {/* Failed payment */}
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => {
                      setSimulateFailure(true);
                      setResult("");
                      setTransactionId("");
                    }}
                    className={`group relative border p-5 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
                      simulateFailure
                        ? "border-[#AD8664] bg-[#F5EFE7] shadow-sm"
                        : "border-[#E7E3D8] bg-white hover:border-[#C6AD91]"
                    }`}
                  >
                    <div className="flex items-center justify-between">

                      <div className="flex h-11 w-11 items-center justify-center bg-[#EEE4D8] text-[#A47B54]">
                        <svg
                          viewBox="0 0 24 24"
                          className="h-5 w-5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.7"
                        >
                          <path d="m18 6-12 12M6 6l12 12" />
                        </svg>
                      </div>

                      <span className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                        simulateFailure
                          ? "border-[#A47B54]"
                          : "border-[#D6D8CE]"
                      }`}>
                        {simulateFailure && (
                          <span className="h-2.5 w-2.5 rounded-full bg-[#A47B54]" />
                        )}
                      </span>

                    </div>

                    <p className="mt-5 font-serif text-xl text-[#304431]">
                      Unsuccessful
                    </p>

                    <p className="mt-2 text-[11px] leading-5 text-[#8A9182]">
                      Experience an unsuccessful payment result.
                    </p>

                    {simulateFailure && (
                      <span className="absolute bottom-0 left-0 h-1 w-full bg-[#A47B54]" />
                    )}
                  </button>

                </div>
              </div>

              {/* Important notice */}
              <div className="flex gap-4 border-l-2 border-[#A1AD8D] bg-[#F2F2EA] p-5">

                <svg
                  viewBox="0 0 24 24"
                  className="mt-0.5 h-5 w-5 shrink-0 text-[#78866B]"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 11v5M12 8h.01" />
                </svg>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#52664C]">
                    Development environment
                  </p>
                  <p className="mt-2 text-xs leading-6 text-[#888D7E]">
                    This is a simulated payment gateway. Do not enter
                    real card numbers, UPI IDs, bank details or other
                    sensitive payment information.
                  </p>
                </div>

              </div>

              {/* Payment feedback */}
              {result && (
                <div
                  role="status"
                  className={`border p-5 transition-all duration-300 ${
                    successful
                      ? "border-[#B9C9AF] bg-[#EDF3E9]"
                      : "border-[#DEC6B6] bg-[#F7EEE8]"
                  }`}
                >
                  <div className="flex items-start gap-4">

                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center text-xl ${
                      successful
                        ? "bg-[#DCE8D5] text-[#496844]"
                        : "bg-[#EFE0D5] text-[#9B6549]"
                    }`}>
                      {successful ? "✓" : "!"}
                    </span>

                    <div>
                      <p className={`font-serif text-xl ${
                        successful ? "text-[#405D3B]" : "text-[#925E46]"
                      }`}>
                        {successful
                          ? "Payment verified"
                          : result === "ERROR"
                          ? "Something went wrong"
                          : "Payment unsuccessful"}
                      </p>

                      <p className="mt-2 text-xs leading-5 text-[#828878]">
                        {successful
                          ? "The backend has successfully verified this transaction."
                          : result === "ERROR"
                          ? "The payment could not be completed. Please check the server response."
                          : "The mock gateway returned an unsuccessful payment result."}
                      </p>
                    </div>

                  </div>
                </div>
              )}

              {/* Main action */}
              <div>
                <button
                  type="button"
                  onClick={handlePayment}
                  disabled={loading || previewOnly}
                  className="group flex w-full items-center justify-center gap-4 bg-[#304431] px-6 py-5 text-xs font-bold uppercase tracking-[0.2em] text-white shadow-[0_10px_25px_rgba(41,60,45,0.18)] transition-all duration-300 hover:-translate-y-1 hover:bg-[#405B40] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Verifying transaction
                    </>
                  ) : previewOnly ? (
                    <>
                      PREVIEW MODE
                      <span className="text-lg">→</span>
                    </>
                  ) : (
                    <>
                      Confirm payment
                      <span className="text-lg transition-transform group-hover:translate-x-2">
                        →
                      </span>
                    </>
                  )}
                </button>

                {previewOnly && (
                  <p className="mt-3 text-center text-[10px] tracking-wide text-[#969A8B]">
                    Payment processing is disabled in this preview.
                  </p>
                )}
              </div>

              {/* Transaction reference */}
              {transactionId && (
                <div className="border border-[#E4E1D7] bg-[#F5F4ED] p-5">
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#929783]">
                    TRANSACTION REFERENCE
                  </p>
                  <p className="mt-2 break-all text-xs font-semibold text-[#52684D]">
                    {transactionId}
                  </p>
                </div>
              )}

            </div>
          </section>

          {/* Sidebar */}
          <aside className="space-y-6">

            {/* Payment information */}
            <section className="border border-[#E2DDCF] bg-[#FBFAF6] p-6 shadow-[0_12px_35px_rgba(47,62,46,0.05)] sm:p-8">

              <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-[#969B8A]">
                YOUR CHECKOUT
              </p>

              <h4 className="mt-3 font-serif text-2xl text-[#304431]">
                Payment overview
              </h4>

              <div className="my-7 h-px bg-[#E8E4D9]" />

              <div className="space-y-6">

                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#8B9182]">
                    Payment reference
                  </span>
                  <span className="text-sm font-semibold text-[#304431]">
                    #{paymentId}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#8B9182]">
                    Payment method
                  </span>
                  <span className="text-xs font-semibold text-[#52684D]">
                    Online sandbox
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#8B9182]">
                    Gateway
                  </span>
                  <span className="text-[9px] font-bold tracking-[0.15em] text-[#52684D]">
                    MOCK
                  </span>
                </div>

              </div>

              <div className="my-7 h-px bg-[#E8E4D9]" />

              <div className="bg-[#EEF0E7] p-5">
                <p className="font-serif text-lg text-[#40553D]">
                  Your experience matters.
                </p>
                <p className="mt-2 text-xs leading-6 text-[#858C7C]">
                  Your transaction is processed and verified by
                  the backend before its payment status is updated.
                </p>
              </div>

            </section>

            {/* Interactive information */}
            <section className="border border-[#E2DDCF] bg-[#FBFAF6] p-6 sm:p-8">

              <button
                type="button"
                onClick={() => setShowInformation(!showInformation)}
                aria-expanded={showInformation}
                className="flex w-full items-center justify-between text-left"
              >
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#929783]">
                    PAYMENT GUIDE
                  </p>
                  <h4 className="mt-2 font-serif text-xl text-[#304431]">
                    How it works
                  </h4>
                </div>

                <span className={`flex h-9 w-9 items-center justify-center border border-[#DDE1D5] text-[#52684D] transition-transform duration-300 ${
                  showInformation ? "rotate-180" : ""
                }`}>
                  ↓
                </span>
              </button>

              {showInformation && (
                <div className="mt-6 space-y-5 border-t border-[#E8E4D9] pt-6">

                  {[
                    {
                      number: "01",
                      title: "Select an outcome",
                      text: "Choose the success or failure scenario."
                    },
                    {
                      number: "02",
                      title: "Gateway processing",
                      text: "The backend processes the mock payment."
                    },
                    {
                      number: "03",
                      title: "Transaction verification",
                      text: "The backend verifies the transaction ID and updates the result."
                    }
                  ].map((item) => (
                    <div key={item.number} className="flex gap-4">
                      <span className="font-serif text-lg italic text-[#91A184]">
                        {item.number}
                      </span>
                      <div>
                        <p className="text-xs font-bold text-[#40553D]">
                          {item.title}
                        </p>
                        <p className="mt-2 text-[11px] leading-5 text-[#929587]">
                          {item.text}
                        </p>
                      </div>
                    </div>
                  ))}

                </div>
              )}

            </section>

            {/* Brand message */}
            <section className="relative overflow-hidden bg-[#293C2D] p-7 text-[#F7F3E9]">

              <span className="absolute -right-3 -top-8 font-serif text-9xl italic text-white/[0.06]">
                V
              </span>

              <p className="relative text-[9px] font-bold uppercase tracking-[0.25em] text-[#BAC8AD]">
                A NOTE FROM VIORA
              </p>

              <h4 className="relative mt-4 font-serif text-2xl italic leading-relaxed">
                "The little things make a beautiful difference."
              </h4>

              <div className="relative mt-6 h-px w-12 bg-[#9DAC8E]" />

              <p className="relative mt-4 text-[9px] tracking-[0.2em] text-[#CAD4C1]">
                EVERYTHING YOU NEED, ALL IN ONE PLACE
              </p>

            </section>

          </aside>
        </div>

        {/* Footer */}
        <footer className="mt-16 border-t border-[#DDD9CD] py-7">
          <div className="flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">

            <div>
              <p className="font-serif text-xl font-bold tracking-[0.2em] text-[#304431]">
                VIORA
              </p>
              <p className="mt-1 text-[8px] tracking-[0.25em] text-[#929783]">
                THOUGHTFULLY SELECTED. BEAUTIFULLY DELIVERED.
              </p>
            </div>

            <p className="text-[9px] tracking-[0.1em] text-[#929783]">
              © VIORA · ALL RIGHTS RESERVED
            </p>

          </div>
        </footer>

      </section>
    </main>
  );
}
