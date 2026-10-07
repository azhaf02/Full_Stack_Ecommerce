import React, { useEffect, useState } from "react";

type Address = {
  id: number;
  user_id: number;
  full_name: string;
  phone: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  address_type: "shipping" | "billing" | "both";
  is_default: boolean;
};

type AddressStepProps = {
  onContinue: (shippingAddress: Address, billingAddress: Address) => void;
};

// Updated API base URL
const API_BASE = "http://localhost:8001";
const TOKEN_KEY = "viora_token";

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem(TOKEN_KEY);

  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};
}

const emptyForm = {
  full_name: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postal_code: "",
  country: "India",
  address_type: "both",
};

export default function AddressStep({ onContinue }: AddressStepProps) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [shippingId, setShippingId] = useState<number | null>(null);
  const [billingId, setBillingId] = useState<number | null>(null);
  const [sameAsShipping, setSameAsShipping] = useState(true);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    loadAddresses();
  }, []);

  async function loadAddresses() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE}/api/account/addresses`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          ...getAuthHeaders(),
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Please login to view your saved addresses.");
        }

        if (response.status === 403) {
          throw new Error("Only logged-in customers can view addresses.");
        }

        throw new Error("Unable to load saved addresses.");
      }

      const data: Address[] = await response.json();

      setAddresses(data);

      const defaultAddress = data.find((address) => address.is_default);

      if (defaultAddress) {
        setShippingId(defaultAddress.id);
        setBillingId(defaultAddress.id);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while loading addresses."
      );
    } finally {
      setLoading(false);
    }
  }

  function updateField(field: string, value: string) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function validateForm() {
    if (!form.full_name.trim()) {
      return "Full name is required.";
    }

    if (!/^[A-Za-z ]{2,100}$/.test(form.full_name.trim())) {
      return "Enter a valid full name.";
    }

    if (!/^[6-9][0-9]{9}$/.test(form.phone)) {
      return "Enter a valid 10-digit mobile number.";
    }

    if (form.line1.trim().length < 3) {
      return "Address is required.";
    }

    if (form.city.trim().length < 2) {
      return "City is required.";
    }

    if (form.state.trim().length < 2) {
      return "State is required.";
    }

    if (!/^[0-9]{6}$/.test(form.postal_code)) {
      return "Enter a valid 6-digit PIN code.";
    }

    return "";
  }

  async function createAddress() {
    const validationError = validateForm();

    if (validationError) {
      setFormError(validationError);
      return;
    }

    setFormError("");
    setError("");

    try {
      const response = await fetch(`${API_BASE}/api/account/addresses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Please login before adding an address.");
        }

        if (response.status === 403) {
          throw new Error("Only logged-in customers can add addresses.");
        }

        const result = await response.json().catch(() => null);

        throw new Error(
          result?.detail || "Unable to save the new address."
        );
      }

      const newAddress: Address = await response.json();

      setAddresses((previous) => [...previous, newAddress]);
      setShippingId(newAddress.id);

      if (sameAsShipping) {
        setBillingId(newAddress.id);
      }

      setShowNewAddress(false);
      setForm(emptyForm);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while saving the address."
      );
    }
  }

  function getAddress(id: number | null) {
    if (!id) return null;

    return addresses.find((address) => address.id === id) || null;
  }

  function handleContinue() {
    if (!shippingId) {
      setError("Please select a shipping address.");
      return;
    }

    const shippingAddress = getAddress(shippingId);

    if (!shippingAddress) {
      setError("Selected shipping address could not be found.");
      return;
    }

    const finalBillingId = sameAsShipping ? shippingId : billingId;

    if (!finalBillingId) {
      setError("Please select a billing address.");
      return;
    }

    const billingAddress = getAddress(finalBillingId);

    if (!billingAddress) {
      setError("Selected billing address could not be found.");
      return;
    }

    setError("");
    onContinue(shippingAddress, billingAddress);
  }

  if (loading) {
    return (
      <div className="checkout-address-step">
        <div className="checkout-state">
          <div className="checkout-spinner" />
          <p>Loading your saved addresses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-address-step">
      <div className="checkout-section-header">
        <div>
          <h2>Shipping Address</h2>
          <p>Select the address where your order should be delivered.</p>
        </div>

        <button
          type="button"
          className="checkout-add-address-btn"
          onClick={() => {
            setShowNewAddress(!showNewAddress);
            setFormError("");
          }}
        >
          {showNewAddress ? "Cancel" : "+ Add New Address"}
        </button>
      </div>

      {error && <div className="checkout-error">{error}</div>}

      {addresses.length === 0 && !showNewAddress && (
        <div className="checkout-empty">
          <h3>No saved addresses</h3>
          <p>Add your delivery address to continue with checkout.</p>

          <button
            type="button"
            className="checkout-primary-btn"
            onClick={() => setShowNewAddress(true)}
          >
            Add Address
          </button>
        </div>
      )}

      {addresses.length > 0 && (
        <>
          <h3>Choose Shipping Address</h3>

          <div className="checkout-address-list">
            {addresses.map((address) => (
              <label
                key={`shipping-${address.id}`}
                className={`checkout-address-card ${
                  shippingId === address.id ? "selected" : ""
                }`}
              >
                <input
                  type="radio"
                  name="shipping-address"
                  checked={shippingId === address.id}
                  onChange={() => {
                    setShippingId(address.id);

                    if (sameAsShipping) {
                      setBillingId(address.id);
                    }
                  }}
                />

                <div className="checkout-address-content">
                  <div className="checkout-address-title">
                    <strong>{address.full_name}</strong>

                    {address.is_default && (
                      <span className="checkout-default-badge">
                        Default
                      </span>
                    )}
                  </div>

                  <p>{address.line1}</p>

                  {address.line2 && <p>{address.line2}</p>}

                  <p>
                    {address.city}, {address.state} -{" "}
                    {address.postal_code}
                  </p>

                  <p>{address.country}</p>
                  <p>📱 {address.phone}</p>
                </div>
              </label>
            ))}
          </div>

          <div className="checkout-section-header">
            <div>
              <h2>Billing Address</h2>
              <p>Choose where billing information should be associated.</p>
            </div>
          </div>

          <label className="checkout-checkbox-row">
            <input
              type="checkbox"
              checked={sameAsShipping}
              onChange={(e) => {
                const checked = e.target.checked;

                setSameAsShipping(checked);

                if (checked) {
                  setBillingId(shippingId);
                }
              }}
            />

            <span>Billing address is same as shipping address</span>
          </label>

          {!sameAsShipping && (
            <div className="checkout-address-list">
              {addresses.map((address) => (
                <label
                  key={`billing-${address.id}`}
                  className={`checkout-address-card ${
                    billingId === address.id ? "selected" : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="billing-address"
                    checked={billingId === address.id}
                    onChange={() => setBillingId(address.id)}
                  />

                  <div className="checkout-address-content">
                    <div className="checkout-address-title">
                      <strong>{address.full_name}</strong>
                    </div>

                    <p>{address.line1}</p>

                    {address.line2 && <p>{address.line2}</p>}

                    <p>
                      {address.city}, {address.state} -{" "}
                      {address.postal_code}
                    </p>

                    <p>{address.country}</p>
                    <p>📱 {address.phone}</p>
                  </div>
                </label>
              ))}
            </div>
          )}
        </>
      )}

      {showNewAddress && (
        <div className="checkout-new-address">
          <h3>Add New Address</h3>

          {formError && (
            <div className="checkout-error">{formError}</div>
          )}

          <div className="checkout-form-grid">
            <div className="checkout-field">
              <label>Full Name *</label>

              <input
                type="text"
                value={form.full_name}
                onChange={(e) =>
                  updateField("full_name", e.target.value)
                }
                placeholder="Enter full name"
              />
            </div>

            <div className="checkout-field">
              <label>Mobile Number *</label>

              <input
                type="tel"
                maxLength={10}
                value={form.phone}
                onChange={(e) =>
                  updateField(
                    "phone",
                    e.target.value.replace(/\D/g, "")
                  )
                }
                placeholder="10-digit mobile number"
              />
            </div>

            <div className="checkout-field full-width">
              <label>Address Line 1 *</label>

              <input
                type="text"
                value={form.line1}
                onChange={(e) =>
                  updateField("line1", e.target.value)
                }
                placeholder="House no., building, street"
              />
            </div>

            <div className="checkout-field full-width">
              <label>Address Line 2</label>

              <input
                type="text"
                value={form.line2}
                onChange={(e) =>
                  updateField("line2", e.target.value)
                }
                placeholder="Apartment, landmark, etc."
              />
            </div>

            <div className="checkout-field">
              <label>City *</label>

              <input
                type="text"
                value={form.city}
                onChange={(e) =>
                  updateField("city", e.target.value)
                }
                placeholder="City"
              />
            </div>

            <div className="checkout-field">
              <label>State *</label>

              <input
                type="text"
                value={form.state}
                onChange={(e) =>
                  updateField("state", e.target.value)
                }
                placeholder="State"
              />
            </div>

            <div className="checkout-field">
              <label>PIN Code *</label>

              <input
                type="text"
                maxLength={6}
                value={form.postal_code}
                onChange={(e) =>
                  updateField(
                    "postal_code",
                    e.target.value.replace(/\D/g, "")
                  )
                }
                placeholder="6-digit PIN"
              />
            </div>

            <div className="checkout-field">
              <label>Country</label>

              <input
                type="text"
                value={form.country}
                disabled
              />
            </div>
          </div>

          <button
            type="button"
            className="checkout-primary-btn"
            onClick={createAddress}
          >
            Save Address
          </button>
        </div>
      )}

      <div className="checkout-address-actions">
        <button
          type="button"
          className="checkout-primary-btn"
          onClick={handleContinue}
          disabled={
            !shippingId ||
            (!sameAsShipping && !billingId)
          }
        >
          Continue to Shipping
        </button>
      </div>
    </div>
  );
}