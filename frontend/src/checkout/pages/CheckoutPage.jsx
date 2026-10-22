
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

const API_BASE = "http://localhost:8000";

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

  return "Estimated delivery in " + days + " business days";
};
const getErrorMessage = (data, fallback) => {
  const detail = data?.detail;

  if (typeof detail === "string") return detail;

  if (Array.isArray(detail)) {
    return detail
      .map((item) => item.msg || "Invalid input")
      .join(", ");
  }

  return fallback;
};

function CheckoutPage() {
  const [step, setStep] = useState(1);

  const [address, setAddress] = useState(initialAddress);
  const [billingAddress, setBillingAddress] =
    useState(initialAddress);
  const [shippingAddressId, setShippingAddressId] =
    useState(null);

  const [shippingMethods, setShippingMethods] = useState([]);
  const [shipping, setShipping] = useState(null);
  const [shippingLoading, setShippingLoading] = useState(true);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("error");

  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewValid, setReviewValid] = useState(false);
  const [reviewData, setReviewData] = useState(null);
  const [orderLoading, setOrderLoading] = useState(false);

  // Temporary demo values used only when review data is unavailable.
  // The real order must eventually use the shared cart.
  const demoSubtotal = 499;
  const demoDiscount = 0;

  const showError = (text) => {
    setMessage(text);
    setMessageType("error");
  };

  const showSuccess = (text) => {
    setMessage(text);
    setMessageType("success");
  };

  const clearReview = () => {
    setReviewValid(false);
    setReviewData(null);
  };

  const getToken = () => localStorage.getItem("viora_token");

  // =========================
  // LOAD SHIPPING METHODS
  // =========================
  useEffect(() => {
    const loadShippingMethods = async () => {
      try {
        setShippingLoading(true);

        const response = await fetch(
          `${API_BASE}/api/shipping-methods`
        );

        const data = await response.json().catch(() => []);

        if (!response.ok) {
          throw new Error(
            getErrorMessage(data, "Failed to load shipping methods.")
          );
        }

        if (!Array.isArray(data) || data.length === 0) {
          throw new Error("No shipping methods are available.");
        }

        setShippingMethods(data);
        setShipping(data[0].id);
      } catch (error) {
        console.error("Shipping methods error:", error);
        setShippingMethods([]);
        setShipping(null);

        showError(
          error instanceof Error
            ? error.message
            : "Unable to load shipping methods."
        );
      } finally {
        setShippingLoading(false);
      }
    };

    loadShippingMethods();
  }, []);

  // =========================
  // SELECTED SHIPPING + TOTALS
  // =========================
  const selectedShipping = shippingMethods.find(
    (method) => Number(method.id) === Number(shipping)
  );

  const shippingCharge = Number(selectedShipping?.cost ?? 0);

  const subtotal = Number(
    reviewData?.summary?.subtotal ?? demoSubtotal
  );

  const discount = Number(
    reviewData?.summary?.discount ?? demoDiscount
  );

  const displayedShipping = Number(
    reviewData?.summary?.shipping ?? shippingCharge
  );

  const displayedTotal = Number(
    reviewData?.summary?.total ??
      subtotal - discount + displayedShipping
  );

  // =========================
  // VALIDATE CHECKOUT REVIEW
  // =========================
  const validateReview = async () => {
    const token = getToken();

    if (!token) {
      throw new Error("Please login before continuing.");
    }

    if (!shippingAddressId) {
      throw new Error("Please select a shipping address.");
    }

    if (!selectedShipping) {
      throw new Error("Please select a shipping method.");
    }

    const response = await fetch(
      `${API_BASE}/api/checkout/review`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          address_id: Number(shippingAddressId),
          shipping_method_id: Number(selectedShipping.id),
        }),
      }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        getErrorMessage(data, "Checkout validation failed.")
      );
    }

    if (data?.ready_for_payment !== true) {
      throw new Error(
        data?.message ||
          "Your checkout could not be validated. Please review your details."
      );
    }

    return data;
  };

  // =========================
  // CONTINUE TO REVIEW
  // =========================
  const continueToReview = async () => {
    setMessage("");
    clearReview();

    if (!shippingAddressId) {
      showError("Please select a shipping address.");
      setStep(1);
      return;
    }

    if (!selectedShipping) {
      showError("Please select a shipping method.");
      return;
    }

    try {
      setReviewLoading(true);

      const data = await validateReview();

      setReviewData(data);
      setReviewValid(true);
      setStep(3);
      setMessage("");
    } catch (error) {
      console.error("Checkout review error:", error);

      showError(
        error instanceof Error
          ? error.message
          : "Unable to validate checkout."
      );
    } finally {
      setReviewLoading(false);
    }
  };

  // =========================
  // PLACE ORDER
  // =========================
  const placeOrder = async () => {
    setMessage("");

    if (!reviewValid || !reviewData) {
      showError(
        "Please validate your order again before placing it."
      );
      return;
    }

    if (!shippingAddressId || !selectedShipping) {
      clearReview();
      showError(
        "Your address or shipping selection is missing. Please review checkout again."
      );
      return;
    }

    try {
      setOrderLoading(true);

      // Revalidate stock, coupon and checkout details immediately
      // before order creation.
      const latestReview = await validateReview();

      setReviewData(latestReview);
      setReviewValid(true);

      /*
       * TEMPORARY DEMO ORDER:
       * Replace these hardcoded items when the shared cart
       * module is integrated. Never send prices or totals.
       */
      const response = await fetch(`${API_BASE}/api/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          address_id: Number(shippingAddressId),
          shipping_method_id: Number(selectedShipping.id),
          payment_method: "COD",
          items: [
            {
              product_id: 2,
              variant_id: 1,
              quantity: 1,
            },
          ],
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          getErrorMessage(data, "Failed to create order.")
        );
      }

      showSuccess(
        `Order placed successfully! Order #${data.order_number}`
      );
    } catch (error) {
      console.error("Order creation error:", error);

      // Do not leave a previously successful review marked valid
      // after a failed revalidation.
      if (
        error instanceof Error &&
        /stock|coupon|address|shipping|checkout|cart|validation|login|insufficient/i.test(
          error.message
        )
      ) {
        clearReview();
      }

      showError(
        error instanceof Error
          ? error.message
          : "Unable to place order. Please try again."
      );
    } finally {
      setOrderLoading(false);
    }
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

      <main className="checkout-main">
        <div className="checkout-heading">
          <h1>Checkout</h1>
          <p>
            Complete your delivery details and review your order.
          </p>
        </div>

        {/* Progress steps */}
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
                  setShippingAddressId(selectedAddress.id);

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
                    addressLine2:
                      selectedBillingAddress.line2 || "",
                    city: selectedBillingAddress.city,
                    state: selectedBillingAddress.state,
                    pincode: selectedBillingAddress.postal_code,
                    country: selectedBillingAddress.country,
                  });

                  clearReview();
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

                {shippingLoading && (
                  <div className="checkout-hint">
                    Loading available shipping methods...
                  </div>
                )}

                {!shippingLoading &&
                  shippingMethods.length > 0 && (
                    <div className="shipping-options">
                      {shippingMethods.map((method) => (
                        <label
                          className={`shipping-option ${
                            Number(shipping) === Number(method.id)
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
                              Number(shipping) === Number(method.id)
                            }
                            onChange={() => {
                              setShipping(method.id);
                              clearReview();
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
                            {money(method.cost)}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}

                {!shippingLoading &&
                  shippingMethods.length === 0 && (
                    <div
                      className="checkout-alert error"
                      role="alert"
                    >
                      No shipping methods are currently available.
                    </div>
                  )}

                {message && (
                  <div
                    className={`checkout-alert ${messageType}`}
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
                    Back to address
                  </button>

                  <button
                    className="checkout-btn primary"
                    type="button"
                    onClick={continueToReview}
                    disabled={
                      shippingLoading ||
                      reviewLoading ||
                      !selectedShipping
                    }
                  >
                    {reviewLoading
                      ? "Validating order..."
                      : "Continue to review"}
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

                <p className="checkout-hint">
                  Check your address, shipping method, items and
                  total before placing the order.
                </p>

                {!reviewValid && (
                  <div
                    className="checkout-alert error"
                    role="alert"
                  >
                    Your order has not been validated. Return to
                    shipping and validate it again.
                  </div>
                )}

                {/* Shipping address */}
                <div className="review-section">
                  <h3>Shipping address</h3>
                  <p>
                    <strong>{address.fullName}</strong>
                  </p>
                  <p>{address.mobile}</p>
                  <p>
                    {address.addressLine1}
                    {address.addressLine2
                      ? `, ${address.addressLine2}`
                      : ""}
                  </p>
                  <p>
                    {address.city}, {address.state} -{" "}
                    {address.pincode}
                  </p>
                  <p>{address.country}</p>
                </div>

                {/* Billing address */}
                <div className="review-section">
                  <h3>Billing address</h3>
                  <p>
                    <strong>{billingAddress.fullName}</strong>
                  </p>
                  <p>{billingAddress.mobile}</p>
                  <p>
                    {billingAddress.addressLine1}
                    {billingAddress.addressLine2
                      ? `, ${billingAddress.addressLine2}`
                      : ""}
                  </p>
                  <p>
                    {billingAddress.city}, {billingAddress.state} -{" "}
                    {billingAddress.pincode}
                  </p>
                  <p>{billingAddress.country}</p>
                </div>

                {/* Server-validated shipping */}
                <div className="review-section">
                  <h3>Shipping method</h3>

                  {reviewData?.shipping || selectedShipping ? (
                    <>
                      <p>
                        <strong>
                          {reviewData?.shipping?.name ||
                            selectedShipping?.name}
                        </strong>
                      </p>

                      <p>
                        {getDeliveryText(
                          reviewData?.shipping?.estimated_days ??
                            selectedShipping?.estimated_days
                        )}
                      </p>

                      <p>
                        Shipping charge:{" "}
                        <strong>
                          {money(displayedShipping)}
                        </strong>
                      </p>
                    </>
                  ) : (
                    <p>No shipping method selected.</p>
                  )}
                </div>

                {/* Items from the backend review */}
                <div className="review-section">
                  <h3>Order items</h3>

                  {Array.isArray(reviewData?.items) &&
                  reviewData.items.length > 0 ? (
                    reviewData.items.map((item) => (
                      <div
                        className="review-item"
                        key={item.cart_item_id}
                      >
                        <strong>
                          Product #{item.product_id}
                        </strong>

                        {item.variant_id != null && (
                          <p>Variant: {item.variant_id}</p>
                        )}

                        <p>Quantity: {item.quantity}</p>

                        <p>
                          Unit price:{" "}
                          {money(item.unit_price)}
                        </p>

                        <p>
                          Line total:{" "}
                          <strong>
                            {money(item.line_total)}
                          </strong>
                        </p>

                        <p>
                          Available stock: {item.available_stock}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="review-item">
                      <strong>Demo product</strong>
                      <p>
                        The backend review did not return cart
                        items. The demo order item is still
                        configured for order creation.
                      </p>
                    </div>
                  )}
                </div>

                {/* Coupon result */}
                <div className="review-section">
                  <h3>Coupon</h3>

                  {reviewData?.coupon ? (
                    <>
                      <p>
                        Code:{" "}
                        <strong>
                          {reviewData.coupon.code}
                        </strong>
                      </p>
                      <p>
                        Discount:{" "}
                        {money(
                          reviewData.coupon.discount_amount
                        )}
                      </p>
                    </>
                  ) : (
                    <p>No coupon applied.</p>
                  )}
                </div>

                {/* Server-calculated price breakdown */}
                <div className="review-section">
                  <h3>Price breakdown</h3>

                  <div className="summary-row">
                    <span>Subtotal</span>
                    <span>{money(subtotal)}</span>
                  </div>

                  <div className="summary-row">
                    <span>Discount</span>
                    <span>{money(discount)}</span>
                  </div>

                  <div className="summary-row">
                    <span>Shipping</span>
                    <span>{money(displayedShipping)}</span>
                  </div>

                  <div className="summary-divider" />

                  <div className="summary-row total">
                    <span>Total</span>
                    <span>{money(displayedTotal)}</span>
                  </div>
                </div>

                {message && (
                  <div
                    className={`checkout-alert ${messageType}`}
                    role={messageType === "error" ? "alert" : "status"}
                  >
                    {message}
                  </div>
                )}

                <div className="checkout-actions">
                  <button
                    className="checkout-btn secondary"
                    type="button"
                    disabled={orderLoading}
                    onClick={() => {
                      setStep(2);
                      clearReview();
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
                      !reviewValid ||
                      !reviewData ||
                      reviewLoading ||
                      orderLoading ||
                      !selectedShipping
                    }
                  >
                    {orderLoading
                      ? "Revalidating and placing order..."
                      : "Place order"}
                  </button>
                </div>
              </>
            )}
          </section>

          {/* =========================
              ORDER SUMMARY
          ========================== */}
          <aside className="checkout-summary">
            <h2>Order summary</h2>

            <div className="summary-row">
              <span>Subtotal</span>
              <span>{money(subtotal)}</span>
            </div>

            <div className="summary-row">
              <span>Discount</span>
              <span>{money(discount)}</span>
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
                  ? money(displayedShipping)
                  : "—"}
              </span>
            </div>

            <div className="summary-divider" />

            <div className="summary-row total">
              <span>Total</span>
              <span>{money(displayedTotal)}</span>
            </div>

            {selectedShipping && (
              <p className="checkout-hint">
                {getDeliveryText(
                  selectedShipping.estimated_days
                )}
              </p>
            )}

            {reviewData && (
              <p className="checkout-hint">
                {reviewValid
                  ? "Checkout validation passed."
                  : "Checkout needs revalidation."}
              </p>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}

export default CheckoutPage;

