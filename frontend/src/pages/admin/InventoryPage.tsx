
import { useCallback, useEffect, useState } from "react";
import {
  adjustInventory,
  getInventory,
  getLowStockInventory,
  type InventoryItem,
} from "../../services/adminService";

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [lowStockItems, setLowStockItems] = useState<InventoryItem[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [quantityChange, setQuantityChange] = useState("1");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadInventory = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [inventory, lowStock] = await Promise.all([
        getInventory(),
        getLowStockInventory(),
      ]);

      setItems(inventory);
      setLowStockItems(lowStock);

      setSelectedId((current) => {
        if (current && inventory.some((item) => item.id === Number(current))) {
          return current;
        }
        return inventory.length ? String(inventory[0].id) : "";
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load inventory."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadInventory();
  }, [loadInventory]);

  const selectedItem = items.find((item) => item.id === Number(selectedId));

  const handleAdjustment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const change = Number(quantityChange);

    if (!selectedId) {
      setError("Select an inventory record first.");
      return;
    }

    if (!Number.isInteger(change) || change === 0) {
      setError("Quantity change must be a non-zero whole number.");
      return;
    }

    if (!reason.trim()) {
      setError("A reason is required for every stock adjustment.");
      return;
    }

    if (selectedItem && selectedItem.quantity + change < 0) {
      setError("Stock quantity cannot become negative.");
      return;
    }

    try {
      setSaving(true);

      const updated = await adjustInventory(Number(selectedId), {
        quantity_change: change,
        reason: reason.trim(),
      });

      setSuccess(
        `Stock updated successfully. New quantity: ${updated.quantity}.`
      );
      setReason("");
      await loadInventory();
    } catch (err: unknown) {
      const message =
        typeof err === "object" &&
        err !== null &&
        "response" in err &&
        typeof err.response === "object" &&
        err.response !== null &&
        "data" in err.response &&
        typeof err.response.data === "object" &&
        err.response.data !== null &&
        "detail" in err.response.data
          ? String(err.response.data.detail)
          : err instanceof Error
            ? err.message
            : "Stock adjustment failed.";

      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const statusClasses: Record<string, string> = {
    IN_STOCK: "bg-green-100 text-green-800",
    LOW_STOCK: "bg-amber-100 text-amber-800",
    OUT_OF_STOCK: "bg-red-100 text-red-800",
  };

  return (
    <main className="space-y-6 p-4 sm:p-6 lg:p-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-primary-900">
            Inventory Management
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Monitor stock, adjust quantities, and review low-stock items.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadInventory()}
          disabled={loading}
          className="rounded-lg border border-primary-300 bg-white px-4 py-2 text-sm font-semibold text-primary-800 hover:bg-primary-50 disabled:opacity-50"
        >
          Refresh
        </button>
      </header>

      {error && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {success && (
        <div role="status" className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          {success}
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Inventory records</p>
          <p className="mt-2 text-3xl font-bold text-primary-900">
            {items.length}
          </p>
        </div>
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Low stock</p>
          <p className="mt-2 text-3xl font-bold text-amber-700">
            {lowStockItems.filter((item) => item.status === "LOW_STOCK").length}
          </p>
        </div>
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Out of stock</p>
          <p className="mt-2 text-3xl font-bold text-red-700">
            {lowStockItems.filter((item) => item.status === "OUT_OF_STOCK").length}
          </p>
        </div>
      </section>

      <section className="rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-primary-900">
          Manual stock adjustment
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          Use a positive number to add stock or a negative number to remove stock.
          A reason is required.
        </p>

        <form onSubmit={handleAdjustment} className="mt-5 grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="inventory-record" className="mb-1 block text-sm font-medium">
              Inventory record
            </label>
            <select
              id="inventory-record"
              value={selectedId}
              onChange={(event) => setSelectedId(event.target.value)}
              required
              className="w-full rounded-lg border p-2.5"
            >
              <option value="">Select a record</option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  #{item.id} — {item.product_name}
                  {item.variant_id !== null ? ` (Variant ${item.variant_id})` : ""}
                  {" — Stock: "}{item.quantity}
                </option>
              ))}
            </select>
            {selectedItem && (
              <p className="mt-1 text-xs text-gray-500">
                Current stock: {selectedItem.quantity} · Threshold: {selectedItem.low_stock_threshold}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="quantity-change" className="mb-1 block text-sm font-medium">
              Quantity change
            </label>
            <input
              id="quantity-change"
              type="number"
              step="1"
              required
              value={quantityChange}
              onChange={(event) => setQuantityChange(event.target.value)}
              className="w-full rounded-lg border p-2.5"
              placeholder="e.g. 5 or -2"
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="adjustment-reason" className="mb-1 block text-sm font-medium">
              Reason <span className="text-red-600">*</span>
            </label>
            <textarea
              id="adjustment-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              required
              minLength={1}
              maxLength={500}
              rows={3}
              className="w-full rounded-lg border p-2.5"
              placeholder="Explain why this stock adjustment is needed"
            />
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={saving || loading || items.length === 0}
              className="rounded-lg bg-primary-700 px-5 py-2.5 font-semibold text-white hover:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save stock adjustment"}
            </button>
          </div>
        </form>
      </section>

      <section className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="border-b p-5">
          <h2 className="text-lg font-semibold text-primary-900">
            Inventory list
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Current stock quantities and status for every inventory record.
          </p>
        </div>

        {loading ? (
          <p className="p-6 text-sm text-gray-600">Loading inventory...</p>
        ) : items.length === 0 ? (
          <p className="p-6 text-sm text-gray-600">No inventory records found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-primary-50 text-primary-900">
                <tr>
                  <th className="px-4 py-3 font-semibold">ID</th>
                  <th className="px-4 py-3 font-semibold">Product</th>
                  <th className="px-4 py-3 font-semibold">Variant</th>
                  <th className="px-4 py-3 font-semibold">Quantity</th>
                  <th className="px-4 py-3 font-semibold">Threshold</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Location</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-primary-50/50">
                    <td className="whitespace-nowrap px-4 py-3">{item.id}</td>
                    <td className="min-w-40 px-4 py-3 font-medium">{item.product_name}</td>
                    <td className="px-4 py-3">{item.variant_id ?? "—"}</td>
                    <td className="px-4 py-3 font-semibold">{item.quantity}</td>
                    <td className="px-4 py-3">{item.low_stock_threshold}</td>
                    <td className="px-4 py-3">
                      <span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${statusClasses[item.status] ?? "bg-gray-100 text-gray-700"}`}>
                       {item.status.split("_").join(" ")}
                      </span>
                    </td>
                    <td className="px-4 py-3">{item.location ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <div className="border-b p-5">
          <h2 className="text-lg font-semibold text-primary-900">
            Low-stock report
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Records with quantities at or below their configured threshold.
          </p>
        </div>

        {loading ? (
          <p className="p-6 text-sm text-gray-600">Loading low-stock report...</p>
        ) : lowStockItems.length === 0 ? (
          <p className="p-6 text-sm text-gray-600">No low-stock records. All records are above their thresholds.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-amber-50 text-amber-900">
                <tr>
                  <th className="px-4 py-3 font-semibold">Product</th>
                  <th className="px-4 py-3 font-semibold">Variant</th>
                  <th className="px-4 py-3 font-semibold">Quantity</th>
                  <th className="px-4 py-3 font-semibold">Threshold</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {lowStockItems.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 font-medium">{item.product_name}</td>
                    <td className="px-4 py-3">{item.variant_id ?? "—"}</td>
                    <td className="px-4 py-3">{item.quantity}</td>
                    <td className="px-4 py-3">{item.low_stock_threshold}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClasses[item.status] ?? "bg-gray-100 text-gray-700"}`}>
                       {item.status.split("_").join(" ")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}