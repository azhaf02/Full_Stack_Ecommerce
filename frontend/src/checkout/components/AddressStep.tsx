
import { useEffect, useState } from "react";

type AddressType = "shipping" | "billing" | "both";

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
  address_type: AddressType;
  is_default: boolean;
};

type AddressForm = {
  full_name: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  address_type: AddressType;
};

type AddressStepProps = {
  onContinue: (
    shippingAddress: Address,
    billingAddress: Address
  ) => void;
};

// Configure VITE_API_BASE_URL in frontend/.env if needed.
// It should contain the backend origin, e.g. http://127.0.0.1:8000
const API_BASE = (
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000"
).replace(/\/+$/, "");

const emptyForm: AddressForm = {
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

function getAuthHeaders(): Record<string, string> {
  const token =
    localStorage.getItem("viora_token") ||
    localStorage.getItem("access_token") ||
    localStorage.getItem("token");

  return token
    ? { Authorization: `Bearer ${token}` }
    : {};
}

function canShip(address: Address): boolean {
  return (
    address.address_type === "shipping" ||
    address.address_type === "both"
  );
}

function canBill(address: Address): boolean {
  return (
    address.address_type === "billing" ||
    address.address_type === "both"
  );
}

async function getApiError(
  response: Response,
  fallback: string
): Promise<string> {
  const responseText = await response.text();

  if (!responseText) return fallback;

  try {
    const data = JSON.parse(responseText);
    const detail = data?.detail || data?.message;

    if (typeof detail === "string") return detail;

    if (Array.isArray(detail)) {
      return detail
        .map((item) => item.msg || "Invalid input")
        .join(", ");
    }
  } catch {
    // The server returned non-JSON content.
  }

  return fallback;
}

export default function AddressStep({
  onContinue,
}: AddressStepProps) {
  const [addresses, setAddresses] = useState<Address[]>([]);

  const [shippingId, setShippingId] = useState<number | null>(null);
  const [billingId, setBillingId] = useState<number | null>(null);

  const [sameAsShipping, setSameAsShipping] = useState(true);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");

  const [showNewAddress, setShowNewAddress] = useState(false);
  const [form, setForm] = useState<AddressForm>(emptyForm);

  useEffect(() => {
    void loadAddresses();
  }, []);

  async function loadAddresses() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_BASE}/api/account/addresses`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            ...getAuthHeaders(),
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(
            "Please login to view your saved addresses."
          );
        }

        if (response.status === 403) {
          throw new Error(
            "Only logged-in customers can view addresses."
          );
        }

        throw new Error(
          await getApiError(
            response,
            "Unable to load saved addresses."
          )
        );
      }

      const data: Address[] = await response.json();

      if (!Array.isArray(data)) {
        throw new Error(
          "Invalid address data received from the server."
        );
      }

      setAddresses(data);

      // Only select addresses that support the relevant purpose.
      const shippingAddresses = data.filter(canShip);
      const billingAddresses = data.filter(canBill);

      const defaultShipping =
        shippingAddresses.find((address) => address.is_default) ||
        shippingAddresses[0] ||
        null;

      const defaultBilling =
        billingAddresses.find((address) => address.is_default) ||
        billingAddresses[0] ||
        null;

      setShippingId(defaultShipping?.id ?? null);

      if (
        defaultShipping &&
        canBill(defaultShipping)
      ) {
        setSameAsShipping(true);
        setBillingId(defaultShipping.id);
      } else {
        setSameAsShipping(false);
        setBillingId(defaultBilling?.id ?? null);
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

  function updateField<K extends keyof AddressForm>(
    field: K,
    value: AddressForm[K]
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function validateForm(): string {
    const name = form.full_name.trim();

    if (!name) {
      return "Full name is required.";
    }

    if (!/^[\p{L}\p{M}][\p{L}\p{M} .'-]{1,99}$/u.test(name)) {
      return "Enter a valid full name.";
    }

    if (!/^[6-9][0-9]{9}$/.test(form.phone)) {
      return "Enter a valid 10-digit Indian mobile number.";
    }

    if (form.line1.trim().length < 3) {
      return "Enter a valid address.";
    }

    if (form.line1.trim().length > 200) {
      return "Address Line 1 must be 200 characters or fewer.";
    }

    if (form.line2.trim().length > 200) {
      return "Address Line 2 must be 200 characters or fewer.";
    }

    if (form.city.trim().length < 2) {
      return "Enter a valid city.";
    }

    if (form.state.trim().length < 2) {
      return "Enter a valid state.";
    }

    if (!/^[0-9]{6}$/.test(form.postal_code)) {
      return "Enter a valid 6-digit PIN code.";
    }

    if (!form.country.trim()) {
      return "Country is required.";
    }

    return "";
  }

  async function createAddress() {
    if (saving) return;

    const validationError = validateForm();

    if (validationError) {
      setFormError(validationError);
      return;
    }

    setSaving(true);
    setFormError("");
    setError("");

    try {
      const payload: AddressForm = {
        ...form,
        full_name: form.full_name.trim(),
        phone: form.phone.trim(),
        line1: form.line1.trim(),
        line2: form.line2.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        postal_code: form.postal_code.trim(),
        country: form.country.trim(),
      };

      const response = await fetch(
        `${API_BASE}/api/account/addresses`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            ...getAuthHeaders(),
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(
            "Please login before adding an address."
          );
        }

        if (response.status === 403) {
          throw new Error(
            "Only logged-in customers can add addresses."
          );
        }

        throw new Error(
          await getApiError(
            response,
            "Unable to save the new address."
          )
        );
      }

      const newAddress: Address = await response.json();

      if (
        !newAddress ||
        typeof newAddress.id !== "number"
      ) {
        throw new Error(
          "The server returned an invalid address."
        );
      }

      setAddresses((previous) => [
        ...previous,
        newAddress,
      ]);

      if (canShip(newAddress)) {
        setShippingId(newAddress.id);
      }

      if (sameAsShipping && canBill(newAddress)) {
        setBillingId(newAddress.id);
      } else if (sameAsShipping && !canBill(newAddress)) {
        setSameAsShipping(false);

        const existingBilling = addresses.find(canBill);
        setBillingId(existingBilling?.id ?? null);
      } else if (!billingId && canBill(newAddress)) {
        setBillingId(newAddress.id);
      }

      setShowNewAddress(false);
      setForm(emptyForm);
      setFormError("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while saving the address."
      );
    } finally {
      setSaving(false);
    }
  }

  function getAddress(id: number | null): Address | null {
    if (id === null) return null;

    return (
      addresses.find((address) => address.id === id) || null
    );
  }

  function handleShippingChange(address: Address) {
    if (!canShip(address)) return;

    setShippingId(address.id);
    setError("");

    if (sameAsShipping) {
      if (canBill(address)) {
        setBillingId(address.id);
      } else {
        // A shipping-only address cannot also be used for billing.
        setSameAsShipping(false);

        const existingBilling = addresses.find(
          (item) => item.id === billingId && canBill(item)
        );

        const defaultBilling =
          addresses.find(
            (item) => item.is_default && canBill(item)
          ) || addresses.find(canBill);

        setBillingId(
          existingBilling?.id ??
          defaultBilling?.id ??
          null
        );
      }
    }
  }

  function handleSameAsShippingChange(checked: boolean) {
    if (checked) {
      const shippingAddress = getAddress(shippingId);

      if (!shippingAddress || !canBill(shippingAddress)) {
        setError(
          "This shipping address cannot be used for billing. Please choose a billing address separately."
        );
        return;
      }

      setBillingId(shippingAddress.id);
    }

    setSameAsShipping(checked);
    setError("");
  }

  function handleContinue() {
    const shippingAddress = getAddress(shippingId);

    if (!shippingAddress || !canShip(shippingAddress)) {
      setError("Please select a valid shipping address.");
      return;
    }

    const finalBillingId = sameAsShipping
      ? shippingId
      : billingId;

    const billingAddress = getAddress(finalBillingId);

    if (!billingAddress || !canBill(billingAddress)) {
      setError("Please select a valid billing address.");
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

  const shippingAddresses = addresses.filter(canShip);
  const billingAddresses = addresses.filter(canBill);

  return (
    <div className="checkout-address-step">
      <div className="checkout-section-header">
        <div>
          <h2>Shipping Address</h2>
          <p>
            Select the address where your order should be delivered.
          </p>
        </div>

        <button
          type="button"
          className="checkout-add-address-btn"
          onClick={() => {
            setShowNewAddress((previous) => !previous);
            setFormError("");
            setError("");
          }}
        >
          {showNewAddress ? "Cancel" : "+ Add New Address"}
        </button>
      </div>

      {error && (
        <div className="checkout-error" role="alert">
          {error}
        </div>
      )}

      {shippingAddresses.length === 0 &&
        !showNewAddress && (
          <div className="checkout-empty">
            <h3>No shipping addresses available</h3>
            <p>
              Add a shipping address to continue with checkout.
            </p>

            <button
              type="button"
              className="checkout-primary-btn"
              onClick={() => setShowNewAddress(true)}
            >
              Add Address
            </button>
          </div>
        )}

      {shippingAddresses.length > 0 && (
        <>
          <h3>Choose Shipping Address</h3>

          <div className="checkout-address-list">
            {shippingAddresses.map((address) => (
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
                  onChange={() => handleShippingChange(address)}
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
                  <p>Mobile: {address.phone}</p>
                </div>
              </label>
            ))}
          </div>

          <div className="checkout-section-header">
            <div>
              <h2>Billing Address</h2>
              <p>
                Choose where billing information should be associated.
              </p>
            </div>
          </div>

          <label className="checkout-checkbox-row">
            <input
              type="checkbox"
              checked={sameAsShipping}
              disabled={
                !getAddress(shippingId) ||
                !canBill(getAddress(shippingId)!)
              }
              onChange={(event) =>
                handleSameAsShippingChange(event.target.checked)
              }
            />

            <span>
              Billing address is same as shipping address
            </span>
          </label>

          {!sameAsShipping && (
            <div className="checkout-address-list">
              {billingAddresses.map((address) => (
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
                    onChange={() => {
                      setBillingId(address.id);
                      setError("");
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
                    <p>Mobile: {address.phone}</p>
                  </div>
                </label>
              ))}

              {billingAddresses.length === 0 && (
                <p>
                  No billing addresses available. Please add a
                  billing address or an address with type "both".
                </p>
              )}
            </div>
          )}
        </>
      )}

      {showNewAddress && (
        <div className="checkout-new-address">
          <h3>Add New Address</h3>

          {formError && (
            <div className="checkout-error" role="alert">
              {formError}
            </div>
          )}

          <div className="checkout-form-grid">
            <div className="checkout-field">
              <label htmlFor="address-full-name">
                Full Name *
              </label>

              <input
                id="address-full-name"
                type="text"
                autoComplete="name"
                maxLength={100}
                value={form.full_name}
                onChange={(event) =>
                  updateField("full_name", event.target.value)
                }
                placeholder="Enter full name"
              />
            </div>

            <div className="checkout-field">
              <label htmlFor="address-phone">
                Mobile Number *
              </label>

              <input
                id="address-phone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                maxLength={10}
                value={form.phone}
                onChange={(event) =>
                  updateField(
                    "phone",
                    event.target.value.replace(/\D/g, "").slice(0, 10)
                  )
                }
                placeholder="10-digit mobile number"
              />
            </div>

            <div className="checkout-field full-width">
              <label htmlFor="address-line1">
                Address Line 1 *
              </label>

              <input
                id="address-line1"
                type="text"
                autoComplete="address-line1"
                maxLength={200}
                value={form.line1}
                onChange={(event) =>
                  updateField("line1", event.target.value)
                }
                placeholder="House no., building, street"
              />
            </div>

            <div className="checkout-field full-width">
              <label htmlFor="address-line2">
                Address Line 2
              </label>

              <input
                id="address-line2"
                type="text"
                autoComplete="address-line2"
                maxLength={200}
                value={form.line2}
                onChange={(event) =>
                  updateField("line2", event.target.value)
                }
                placeholder="Apartment, landmark, etc."
              />
            </div>

            <div className="checkout-field">
              <label htmlFor="address-city">City *</label>

              <input
                id="address-city"
                type="text"
                autoComplete="address-level2"
                value={form.city}
                onChange={(event) =>
                  updateField("city", event.target.value)
                }
                placeholder="City"
              />
            </div>

            <div className="checkout-field">
              <label htmlFor="address-state">State *</label>

              <input
                id="address-state"
                type="text"
                autoComplete="address-level1"
                value={form.state}
                onChange={(event) =>
                  updateField("state", event.target.value)
                }
                placeholder="State"
              />
            </div>

            <div className="checkout-field">
              <label htmlFor="address-postal-code">
                PIN Code *
              </label>

              <input
                id="address-postal-code"
                type="text"
                inputMode="numeric"
                autoComplete="postal-code"
                maxLength={6}
                value={form.postal_code}
                onChange={(event) =>
                  updateField(
                    "postal_code",
                    event.target.value.replace(/\D/g, "").slice(0, 6)
                  )
                }
                placeholder="6-digit PIN"
              />
            </div>

            <div className="checkout-field">
              <label htmlFor="address-country">Country *</label>

              <input
                id="address-country"
                type="text"
                value={form.country}
                disabled
              />
            </div>

            <div className="checkout-field full-width">
              <label htmlFor="address-type">Address Type *</label>

              <select
                id="address-type"
                value={form.address_type}
                onChange={(event) =>
                  updateField(
                    "address_type",
                    event.target.value as AddressType
                  )
                }
              >
                <option value="both">Shipping and Billing</option>
                <option value="shipping">Shipping Only</option>
                <option value="billing">Billing Only</option>
              </select>
            </div>
          </div>

          <button
            type="button"
            className="checkout-primary-btn"
            onClick={createAddress}
            disabled={saving}
          >
            {saving ? "Saving Address..." : "Save Address"}
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
            (!sameAsShipping && !billingId) ||
            saving
          }
        >
          Continue to Shipping
        </button>
      </div>
    </div>
  );
}
