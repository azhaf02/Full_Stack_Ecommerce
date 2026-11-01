import apiClient from './apiClient';

// Add item to cart
export const addToCart = (productId: number, quantity: number, variantId: number | null = null) => {
  return apiClient.post('/api/cart/items', {
    product_id: productId,
    quantity: quantity,
    variant_id: variantId,
  });
};

// Get complete cart
export const getCart = () => {
  return apiClient.get('/api/cart');
};

// Update cart item quantity
export const updateCartItem = (itemId: number, quantity: number) => {
  return apiClient.put(`/api/cart/items/${itemId}`, {
    quantity,
  });
};

// Remove item from cart
export const removeCartItem = (itemId: number) => {
  return apiClient.delete(`/api/cart/items/${itemId}`);
};

// Get cart pricing summary
export const getCartSummary = () => {
  return apiClient.get('/api/cart/summary');
};

// Apply coupon
export const applyCoupon = (code: string) => {
  return apiClient.post('/api/cart/coupon', {
    code,
  });
};