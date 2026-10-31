import type { Product } from "../types/product";

const API_URL = "http://127.0.0.1:8000";

export const getProductById = async (
  productId: string
): Promise<Product> => {
  const response = await fetch(
    `${API_URL}/api/products/${productId}`
  );

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Product not found");
    }

    throw new Error("Failed to fetch product");
  }

  return response.json();
};