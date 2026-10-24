 // @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

const mocks = vi.hoisted(() => ({
  getProductById: vi.fn(),
  get: vi.fn(),
  post: vi.fn(),
  delete: vi.fn(),
}));

vi.mock("../../services/productService", () => ({
  getProductById: mocks.getProductById,
}));

vi.mock("../../services/apiClient", () => ({
  default: {
    get: mocks.get,
    post: mocks.post,
    delete: mocks.delete,
  },
}));

vi.mock("../../components/VariantSelector", () => ({
  default: () => <div>Variant selector</div>,
}));

import ProductDetailPage from "../../ProductDetailPage";

const product = {
  id: 1,
  name: "Headphones",
  description: "Wireless headphones",
  price: 999,
  stock_quantity: 2,
  status: "ACTIVE",
  category_id: 1,
  category_name: "Electronics",
  images: [
    {
      id: 1,
      image_url: "/headphones.jpg",
      is_primary: true,
    },
  ],
  related_products: [],
};

function renderProductPage() {
  return render(
    <MemoryRouter initialEntries={["/products/1"]}>
      <Routes>
        <Route path="/products/:id" element={<ProductDetailPage />} />
        <Route path="/login" element={<h1>Login page</h1>} />
        <Route path="/" element={<h1>Home page</h1>} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  mocks.getProductById.mockResolvedValue(product);
  mocks.get.mockResolvedValue({ data: [] });
  mocks.post.mockResolvedValue({ data: {} });
  mocks.delete.mockResolvedValue({ data: {} });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("ProductDetailPage", () => {
  it("displays the product details", async () => {
    renderProductPage();

    expect(
      await screen.findByRole("heading", { name: "Headphones" })
    ).toBeTruthy();

    expect(screen.getByText("Wireless headphones")).toBeTruthy();
    expect(screen.getByText("2 units available")).toBeTruthy();
    expect(mocks.getProductById).toHaveBeenCalledWith("1");
  });

  it("does not allow quantity to exceed available stock", async () => {
    renderProductPage();

    await screen.findByRole("heading", { name: "Headphones" });

    const quantityButtons = document.querySelectorAll(".quantity-button");

    fireEvent.click(quantityButtons[1]);
    expect(screen.getByText("2", { selector: ".quantity-value" })).toBeTruthy();
    expect(quantityButtons[1].disabled).toBe(true);

    fireEvent.click(quantityButtons[0]);
    expect(screen.getByText("1", { selector: ".quantity-value" })).toBeTruthy();
  });

  it("adds the selected quantity to the cart", async () => {
    vi.spyOn(window, "alert").mockImplementation(() => {});

    renderProductPage();

    await screen.findByRole("heading", { name: "Headphones" });

    fireEvent.click(screen.getByRole("button", { name: "Add to Cart" }));

    await waitFor(() => {
      expect(mocks.post).toHaveBeenCalledWith("/api/cart/items", {
        product_id: 1,
        quantity: 1,
        variant_id: null,
      });
    });
  });

  it("redirects logged-out users to login when they click wishlist", async () => {
    renderProductPage();

    await screen.findByRole("heading", { name: "Headphones" });

    fireEvent.click(screen.getByRole("button", { name: "Add to wishlist" }));

    expect(await screen.findByRole("heading", { name: "Login page" }))
      .toBeTruthy();
  });
});
