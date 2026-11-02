
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AddressStep from "../components/AddressStep";
import "../checkout.css";

const API_BASE = "http://127.0.0.1:8000";

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

  if (!Number.isFinite(days)) {
    return "Delivery estimate unavailable";
  }

  if (days === 0) return "Same day delivery";
  if (days === 1) return "Estimated delivery in 1 business day";

  return `Estimated delivery in ${days} business days`;
};

function getAuthToken() {
  return (
    localStorage.getItem("viora_token") ||
    localStorage.getItem("access_token") ||
    localStorage.getItem("token") ||
    localStorage.getItem("authToken")
  );
}

async function readResponse(response, fallbackMessage) {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.detail ||
        data?.message ||
        fallbackMessage
    );
  }

  return data;
}

function CheckoutPage() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);

  const [address, setAddress] = useState(initialAddress);
  const [billingAddress, setBillingAddress] = useState(initialAddress);
  const [shippingAddressId, setShippingAddressId] = useState(null);

  const [shippingMethods, setShippingMethods] = useState([]);
  const [shipping, setShipping] = useState(null);
  const [shippingLoading, setShippingLoading] = useState(true);

  const [message, setMessage] = useState("");
  const [placingOrder, setPlacingOrder] = useState(false);
  const [placedOrder, setPlacedOrder] = useState(null);

  const [cart, setCart] = useState(null);
  const [cartLoading, setCartLoading] = useState(true);
  const [cartError, setCartError] = useState("");

  const subtotal = Number(cart?.summary?.subtotal ?? 0);
  const discount = Number(cart?.summary?.discount ?? 0);
  const tax = Number(
    cart?.summary?.tax ??
      cart?.summary?.tax_amount ??
      0
  );

  // ==========================================
  // LOAD SHIPPING METHODS
  // ==========================================

  useEffect(() => {
    let cancelled = false;

    const loadShippingMethods = async () => {
      try {
        setShippingLoading(true);

        const response = await fetch(
          `${API_BASE}/api/shipping-methods`
        );

        const methods = await readResponse(
          response,
          "Failed to load shipping methods."
        );

        if (!Array.isArray(methods)) {
          throw new Error("Invalid shipping methods response.");
        }

        const activeMethods = methods.filter(
          (method) => method.is_active !== false
        );

        if (activeMethods.length === 0) {
          throw new Error("No active shipping methods are available.");
        }

        if (!cancelled) {
          setShippingMethods(activeMethods);
          setShipping(activeMethods[0].id);
        }
      } catch (error) {
        console.error("Shipping methods error:", error);

        if (!cancelled) {
          setShippingMethods([]);
          setShipping(null);
          setMessage(
            error instanceof Error
              ? error.message
              : "Unable to load shipping methods."
          );
        }
      } finally {
        if (!cancelled) {
          setShippingLoading(false);
        }
      }
    };

    loadShippingMethods();

    return () => {
      cancelled = true;
    };
  }, []);

  // ==========================================
  // LOAD ACTUAL CART AND PRICING SUMMARY
  // ==========================================

  const loadCart = async () => {
    const token = getAuthToken();

    if (!token) {
      throw new Error("Please login before loading your cart.");
    }

    const headers = {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    };

    const couponCode = localStorage.getItem("viora_coupon_code");
    const summaryUrl = new URL(`${API_BASE}/api/cart/summary`);

    if (couponCode) {
      summaryUrl.searchParams.set("coupon_code", couponCode);
    }

    const [cartResponse, summaryResponse] = await Promise.all([
      fetch(`${API_BASE}/api/cart`, { headers }),
      fetch(summaryUrl.toString(), { headers }),
    ]);

    const [cartData, summaryData] = await Promise.all([
      readResponse(cartResponse, "Unable to load your cart."),
      readResponse(summaryResponse, "Unable to load cart pricing."),
    ]);

    if (!Array.isArray(cartData?.items)) {
      throw new Error("Invalid cart response received.");
    }

    return {
      ...cartData,
      summary: summaryData,
    };
  };

  useEffect(() => {
    let cancelled = false;

    const fetchCart = async () => {
      try {
        setCartLoading(true);
        setCartError("");

        const cartData = await loadCart();

        if (!cancelled) {
          setCart(cartData);
        }
      } catch (error) {
        console.error("Cart loading error:", error);

        if (!cancelled) {
          setCart(null);
          setCartError(
            error instanceof Error
              ? error.message
              : "Unable to load your cart."
          );
        }
      } finally {
        if (!cancelled) {
          setCartLoading(false);
        }
      }
    };

    fetchCart();

    return () => {
      cancelled = true;
    };
  }, []);

  // ==========================================
  // SELECTED SHIPPING AND TOTALS
  // ==========================================

  const selectedShipping = shippingMethods.find(
    (method) => Number(method.id) === Number(shipping)
  );

  const shippingCharge = Number(selectedShipping?.cost ?? 0);

  const total =
    Number(
      cart?.summary?.total ??
        subtotal - discount + tax
    ) + shippingCharge;

  // ==========================================
  // CONTINUE TO REVIEW
  // ==========================================

  const continueToReview = async () => {
    if (cartLoading || shippingLoading) {
      setMessage("Please wait while checkout information loads.");
      return;
    }

    if (!shippingAddressId) {
      setMessage("Please select a shipping address.");
      setStep(1);
      return;
    }

    if (!selectedShipping) {
      setMessage("Please select an available shipping method.");
      return;
    }

    if (cartError) {
      setMessage(cartError);
      return;
    }

    setMessage("");
    setCartLoading(true);
    setCartError("");

    try {
      // Revalidate cart and pricing before showing order review.
      const latestCart = await loadCart();

      if (!latestCart.items.length) {
        throw new Error("Your cart is empty. Please add products first.");
      }

      const invalidItem = latestCart.items.some(
        (item) =>
          !Number.isInteger(Number(item.product_id)) ||
          Number(item.product_id) <= 0 ||
          !Number.isInteger(Number(item.quantity)) ||
          Number(item.quantity) <= 0
      );

      if (invalidItem) {
        throw new Error("Your cart contains an invalid product or quantity.");
      }

      setCart(latestCart);
      setStep(3);
    } catch (error) {
      console.error("Checkout validation error:", error);

      const errorMessage =
        error instanceof Error
          ? error.message
          : "Unable to validate your cart.";

      setCartError(errorMessage);
      setMessage(errorMessage);
    } finally {
      setCartLoading(false);
    }
  };

  // ==========================================
  // PLACE ORDER
  // ==========================================

  const placeOrder = async () => {
    if (placingOrder || placedOrder) return;

    setMessage("");

    if (!shippingAddressId) {
      setMessage("Shipping address is missing.");
      setStep(1);
      return;
    }

    if (!selectedShipping) {
      setMessage("Please select a shipping method.");
      setStep(2);
      return;
    }

    if (cartLoading) {
      setMessage("Please wait while your cart is loading.");
      return;
    }

    if (cartError) {
      setMessage(cartError);
      return;
    }

    if (!cart?.items?.length) {
      setMessage("Your cart is empty.");
      return;
    }

    const token = getAuthToken();

    if (!token) {
      setMessage("Please login before placing the order.");
      return;
    }

    const invalidItem = cart.items.some(
      (item) =>
        !Number.isInteger(Number(item.product_id)) ||
        Number(item.product_id) <= 0 ||
        !Number.isInteger(Number(item.quantity)) ||
        Number(item.quantity) <= 0
    );

    if (invalidItem) {
      setMessage("Your cart contains an invalid product or quantity.");
      return;
    }

    try {
      setPlacingOrder(true);

      const couponCode = localStorage.getItem("viora_coupon_code");

      const response = await fetch(`${API_BASE}/api/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          address_id: shippingAddressId,
          shipping_method_id: Number(selectedShipping.id),
          payment_method: "COD",
          coupon_code: couponCode || null,
          items: cart.items.map((item) => ({
            product_id: Number(item.product_id),
            variant_id: item.variant_id ?? null,
            quantity: Number(item.quantity),
          })),
        }),
      });

      const data = await readResponse(
        response,
        "Failed to create order."
      );

      if (!data?.id || !data?.order_number) {
        throw new Error(
          "Order response is missing its confirmation details."
        );
      }

      setPlacedOrder(data);
      localStorage.removeItem("viora_coupon_code");

      navigate(`/order-confirmation/${data.id}`, {
        replace: true,
      });
    } catch (error) {
      console.error("Order creation error:", error);

      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to place order. Please try again."
      );
    } finally {
      setPlacingOrder(false);
    }
  };

  const steps = ["Address", "Shipping", "Review"];

  return (
    <div className="checkout-shell">
      {/* NAVBAR */}

      <header className="checkout-navbar">
        <a className="checkout-brand" href="/">
          VIORA
        </a>

        <span className="checkout-nav-note">
          Secure checkout
        </span>
      </header>

      {/* MAIN */}

      <main className="checkout-main">
        <div className="checkout-heading">
          <h1>Checkout</h1>
          <p>
            Complete your delivery details and review your order.
          </p>
        </div>

        {/* PROGRESS STEPS */}

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

        {/* CHECKOUT LAYOUT */}

        <div className="checkout-layout">
          <section className="checkout-card">
            {/* STEP 1 - ADDRESS */}

            {step === 1 && (
              <AddressStep
                onContinue={(
                  selectedAddress,
                  selectedBillingAddress
                ) => {
                  if (!selectedAddress?.id) {
                    setMessage("Please select a valid shipping address.");
                    return;
                  }

                  if (!selectedBillingAddress?.id) {
                    setMessage("Please select a valid billing address.");
                    return;
                  }

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

            {/* STEP 2 - SHIPPING */}

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
                              setMessage("");
                            }}
                          />

                          <span className="shipping-option-content">
                            <span className="shipping-option-title">
                              {method.name}
                            </span>

                            <span className="shipping-option-description">
                              {getDeliveryText(method.estimated_days)}
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
                    Back to address
                  </button>

                  <button
                    className="checkout-btn primary"
                    type="button"
                    onClick={continueToReview}
                    disabled={
                      shippingLoading ||
                      !selectedShipping ||
                      cartLoading
                    }
                  >
                    {cartLoading
                      ? "Loading cart..."
                      : "Continue to review"}
                  </button>
                </div>
              </>
            )}

            {/* STEP 3 - REVIEW */}

            {step === 3 && (
              <>
                <h2>Review your order</h2>

                <p className="checkout-hint">
                  Check your address and selected shipping method
                  before placing the order.
                </p>

                {cartLoading && (
                  <p className="checkout-hint">
                    Loading your cart...
                  </p>
                )}

                {cartError && (
                  <div className="checkout-alert error" role="alert">
                    {cartError}
                  </div>
                )}

                {/* SHIPPING ADDRESS */}

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
                    {address.city}, {address.state} - {address.pincode}
                  </p>

                  <p>{address.country}</p>
                </div>

                {/* BILLING ADDRESS */}

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

                {/* SHIPPING METHOD */}

                <div className="review-section">
                  <h3>Shipping method</h3>

                  {selectedShipping ? (
                    <>
                      <p>
                        <strong>{selectedShipping.name}</strong>
                      </p>

                      <p>
                        {getDeliveryText(
                          selectedShipping.estimated_days
                        )}
                      </p>

                      <p>
                        Shipping charge:{" "}
                        <strong>
                          {money(selectedShipping.cost)}
                        </strong>
                      </p>
                    </>
                  ) : (
                    <p>No shipping method selected.</p>
                  )}
                </div>

                {/* ORDER ITEMS */}

                <div className="review-section">
                  <h3>Order items</h3>

                  {cart?.items?.length ? (
                    <ul className="checkout-items">
                      {cart.items.map((item, index) => (
                        <li
                          key={
                            item.id ??
                            `${item.product_id}-${item.variant_id ?? "default"}-${index}`
                          }
                        >
                          <span>
                            {item.name ??
                              item.product_name ??
                              item.title ??
                              `Product #${item.product_id}`}

                            {item.variant_name
                              ? ` - ${item.variant_name}`
                              : ""}

                            {" × "}
                            {item.quantity}
                          </span>

                          <strong>
                            {money(
                              item.line_total ??
                                Number(item.unit_price ?? item.price ?? 0) *
                                  Number(item.quantity ?? 0)
                            )}
                          </strong>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="checkout-hint">
                      Your cart is empty.
                    </p>
                  )}
                </div>

                {/* REVIEW MESSAGE */}

                {message && (
                  <div
                    className="checkout-alert error"
                    role="alert"
                  >
                    {message}
                  </div>
                )}

                {/* REVIEW ACTIONS */}

                <div className="checkout-actions">
                  <button
                    className="checkout-btn secondary"
                    type="button"
                    onClick={() => {
                      setStep(2);
                      setMessage("");
                    }}
                    disabled={placingOrder}
                  >
                    Change shipping
                  </button>

                  <button
                    className="checkout-btn primary"
                    type="button"
                    onClick={placeOrder}
                    disabled={
                      !selectedShipping ||
                      placingOrder ||
                      Boolean(placedOrder) ||
                      cartLoading ||
                      Boolean(cartError) ||
                      !cart?.items?.length
                    }
                  >
                    {placingOrder
                      ? "Placing order..."
                      : "Place order"}
                  </button>
                </div>
              </>
            )}
          </section>

          {/* ORDER SUMMARY */}

          <aside className="checkout-summary">
            <h2>Order summary</h2>

            {cartLoading && (
              <p className="checkout-hint">
                Loading order summary...
              </p>
            )}

            {cartError && (
              <div className="checkout-alert error" role="alert">
                {cartError}
              </div>
            )}

            <div className="summary-row">
              <span>Subtotal</span>
              <span>{money(subtotal)}</span>
            </div>

            <div className="summary-row">
              <span>Discount</span>
              <span>{money(discount)}</span>
            </div>

            <div className="summary-row">
              <span>Tax</span>
              <span>{money(tax)}</span>
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
                  ? money(shippingCharge)
                  : "—"}
              </span>
            </div>

            <div className="summary-divider" />

            <div className="summary-row total">
              <span>Total</span>
              <span>{money(total)}</span>
            </div>

            {selectedShipping && (
              <p className="checkout-hint">
                {getDeliveryText(selectedShipping.estimated_days)}
              </p>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}

export default CheckoutPage;
