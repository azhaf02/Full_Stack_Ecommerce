import { useEffect, useState } from "react";
import AddressStep from "../components/AddressStep";
import "../checkout.css";

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

const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const getDeliveryText = (estimatedDays) => {
  const days = Number(estimatedDays);

  if (days === 0) {
    return "Same day delivery";
  }

  if (days === 1) {
    return "Estimated delivery in 1 business day";
  }

  return `Estimated delivery in ${days} business days`;
};

function CheckoutPage() {
  const [step, setStep] = useState(1);

  const [address, setAddress] = useState(initialAddress);
  const [billingAddress, setBillingAddress] =
    useState(initialAddress);

  // Selected shipping address ID for order creation
  const [shippingAddressId, setShippingAddressId] =
    useState(null);

  // Shipping methods loaded from backend
  const [shippingMethods, setShippingMethods] = useState([]);
  const [shipping, setShipping] = useState(null);
  const [shippingLoading, setShippingLoading] =
    useState(true);

  const [message, setMessage] = useState("");

  // Current demo/test product until shared cart module is connected
  const subtotal = 499;
  const discount = 0;

  // =========================
  // LOAD SHIPPING METHODS
  // =========================
  useEffect(() => {
    const loadShippingMethods = async () => {
      try {
        setShippingLoading(true);
        setMessage("");

        const response = await fetch(
          "http://127.0.0.1:8001/api/shipping-methods"
        );

        if (!response.ok) {
          throw new Error(
            "Failed to load shipping methods."
          );
        }

        const methods = await response.json();

        if (
          !Array.isArray(methods) ||
          methods.length === 0
        ) {
          throw new Error(
            "No shipping methods are available."
          );
        }

        setShippingMethods(methods);

        // Select first active method by default
        setShipping(methods[0].id);
      } catch (error) {
        console.error(
          "Shipping methods error:",
          error
        );

        setShippingMethods([]);
        setShipping(null);

        setMessage(
          "Unable to load shipping methods. Please try again."
        );
      } finally {
        setShippingLoading(false);
      }
    };

    loadShippingMethods();
  }, []);

  // =========================
  // SELECTED SHIPPING
  // =========================
  const selectedShipping = shippingMethods.find(
    (method) =>
      Number(method.id) === Number(shipping)
  );

  const shippingCharge = Number(
    selectedShipping?.cost ?? 0
  );

  const total =
    subtotal - discount + shippingCharge;

  // =========================
  // CONTINUE TO REVIEW
  // =========================
  const continueToReview = () => {
    setMessage("");

    if (!selectedShipping) {
      setMessage(
        "Please select a shipping method."
      );
      return;
    }

    setStep(3);
  };

  // =========================
  // PLACE ORDER
  // =========================
  const placeOrder = async () => {
    setMessage("");

    if (!shippingAddressId) {
      setMessage(
        "Shipping address is missing."
      );
      return;
    }

    if (!selectedShipping) {
      setMessage(
        "Please select a shipping method."
      );
      return;
    }

    try {
      const token =
        localStorage.getItem("viora_token");

      if (!token) {
        setMessage(
          "Please login before placing the order."
        );
        return;
      }

      const response = await fetch(
        "http://127.0.0.1:8001/api/orders",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            address_id: shippingAddressId,
            shipping_method_id: Number(
              selectedShipping.id
            ),
            payment_method: "COD",
            items: [
              {
                product_id: 2,
                variant_id: 1,
                quantity: 1,
              },
            ],
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            "Failed to create order."
        );
      }

      setMessage(
        `Order placed successfully! Order #${data.order_number}`
      );
    } catch (error) {
      console.error(
        "Order creation error:",
        error
      );

      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to place order. Please try again."
      );
    }
  };

  const steps = [
    "Address",
    "Shipping",
    "Review",
  ];

  return (
    <div className="checkout-shell">
      {/* Navbar */}
      <header className="checkout-navbar">
        <a
          className="checkout-brand"
          href="/"
        >
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
            Complete your delivery details and
            review your order.
          </p>
        </div>

        {/* =========================
            PROGRESS STEPS
        ========================== */}
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
                  {step > number
                    ? "✓"
                    : number}
                </span>

                <span>{label}</span>
              </div>
            );
          })}
        </div>

        {/* =========================
            CHECKOUT LAYOUT
        ========================== */}
        <div className="checkout-layout">
          <section className="checkout-card">
            {/* =========================
                STEP 1 - ADDRESS
            ========================== */}
            {step === 1 && (
              <AddressStep
                onContinue={(
                  selectedAddress,
                  selectedBillingAddress
                ) => {
                  // Save address ID for order creation
                  setShippingAddressId(
                    selectedAddress.id
                  );

                  setAddress({
                    fullName:
                      selectedAddress.full_name,
                    mobile:
                      selectedAddress.phone,
                    addressLine1:
                      selectedAddress.line1,
                    addressLine2:
                      selectedAddress.line2 || "",
                    city:
                      selectedAddress.city,
                    state:
                      selectedAddress.state,
                    pincode:
                      selectedAddress.postal_code,
                    country:
                      selectedAddress.country,
                  });

                  setBillingAddress({
                    fullName:
                      selectedBillingAddress.full_name,
                    mobile:
                      selectedBillingAddress.phone,
                    addressLine1:
                      selectedBillingAddress.line1,
                    addressLine2:
                      selectedBillingAddress.line2 ||
                      "",
                    city:
                      selectedBillingAddress.city,
                    state:
                      selectedBillingAddress.state,
                    pincode:
                      selectedBillingAddress.postal_code,
                    country:
                      selectedBillingAddress.country,
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
                <h2>
                  Choose shipping method
                </h2>

                <p className="checkout-hint">
                  Select a delivery option for
                  your address.
                </p>

                {/* Loading */}
                {shippingLoading && (
                  <div className="checkout-hint">
                    Loading available shipping
                    methods...
                  </div>
                )}

                {/* Shipping Options */}
                {!shippingLoading &&
                  shippingMethods.length >
                    0 && (
                    <div className="shipping-options">
                      {shippingMethods.map(
                        (method) => (
                          <label
                            className={`shipping-option ${
                              Number(
                                shipping
                              ) ===
                              Number(
                                method.id
                              )
                                ? "selected"
                                : ""
                            }`}
                            key={method.id}
                          >
                            <input
                              type="radio"
                              name="shipping"
                              value={method.id}
                              checked={
                                Number(
                                  shipping
                                ) ===
                                Number(
                                  method.id
                                )
                              }
                              onChange={() => {
                                setShipping(
                                  method.id
                                );
                                setMessage("");
                              }}
                            />

                            <span className="shipping-option-content">
                              <span className="shipping-option-title">
                                {method.name}
                              </span>

                              <span className="shipping-option-description">
                                {getDeliveryText(
                                  method.estimated_days
                                )}
                              </span>
                            </span>

                            <span className="shipping-option-price">
                              {money(
                                method.cost
                              )}
                            </span>
                          </label>
                        )
                      )}
                    </div>
                  )}

                {/* No methods */}
                {!shippingLoading &&
                  shippingMethods.length ===
                    0 && (
                    <div
                      className="checkout-alert error"
                      role="alert"
                    >
                      No shipping methods are
                      currently available.
                    </div>
                  )}

                {/* Error / validation */}
                {message && (
                  <div
                    className="checkout-alert error"
                    role="alert"
                  >
                    {message}
                  </div>
                )}

                {/* Shipping actions */}
                <div className="checkout-actions">
                  <button
                    className="checkout-btn secondary"
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setMessage("");
                    }}
                  >
                    Back to address
                  </button>

                  <button
                    className="checkout-btn primary"
                    type="button"
                    onClick={
                      continueToReview
                    }
                    disabled={
                      shippingLoading ||
                      !selectedShipping
                    }
                  >
                    Continue to review
                  </button>
                </div>
              </>
            )}

            {/* =========================
                STEP 3 - REVIEW
            ========================== */}
            {step === 3 && (
              <>
                <h2>
                  Review your order
                </h2>

                <p className="checkout-hint">
                  Check your address, shipping
                  method, items and total before
                  placing the order.
                </p>

                {/* Shipping Address */}
                <div className="review-section">
                  <h3>
                    Shipping address
                  </h3>

                  <p>
                    <strong>
                      {address.fullName}
                    </strong>
                  </p>

                  <p>{address.mobile}</p>

                  <p>
                    {address.addressLine1}
                    {address.addressLine2
                      ? `, ${address.addressLine2}`
                      : ""}
                  </p>

                  <p>
                    {address.city},{" "}
                    {address.state} -{" "}
                    {address.pincode}
                  </p>

                  <p>
                    {address.country}
                  </p>
                </div>

                {/* Billing Address */}
                <div className="review-section">
                  <h3>
                    Billing address
                  </h3>

                  <p>
                    <strong>
                      {
                        billingAddress.fullName
                      }
                    </strong>
                  </p>

                  <p>
                    {billingAddress.mobile}
                  </p>

                  <p>
                    {
                      billingAddress.addressLine1
                    }
                    {billingAddress.addressLine2
                      ? `, ${billingAddress.addressLine2}`
                      : ""}
                  </p>

                  <p>
                    {billingAddress.city},{" "}
                    {billingAddress.state} -{" "}
                    {billingAddress.pincode}
                  </p>

                  <p>
                    {billingAddress.country}
                  </p>
                </div>

                {/* Selected Shipping */}
                <div className="review-section">
                  <h3>
                    Shipping method
                  </h3>

                  {selectedShipping ? (
                    <>
                      <p>
                        <strong>
                          {
                            selectedShipping.name
                          }
                        </strong>
                      </p>

                      <p>
                        {getDeliveryText(
                          selectedShipping.estimated_days
                        )}
                      </p>

                      <p>
                        Shipping charge:{" "}
                        <strong>
                          {money(
                            selectedShipping.cost
                          )}
                        </strong>
                      </p>
                    </>
                  ) : (
                    <p>
                      No shipping method
                      selected.
                    </p>
                  )}
                </div>

                {/* Order Items */}
                <div className="review-section">
                  <h3>
                    Order items
                  </h3>

                  <div className="review-item">
                    <strong>
                      Test T-Shirt
                    </strong>

                    <p>Size: S</p>

                    <p>
                      Quantity: 1
                    </p>

                    <p>
                      Price:{" "}
                      <strong>
                        {money(499)}
                      </strong>
                    </p>
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="review-section">
                  <h3>
                    Price breakdown
                  </h3>

                  <div className="summary-row">
                    <span>
                      Subtotal
                    </span>

                    <span>
                      {money(subtotal)}
                    </span>
                  </div>

                  <div className="summary-row">
                    <span>
                      Discount
                    </span>

                    <span>
                      {money(discount)}
                    </span>
                  </div>

                  <div className="summary-row">
                    <span>
                      Shipping
                    </span>

                    <span>
                      {money(
                        shippingCharge
                      )}
                    </span>
                  </div>

                  <div className="summary-divider" />

                  <div className="summary-row total">
                    <span>
                      Total
                    </span>

                    <span>
                      {money(total)}
                    </span>
                  </div>
                </div>

                {/* Review Message */}
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
                    Change shipping
                  </button>

                  <button
                    className="checkout-btn primary"
                    type="button"
                    onClick={placeOrder}
                    disabled={
                      !selectedShipping
                    }
                  >
                    Place order
                  </button>
                </div>
              </>
            )}
          </section>

          {/* =========================
              ORDER SUMMARY
          ========================== */}
          <aside className="checkout-summary">
            <h2>
              Order summary
            </h2>

            <div className="summary-row">
              <span>
                Subtotal
              </span>

              <span>
                {money(subtotal)}
              </span>
            </div>

            <div className="summary-row">
              <span>
                Discount
              </span>

              <span>
                {money(discount)}
              </span>
            </div>

            <div className="summary-row">
              <span>
                Shipping
                {selectedShipping
                  ? ` (${selectedShipping.name})`
                  : ""}
              </span>

              <span>
                {selectedShipping
                  ? money(
                      shippingCharge
                    )
                  : "—"}
              </span>
            </div>

            <div className="summary-divider" />

            <div className="summary-row total">
              <span>
                Total
              </span>

              <span>
                {money(total)}
              </span>
            </div>

            {selectedShipping && (
              <p className="checkout-hint">
                {getDeliveryText(
                  selectedShipping.estimated_days
                )}
              </p>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}

export default CheckoutPage;