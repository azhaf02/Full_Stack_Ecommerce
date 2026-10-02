import api from './api.js';

// Add item to cart
export const addToCart = (productId, quantity, variantId = null) => {
  return api.post('/api/cart/items', {
    product_id: productId,
    quantity: quantity,
    variant_id: variantId,
  });
};

// Get complete cart
export const getCart = () => {
  return api.get('/api/cart');
};

// Update cart item quantity
export const updateCartItem = (itemId, quantity) => {
  return api.put(`/api/cart/items/${itemId}`, {
    quantity,
  });
};

// Remove item from cart
export const removeCartItem = (itemId) => {
  return api.delete(`/api/cart/items/${itemId}`);
};

// Get cart pricing summary
export const getCartSummary = () => {
  return api.get('/api/cart/summary');
};

// Apply coupon
export const applyCoupon = (code) => {
  return api.post('/api/cart/coupon', {
    code,
  });
};