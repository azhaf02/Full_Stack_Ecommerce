import React, { useEffect, useState } from 'react';
import './CartPage.css';

import {
  getCart,
  updateCartItem,
  removeCartItem,
  getCartSummary,
  applyCoupon as applyCouponApi,
} from '../services/cartService';

interface CartItem {
  id: number;
  product_id: number;
  variant_id: number | null;
  quantity: number;
  unit_price: number | string;
  line_total: number | string;
  name?: string;
  category?: string;
  icon?: string;
}

interface CartResponse {
  cart_id: number | null;
  items: CartItem[];
  item_count: number;
}

interface CartSummary {
  subtotal: number | string;
  discount: number | string;
  tax: number | string;
  total: number | string;
}

interface CouponResponse {
  message: string;
  code: string;
  discount_type: string;
  discount_value: number | string;
}

interface CartPageProps {
  onContinueShopping?: () => void;
  onCheckout?: () => void;
}

const formatINR = (value: number | string): string => {
  const amount = Number(value) || 0;

  return `₹${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
};

export default function CartPage({
  onContinueShopping,
  onCheckout,
}: CartPageProps) {
  const [items, setItems] = useState<CartItem[]>([]);

  const [summary, setSummary] = useState<CartSummary>({
    subtotal: 0,
    discount: 0,
    tax: 0,
    total: 0,
  });

  const [coupon, setCoupon] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(false);
  const [appliedCouponData, setAppliedCouponData] =
    useState<CouponResponse | null>(null);

  const [couponMessage, setCouponMessage] = useState('');
  const [removingId, setRemovingId] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  /* ---------- LOAD CART ---------- */

  const loadCart = async () => {
    try {
      setLoading(true);
      setError('');

      const [cartResponse, summaryResponse] = await Promise.all([
        getCart(),
        getCartSummary(),
      ]);

      const cartData: CartResponse = cartResponse.data;
      const summaryData: CartSummary = summaryResponse.data;

      setItems(cartData.items || []);
      setSummary(summaryData);
    } catch (err) {
      console.error('Failed to load cart:', err);
      setError('Unable to load your cart. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCart();
  }, []);

  /* ---------- UPDATE QUANTITY ---------- */

  const updateQuantity = async (
    item: CartItem,
    change: number
  ): Promise<void> => {
    const newQuantity = item.quantity + change;

    if (newQuantity < 1) {
      return;
    }

    try {
      setError('');

      await updateCartItem(item.id, newQuantity);

      /*
       * Reload cart and pricing after quantity change.
       * If a coupon is active, reapply its discount locally.
       */
      await loadCart();

      if (appliedCouponData) {
        const cartSummaryResponse = await getCartSummary();
        const latestSummary: CartSummary =
          cartSummaryResponse.data;

        const subtotal = Number(latestSummary.subtotal) || 0;
        const discountValue =
          Number(appliedCouponData.discount_value) || 0;

        let discount = 0;

        if (
          appliedCouponData.discount_type ===
          'PERCENTAGE'
        ) {
          discount =
            (subtotal * discountValue) / 100;
        } else {
          discount = discountValue;
        }

        discount = Math.min(discount, subtotal);

        const tax = Number(latestSummary.tax) || 0;

        setSummary({
          ...latestSummary,
          discount,
          total: subtotal - discount + tax,
        });
      }
    } catch (err) {
      console.error('Failed to update quantity:', err);
      setError('Unable to update quantity.');
    }
  };

  /* ---------- REMOVE ITEM ---------- */

  const handleRemove = async (
    id: number
  ): Promise<void> => {
    try {
      setRemovingId(id);
      setError('');

      await new Promise((resolve) =>
        setTimeout(resolve, 300)
      );

      await removeCartItem(id);

      setAppliedCoupon(false);
      setAppliedCouponData(null);
      setCouponMessage('');

      await loadCart();
    } catch (err) {
      console.error('Failed to remove item:', err);
      setError('Unable to remove item.');
    } finally {
      setRemovingId(null);
    }
  };

  /* ---------- APPLY COUPON ---------- */

  const handleApplyCoupon = async (): Promise<void> => {
    const code = coupon.trim().toUpperCase();

    if (!code) {
      setAppliedCoupon(false);
      setAppliedCouponData(null);
      setCouponMessage(
        'Please enter a coupon code'
      );
      return;
    }

    try {
      setError('');

      const response = await applyCouponApi(code);

      const data: CouponResponse = response.data;

      setAppliedCoupon(true);
      setAppliedCouponData(data);

      setCouponMessage(
        `✓ ${data.code} applied successfully`
      );

      /*
       * Get current server pricing.
       */
      const summaryResponse =
        await getCartSummary();

      const latestSummary: CartSummary =
        summaryResponse.data;

      const subtotal =
        Number(latestSummary.subtotal) || 0;

      const discountValue =
        Number(data.discount_value) || 0;

      let discount = 0;

      /*
       * Calculate coupon discount.
       */
      if (
        data.discount_type === 'PERCENTAGE'
      ) {
        discount =
          (subtotal * discountValue) / 100;
      } else {
        discount = discountValue;
      }

      /*
       * Discount cannot be greater than subtotal.
       */
      discount = Math.min(
        discount,
        subtotal
      );

      const tax =
        Number(latestSummary.tax) || 0;

      const total =
        subtotal - discount + tax;

      /*
       * Update order summary immediately.
       */
      setSummary({
        ...latestSummary,
        discount,
        total,
      });

    } catch (err: any) {
      console.error(
        'Coupon error:',
        err
      );

      setAppliedCoupon(false);
      setAppliedCouponData(null);

      const message =
        err?.response?.data?.detail ||
        'Invalid coupon code';

      setCouponMessage(message);
    }
  };

  /* ---------- CONTINUE SHOPPING ---------- */

  const handleContinue = (): void => {
    if (onContinueShopping) {
      onContinueShopping();
    } else {
      window.location.assign('/');
    }
  };

  /* ---------- CHECKOUT ---------- */

  const handleCheckout = (): void => {
    if (onCheckout) {
      onCheckout();
    }
  };

  /* ---------- LOADING ---------- */

  if (loading) {
    return (
      <div className="viora-cart-page">
        <div className="viora-cart-inner">
          <div className="viora-empty-cart">
            <div className="viora-empty-icon">
              🛍
            </div>

            <h1 className="viora-empty-title">
              Loading Your Shopping Bag...
            </h1>

            <p className="viora-empty-text">
              Please wait while we load your cart.
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* ---------- EMPTY CART ---------- */

  if (items.length === 0) {
    return (
      <div className="viora-empty-page">

        <div className="empty-orb orb-one"></div>
        <div className="empty-orb orb-two"></div>
        <div className="empty-orb orb-three"></div>

        <div className="viora-empty-content">

          <div className="empty-cart-icon">
            <i className="bi bi-bag-heart"></i>
          </div>

          <div className="empty-eyebrow">
            YOUR VIORA BAG
          </div>

          <h1>
            Your Shopping Bag is Empty
          </h1>

          <p>
            Looks like you haven't added anything
            to your bag yet.
            <br />
            Discover something you'll love.
          </p>

          <button
            className="continue-shopping-btn"
            onClick={handleContinue}
          >
            <span>
              Continue Shopping
            </span>

            <i className="bi bi-arrow-right"></i>
          </button>

          <div className="empty-benefits">

            <span>
              <i className="bi bi-shield-check"></i>
              Secure Shopping
            </span>

            <span>
              <i className="bi bi-truck"></i>
              Easy Delivery
            </span>

            <span>
              <i className="bi bi-heart"></i>
              Made for You
            </span>

          </div>

        </div>
      </div>
    );
  }

  /* ---------- CART ---------- */

  return (
    <div className="viora-cart-page">

      <div className="viora-cart-inner">

        {/* ERROR */}

        {error && (
          <div
            role="alert"
            style={{
              marginBottom: '20px',
              padding: '12px 16px',
              borderRadius: '8px',
              background: '#f8e8e5',
              color: '#8a3d32',
            }}
          >
            {error}
          </div>
        )}

        {/* HEADER */}

        <header className="viora-cart-header">

          <div className="viora-cart-header-text">

            <span className="viora-label">
              VIORA SHOPPING BAG
            </span>

            <h1 className="viora-title">
              Your Shopping Bag
            </h1>

            <p className="viora-subtitle">
              Review your selected products before checkout.
            </p>

          </div>

          <div className="viora-item-pill">
            {items.reduce(
              (total, item) =>
                total + item.quantity,
              0
            )}{' '}
            Items
          </div>

        </header>

        {/* PROGRESS */}

        <nav
          className="viora-stepper"
          aria-label="Checkout progress"
        >

          <div className="viora-step viora-step-active">

            <span className="viora-step-dot">
              1
            </span>

            <span className="viora-step-name">
              Cart
            </span>

          </div>

          <div className="viora-step-line viora-step-line-active" />

          <div className="viora-step viora-step-active">

            <span className="viora-step-dot">
              2
            </span>

            <span className="viora-step-name">
              Checkout
            </span>

          </div>

          <div className="viora-step-line" />

          <div className="viora-step">

            <span className="viora-step-dot">
              3
            </span>

            <span className="viora-step-name">
              Complete
            </span>

          </div>

        </nav>

        {/* MAIN GRID */}

        <div className="viora-cart-grid">

          {/* LEFT COLUMN */}

          <main className="viora-cart-main">

            <div className="viora-section-heading">

              <div>

                <span className="viora-label">
                  YOUR SELECTION
                </span>

                <h2 className="viora-section-title">
                  Items in your bag
                </h2>

              </div>

              <span className="viora-product-count">
                {items.length}{' '}
                {items.length === 1
                  ? 'product'
                  : 'products'}
              </span>

            </div>

            {/* ITEMS */}

            <div className="viora-items-list">

              {items.map((item, index) => (

                <article
                  className={
                    removingId === item.id
                      ? 'viora-product-card viora-product-card-removing'
                      : 'viora-product-card'
                  }
                  key={item.id}
                  style={{
                    animationDelay:
                      `${0.2 + index * 0.12}s`,
                  }}
                >

                  <div className="viora-product-image">

                    <span className="viora-product-emoji">
                      {item.icon || '🛍'}
                    </span>

                  </div>

                  <div className="viora-product-body">

                    <div className="viora-product-info">

                      <span className="viora-category">
                        {item.category || 'Product'}
                      </span>

                      <h3 className="viora-product-name">
                        {item.name ||
                          `Product #${item.product_id}`}
                      </h3>

                      <div className="viora-price">
                        {formatINR(
                          item.unit_price
                        )}
                      </div>

                      <button
                        type="button"
                        className="viora-remove"
                        onClick={() =>
                          handleRemove(item.id)
                        }
                        disabled={
                          removingId === item.id
                        }
                      >
                        × Remove
                      </button>

                    </div>

                    <div className="viora-product-actions">

                      <div className="viora-qty-group">

                        <span className="viora-small-label">
                          QUANTITY
                        </span>

                        <div className="viora-quantity">

                          <button
                            type="button"
                            className="viora-qty-btn"
                            onClick={() =>
                              updateQuantity(
                                item,
                                -1
                              )
                            }
                            disabled={
                              item.quantity <= 1
                            }
                            aria-label={`Decrease quantity of ${
                              item.name ||
                              `Product ${item.product_id}`
                            }`}
                          >
                            −
                          </button>

                          <span className="viora-qty-value">
                            {item.quantity}
                          </span>

                          <button
                            type="button"
                            className="viora-qty-btn"
                            onClick={() =>
                              updateQuantity(
                                item,
                                1
                              )
                            }
                            aria-label={`Increase quantity of ${
                              item.name ||
                              `Product ${item.product_id}`
                            }`}
                          >
                            +
                          </button>

                        </div>

                      </div>

                      <div className="viora-item-total">

                        <span className="viora-small-label">
                          ITEM TOTAL
                        </span>

                        <strong>
                          {formatINR(
                            Number(
                              item.unit_price
                            ) *
                              item.quantity
                          )}
                        </strong>

                      </div>

                    </div>

                  </div>

                </article>

              ))}

            </div>

            {/* COUPON */}

            <section className="viora-coupon">

              <div className="viora-coupon-icon">
                %
              </div>

              <div className="viora-coupon-content">

                <span className="viora-label">
                  SAVE MORE
                </span>

                <h3 className="viora-coupon-title">
                  Have a coupon?
                </h3>

                <p className="viora-coupon-text">
                  Unlock exclusive savings on your order.
                </p>

                <div className="viora-coupon-row">

                  <input
                    type="text"
                    className="viora-coupon-input"
                    value={coupon}
                    onChange={(e) =>
                      setCoupon(
                        e.target.value
                      )
                    }
                    onKeyDown={(e) => {

                      if (e.key === 'Enter') {
                        handleApplyCoupon();
                      }

                    }}
                    placeholder="Enter coupon code"
                    aria-label="Coupon code"
                  />

                  <button
                    type="button"
                    className="viora-coupon-btn"
                    onClick={
                      handleApplyCoupon
                    }
                  >
                    Apply
                  </button>

                </div>

                {couponMessage && (
                  <span
                    className={
                      appliedCoupon
                        ? 'viora-coupon-message viora-success'
                        : 'viora-coupon-message viora-error'
                    }
                  >
                    {couponMessage}
                  </span>
                )}

                <span className="viora-coupon-hint">
                  Enter an available coupon code
                </span>

              </div>

            </section>

          </main>

          {/* RIGHT COLUMN */}

          <aside className="viora-order-summary">

            <div className="viora-summary-top">

              <span className="viora-summary-label">
                YOUR ORDER
              </span>

              <h2 className="viora-summary-title">
                Order Summary
              </h2>

              <p className="viora-summary-sub">
                A little overview before checkout.
              </p>

            </div>

            {/* SUMMARY */}

            <div className="viora-summary-lines">

              <div className="viora-summary-line">

                <span>
                  Subtotal
                </span>

                <strong>
                  {formatINR(
                    summary.subtotal
                  )}
                </strong>

              </div>

              <div className="viora-summary-line">

                <span>
                  Discount
                </span>

                <strong>
                  {Number(summary.discount) > 0
                    ? `− ${formatINR(
                        summary.discount
                      )}`
                    : '₹0'}
                </strong>

              </div>

              <div className="viora-summary-line">

                <span>
                  Tax
                </span>

                <strong>
                  {formatINR(
                    summary.tax
                  )}
                </strong>

              </div>

              <div className="viora-summary-line">

                <span>
                  Delivery
                </span>

                <strong className="viora-free">
                  FREE
                </strong>

              </div>

            </div>

            <div className="viora-summary-divider" />

            {/* TOTAL */}

            <div className="viora-total">

              <div className="viora-total-text">

                <span className="viora-total-label">
                  Total amount
                </span>

                <small>
                  Inclusive of applicable taxes
                </small>

              </div>

              <strong className="viora-total-value">
                {formatINR(
                  summary.total
                )}
              </strong>

            </div>

            {/* CHECKOUT */}

            <button
              type="button"
              className="viora-checkout-btn"
              onClick={handleCheckout}
            >

              <span>
                Proceed to Checkout
              </span>

              <span className="viora-checkout-arrow">
                →
              </span>

            </button>

            {/* SECURITY */}

            <div className="viora-secure">

              <span className="viora-secure-icon">
                🔒
              </span>

              <div>

                <strong>
                  Secure Checkout
                </strong>

                <p>
                  Your payment information is protected.
                </p>

              </div>

            </div>

            {/* BENEFITS */}

            <div className="viora-benefits">

              <div className="viora-benefit">
                <span>✓</span>
                <small>
                  Easy returns
                </small>
              </div>

              <div className="viora-benefit">
                <span>✓</span>
                <small>
                  Secure payments
                </small>
              </div>

              <div className="viora-benefit">
                <span>✓</span>
                <small>
                  Quality products
                </small>
              </div>

            </div>

          </aside>

        </div>

      </div>

    </div>
  );
}