
import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Boxes, PackageX, RefreshCw } from "lucide-react";
import StatCard from "../../components/admin/StatCard";
import LoadingRows from "../../components/admin/LoadingRows";
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
    IN_STOCK: "bg-green-100 text-green-700",
    LOW_STOCK: "bg-amber-100 text-amber-700",
    OUT_OF_STOCK: "bg-red-100 text-red-700",
  };

  const field =
    "w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500";
  const th = "px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500";

  return (
    <div className="space-y-6">
      {/* Page intro; the page title is already in the top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          Monitor stock, adjust quantities, and review low-stock items.
        </p>
        <button
          type="button"
          onClick={() => void loadInventory()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border bg-cream-50 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-cream-100 disabled:opacity-50"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div role="status" className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard
          title="Inventory records"
          value={String(items.length)}
          icon={Boxes}
          iconBg="bg-primary-100 text-primary-700"
        />
        <StatCard
          title="Low stock"
          value={String(lowStockItems.filter((item) => item.status === "LOW_STOCK").length)}
          icon={AlertTriangle}
          iconBg="bg-amber-100 text-amber-700"
        />
        <StatCard
          title="Out of stock"
          value={String(lowStockItems.filter((item) => item.status === "OUT_OF_STOCK").length)}
          icon={PackageX}
          iconBg="bg-red-100 text-red-700"
        />
      </section>

      <section className="admin-card p-6">
        <h2 className="font-display text-lg font-semibold text-slate-800">Manual stock adjustment</h2>
        <p className="mt-1 text-sm text-slate-500">
          Use a positive number to add stock or a negative number to remove stock. A reason is required.
        </p>

        <form onSubmit={handleAdjustment} className="mt-5 grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="inventory-record" className="mb-1 block text-sm font-medium text-slate-700">
              Inventory record
            </label>
            <select
              id="inventory-record"
              value={selectedId}
              onChange={(event) => setSelectedId(event.target.value)}
              required
              className={field}
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
              <p className="mt-1.5 text-xs text-slate-500">
                Current stock: <span className="font-semibold text-slate-700">{selectedItem.quantity}</span> · Threshold:{" "}
                {selectedItem.low_stock_threshold}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="quantity-change" className="mb-1 block text-sm font-medium text-slate-700">
              Quantity change
            </label>
            <input
              id="quantity-change"
              type="number"
              step="1"
              required
              value={quantityChange}
              onChange={(event) => setQuantityChange(event.target.value)}
              className={field}
              placeholder="e.g. 5 or -2"
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="adjustment-reason" className="mb-1 block text-sm font-medium text-slate-700">
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
              className={field}
              placeholder="Explain why this stock adjustment is needed"
            />
          </div>

          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={saving || loading || items.length === 0}
              className="rounded-lg bg-primary-600 px-5 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save stock adjustment"}
            </button>
          </div>
        </form>
      </section>

      <section className="admin-card p-6">
        <h2 className="font-display text-lg font-semibold text-slate-800">Inventory list</h2>
        <p className="mt-1 mb-4 text-sm text-slate-500">
          Current stock quantities and status for every inventory record.
        </p>

        {loading ? (
          <LoadingRows />
        ) : items.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">No inventory records found.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-cream-100/70">
                <tr>
                  <th className={th}>ID</th>
                  <th className={th}>Product</th>
                  <th className={th}>Variant</th>
                  <th className={th}>Quantity</th>
                  <th className={th}>Threshold</th>
                  <th className={th}>Status</th>
                  <th className={th}>Location</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b last:border-0 text-slate-700 transition-colors hover:bg-cream-100/60">
                    <td className="whitespace-nowrap px-4 py-3.5 text-slate-500">#{item.id}</td>
                    <td className="min-w-40 px-4 py-3.5 font-medium text-slate-800">{item.product_name}</td>
                    <td className="px-4 py-3.5">{item.variant_id ?? "—"}</td>
                    <td className="px-4 py-3.5 font-semibold">{item.quantity}</td>
                    <td className="px-4 py-3.5">{item.low_stock_threshold}</td>
                    <td className="px-4 py-3.5">
                      <span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium capitalize ${statusClasses[item.status] ?? "bg-slate-100 text-slate-700"}`}>
                        {item.status.split("_").join(" ").toLowerCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">{item.location ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="admin-card p-6">
        <h2 className="font-display text-lg font-semibold text-slate-800">Low-stock report</h2>
        <p className="mt-1 mb-4 text-sm text-slate-500">
          Records with quantities at or below their configured threshold.
        </p>

        {loading ? (
          <LoadingRows />
        ) : lowStockItems.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">
            No low-stock records. All records are above their thresholds.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-amber-200">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-amber-200 bg-amber-50">
                <tr>
                  <th className={th}>Product</th>
                  <th className={th}>Variant</th>
                  <th className={th}>Quantity</th>
                  <th className={th}>Threshold</th>
                  <th className={th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {lowStockItems.map((item) => (
                  <tr key={item.id} className="border-b border-amber-100 last:border-0 text-slate-700">
                    <td className="px-4 py-3.5 font-medium text-slate-800">{item.product_name}</td>
                    <td className="px-4 py-3.5">{item.variant_id ?? "—"}</td>
                    <td className="px-4 py-3.5 font-semibold">{item.quantity}</td>
                    <td className="px-4 py-3.5">{item.low_stock_threshold}</td>
                    <td className="px-4 py-3.5">
                      <span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium capitalize ${statusClasses[item.status] ?? "bg-slate-100 text-slate-700"}`}>
                        {item.status.split("_").join(" ").toLowerCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
