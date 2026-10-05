import { useState } from "react";
import AddressStep from "../components/AddressStep";

const initialAddress = {
  fullName: "",
  mobile: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  pincode: "",
  country: "India",
};

const shippingMethods = [
  {
    id: "standard",
    name: "Standard Delivery",
    description: "Estimated delivery in 5–7 business days",
    price: 0,
  },
  {
    id: "express",
    name: "Express Delivery",
    description: "Estimated delivery in 2–3 business days",
    price: 99,
  },
  {
    id: "same-day",
    name: "Same Day Delivery",
    description: "Subject to location and availability",
    price: 199,
  },
];

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);

function CheckoutPage() {
  const [step, setStep] = useState(1);
  const [address, setAddress] = useState(initialAddress);
  const [billingAddress, setBillingAddress] = useState(initialAddress);
  const [shipping, setShipping] = useState("standard");
  const [message, setMessage] = useState("");

  const subtotal = 2000;

  const selectedShipping = shippingMethods.find(
    (method) => method.id === shipping
  );

  const shippingCharge = selectedShipping?.price ?? 0;
  const total = subtotal + shippingCharge;

  const continueToReview = () => {
    setMessage("");

    if (!selectedShipping) {
      setMessage("Please select a shipping method.");
      return;
    }

    setStep(3);
  };

  const placeOrder = () => {
    // Demo only: order creation and backend integration are pending.
    setMessage(
      "Review completed. Backend order creation is not connected yet."
    );
  };

  const steps = ["Address", "Shipping", "Review"];

  return (
    <div className="checkout-shell">
      {/* Navbar */}
      <header className="checkout-navbar">
        <a className="checkout-brand" href="/">
          VIORA
        </a>

        <span className="checkout-nav-note">
          Secure checkout
        </span>
      </header>

      {/* Main */}
      <main className="checkout-main">
        <div className="checkout-heading">
          <h1>Checkout</h1>
          <p>
            Complete your delivery details and review your order.
          </p>
        </div>

        {/* Progress Steps */}
        <div
          className="checkout-steps"
          aria-label="Checkout progress"
        >
          {steps.map((label, index) => {
            const number = index + 1;

            const status =
              step === number
                ? "active"
                : step > number
                ? "done"
                : "";

            return (
              <div
                className={`checkout-step ${status}`}
                key={label}
              >
                <span className="step-number">
                  {step > number ? "✓" : number}
                </span>

                <span>{label}</span>
              </div>
            );
          })}
        </div>

        {/* Checkout Layout */}
        <div className="checkout-layout">
          <section className="checkout-card">

            {/* =========================
                STEP 1 - ADDRESS
            ========================== */}
            {step === 1 && (
              <AddressStep
                onContinue={(selectedAddress, selectedBillingAddress) => {
                  setAddress({
                    fullName: selectedAddress.full_name,
                    mobile: selectedAddress.phone,
                    addressLine1: selectedAddress.line1,
                    addressLine2: selectedAddress.line2 || "",
                    city: selectedAddress.city,
                    state: selectedAddress.state,
                    pincode: selectedAddress.postal_code,
                    country: selectedAddress.country,
                  });

                  setBillingAddress({
                    fullName: selectedBillingAddress.full_name,
                    mobile: selectedBillingAddress.phone,
                    addressLine1: selectedBillingAddress.line1,
                    addressLine2: selectedBillingAddress.line2 || "",
                    city: selectedBillingAddress.city,
                    state: selectedBillingAddress.state,
                    pincode: selectedBillingAddress.postal_code,
                    country: selectedBillingAddress.country,
                  });

                  setMessage("");
                  setStep(2);
                }}
              />
            )}

            {/* =========================
                STEP 2 - SHIPPING
            ========================== */}
            {step === 2 && (
              <>
                <h2>Choose shipping method</h2>

                <p className="checkout-hint">
                  Select a delivery option for your address.
                </p>

                <div className="shipping-options">
                  {shippingMethods.map((method) => (
                    <label
                      className={`shipping-option ${
                        shipping === method.id ? "selected" : ""
                      }`}
                      key={method.id}
                    >
                      <input
                        type="radio"
                        name="shipping"
                        value={method.id}
                        checked={shipping === method.id}
                        onChange={() => {
                          setShipping(method.id);
                          setMessage("");
                        }}
                      />

                      <span className="shipping-option-content">
                        <span className="shipping-option-title">
                          {method.name}
                        </span>

                        <span className="shipping-option-description">
                          {method.description}
                        </span>
                      </span>

                      <span className="shipping-option-price">
                        {method.price === 0
                          ? "Free"
                          : money(method.price)}
                      </span>
                    </label>
                  ))}
                </div>

                {message && (
                  <div
                    className="checkout-alert error"
                    role="alert"
                  >
                    {message}
                  </div>
                )}

                <div className="checkout-actions">
                  <button
                    className="checkout-btn secondary"
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setMessage("");
                    }}
                  >
                    ← Back
                  </button>

                  <button
                    className="checkout-btn"
                    type="button"
                    onClick={continueToReview}
                  >
                    Continue to Review →
                  </button>
                </div>
              </>
            )}

            {/* =========================
                STEP 3 - REVIEW
            ========================== */}
            {step === 3 && (
              <>
                <h2>Review your order</h2>

                {/* Delivery Address */}
                <div className="review-section">
                  <h3>Delivery address</h3>

                  <div className="review-address">
                    <strong>{address.fullName}</strong>

                    <br />

                    {address.mobile}

                    <br />

                    {address.addressLine1}

                    {address.addressLine2 && (
                      <>
                        <br />
                        {address.addressLine2}
                      </>
                    )}

                    <br />

                    {address.city}, {address.state} -{" "}
                    {address.pincode}

                    <br />

                    {address.country}
                  </div>

                  <button
                    className="checkout-btn secondary"
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setMessage("");
                    }}
                  >
                    Edit address
                  </button>
                </div>

                {/* Billing Address */}
                <div className="review-section">
                  <h3>Billing address</h3>
                  <div className="review-address">
                    <strong>{billingAddress.fullName}</strong><br />
                    {billingAddress.mobile}<br />
                    {billingAddress.addressLine1}
                    {billingAddress.addressLine2 && <><br />{billingAddress.addressLine2}</>}
                    <br />{billingAddress.city}, {billingAddress.state} - {billingAddress.pincode}<br />
                    {billingAddress.country}
                  </div>
                </div>

                {/* Shipping Method */}
                <div className="review-section">
                  <h3>Shipping method</h3>

                  <p>
                    {selectedShipping?.name}
                  </p>

                  <p className="checkout-hint">
                    {selectedShipping?.description}
                  </p>

                  <button
                    className="checkout-btn secondary"
                    type="button"
                    onClick={() => {
                      setStep(2);
                      setMessage("");
                    }}
                  >
                    Change shipping
                  </button>
                </div>

                {/* Order Items */}
                <div className="review-section">
                  <h3>Order items</h3>

                  <p className="checkout-hint">
                    Demo order summary. Product details will be
                    connected to the shared order module.
                  </p>
                </div>

                {message && (
                  <div
                    className="checkout-alert success"
                    role="status"
                  >
                    {message}
                  </div>
                )}

                {/* Review Actions */}
                <div className="checkout-actions">
                  <button
                    className="checkout-btn secondary"
                    type="button"
                    onClick={() => {
                      setStep(2);
                      setMessage("");
                    }}
                  >
                    ← Back
                  </button>

                  <button
                    className="checkout-btn"
                    type="button"
                    onClick={placeOrder}
                  >
                    Confirm review
                  </button>
                </div>
              </>
            )}
          </section>

          {/* =========================
              ORDER SUMMARY
          ========================== */}
          <aside className="checkout-card checkout-summary">
            <h2>Order summary</h2>

            <div className="summary-row">
              <span>Product subtotal</span>
              <strong>{money(subtotal)}</strong>
            </div>

            <div className="summary-row">
              <span>Discount</span>
              <strong>{money(0)}</strong>
            </div>

            <div className="summary-row">
              <span>Shipping</span>
              <strong>{money(shippingCharge)}</strong>
            </div>

            <div className="summary-row summary-total">
              <span>Total</span>
              <strong>{money(total)}</strong>
            </div>

            <p className="checkout-hint">
              Amounts are demo values and will be replaced by
              the shared order and pricing services.
            </p>
          </aside>
        </div>
      </main>

      {/* Footer */}
      <footer className="checkout-footer">
        Checkout · Shipping · Review
      </footer>
    </div>
  );
}

export default CheckoutPage;
