// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import SearchResultsPage from "../../SearchResultsPage";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function renderPage(query = "") {
  return render(
    <MemoryRouter initialEntries={[`/search?q=${encodeURIComponent(query)}`]}>
      <SearchResultsPage />
    </MemoryRouter>
  );
}

describe("SearchResultsPage", () => {
  it("displays products returned by the API", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        { id: 1, name: "Headphones", description: "Wireless headphones", price: 999 }
      ]
    }));

    renderPage("headphone");

    expect(await screen.findByText("Headphones")).toBeTruthy();
    expect(screen.getByText("Wireless headphones")).toBeTruthy();
    expect(screen.getByRole("link", { name: "View Product" }).getAttribute("href"))
      .toBe("/products/1");
  });

  it("does not call the API for an empty search", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    renderPage("");

    expect(await screen.findByText("No products found. Try another keyword."))
      .toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("shows a message when no products match", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => []
    }));

    renderPage("unknown");

    expect(await screen.findByText("No products found. Try another keyword."))
      .toBeTruthy();
  });

  it("handles API errors without crashing", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));

    renderPage("headphone");

    expect(await screen.findByText("No products found. Try another keyword."))
      .toBeTruthy();
  });
});
