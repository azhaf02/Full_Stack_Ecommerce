import { useEffect, useState } from "react";
import axios from "axios";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, User, MapPin, CreditCard } from "lucide-react";
import StatusBadge from "../../components/admin/StatusBadge";
import { getOrder, updateOrderStatus } from "../../services/adminService";
import type { AdminOrderDetail } from "../../services/adminService";
import { formatINR } from "../../utils/format";

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

const statusLabel = (status: string) => status.replace(/_/g, " ");

export default function AdminOrderDetailPage() {
  const { id } = useParams();
  const orderId = Number(id);

  const [order, setOrder] = useState<AdminOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0); // changing this loads the order again

  const [nextStatus, setNextStatus] = useState("");
  const [remarks, setRemarks] = useState("");
  const [saving, setSaving] = useState(false);
  const [updateError, setUpdateError] = useState("");

  // Load the order from GET /api/admin/orders/{id}
  useEffect(() => {
    if (!Number.isInteger(orderId) || orderId <= 0) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    setError("");

    getOrder(orderId)
      .then((data) => {
        if (!cancelled) setOrder(data);
      })
      .catch((err) => {
        if (cancelled) return;
        if (axios.isAxiosError(err) && err.response?.status === 404) setNotFound(true);
        else setError("Could not load this order. Check that the backend is running.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [orderId, reloadKey]);

  // Calls PUT /api/admin/orders/{id}/status. The reply carries the new status,
  // the updated history and the statuses allowed next.
  const handleUpdate = async () => {
    if (!order || !nextStatus) return;
    setSaving(true);
    setUpdateError("");
    try {
      const updated = await updateOrderStatus(order.id, nextStatus, remarks);
      // Keep the customer, address and product names from the first load
      setOrder({ ...order, ...updated });
      setNextStatus("");
      setRemarks("");
    } catch (err) {
      const detail = axios.isAxiosError(err) ? err.response?.data?.detail : null;
      setUpdateError(typeof detail === "string" ? detail : "Could not update the status. Try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-slate-500 py-8 text-center">Loading order...</p>;
  }

  if (notFound) {
    return (
      <div className="space-y-4">
        <Link to="/admin/orders" className="text-sm text-primary-600 hover:underline">← Back to orders</Link>
        <p className="text-slate-600">Order not found.</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="space-y-4">
        <Link to="/admin/orders" className="text-sm text-primary-600 hover:underline">← Back to orders</Link>
        <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm">{error || "Could not load this order."}</p>
          <button
            onClick={() => setReloadKey(reloadKey + 1)}
            className="text-sm font-medium px-3 py-1 rounded-lg border border-rose-300 hover:bg-rose-100"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  const options = order.actions?.allowed_next_statuses ?? [];
  const productName = (productId: number) => order.product_names?.[String(productId)] ?? `Product #${productId}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link to="/admin/orders" className="text-sm text-primary-600 hover:underline flex items-center gap-1">
            <ArrowLeft size={14} /> Back to orders
          </Link>
          <h2 className="text-2xl font-bold text-slate-800 mt-2">{order.order_number}</h2>
          <p className="text-sm text-slate-500">Placed on {formatDateTime(order.created_at)}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Items */}
        <div className="lg:col-span-2 bg-cream-50 rounded-xl border shadow-sm p-6">
          <h3 className="font-semibold text-slate-800 mb-4">Items</h3>
          {order.items.length === 0 ? (
            <p className="text-sm text-slate-500">This order has no items.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b">
                  <th className="py-2">Product</th>
                  <th className="py-2">Qty</th>
                  <th className="py-2 text-right">Price</th>
                  <th className="py-2 text-right">Line total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id} className="border-b last:border-0">
                    <td className="py-3">
                      <p className="font-medium text-slate-800">{productName(item.product_id)}</p>
                      {item.variant_id !== null && (
                        <p className="text-xs text-slate-500">Variant #{item.variant_id}</p>
                      )}
                    </td>
                    <td className="py-3">{item.quantity}</td>
                    <td className="py-3 text-right">{formatINR(Number(item.unit_price))}</td>
                    <td className="py-3 text-right">{formatINR(Number(item.unit_price) * item.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <dl className="mt-4 ml-auto w-full max-w-xs text-sm space-y-1">
            <div className="flex justify-between">
              <dt className="text-slate-500">Subtotal</dt>
              <dd>{formatINR(Number(order.subtotal))}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Shipping</dt>
              <dd>{formatINR(Number(order.shipping_cost))}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Tax</dt>
              <dd>{formatINR(Number(order.tax_amount))}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Discount</dt>
              <dd>-{formatINR(Number(order.discount_amount))}</dd>
            </div>
            <div className="flex justify-between text-base font-semibold border-t pt-2">
              <dt>Order total</dt>
              <dd>{formatINR(Number(order.total_amount))}</dd>
            </div>
          </dl>
        </div>

        {/* Right column: customer, address, payment */}
        <div className="space-y-6">
          <InfoCard icon={User} title="Customer">
            <p className="font-medium">{order.customer_name ?? "Unknown customer"}</p>
            {order.customer_email && <p className="text-slate-500">{order.customer_email}</p>}
          </InfoCard>

          <InfoCard icon={MapPin} title="Shipping address">
            <p className="text-slate-600">{order.shipping_address ?? "No address on record"}</p>
          </InfoCard>

          <InfoCard icon={CreditCard} title="Payment">
            <p>Method: <span className="font-medium">{order.payment_method}</span></p>
            <p className="flex items-center gap-2 mt-1">
              Status: <StatusBadge status={order.payment_status} />
            </p>
          </InfoCard>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status update */}
        <div className="bg-cream-50 rounded-xl border shadow-sm p-6">
          <h3 className="font-semibold text-slate-800 mb-4">Update status</h3>
          {options.length === 0 ? (
            <p className="text-sm text-slate-500">
              This order is {statusLabel(order.status).toLowerCase()}. No further changes allowed here.
            </p>
          ) : (
            <div className="space-y-3">
              <select
                value={nextStatus}
                onChange={(e) => setNextStatus(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm"
                aria-label="New status"
              >
                <option value="">Select new status</option>
                {options.map((s) => (
                  <option key={s} value={s}>{statusLabel(s)}</option>
                ))}
              </select>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Remarks (optional)"
                maxLength={500}
                rows={3}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />

              {updateError && (
                <p role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {updateError}
                </p>
              )}

              <button
                onClick={handleUpdate}
                disabled={!nextStatus || saving}
                className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-40 text-white rounded-lg py-2 text-sm"
              >
                {saving ? "Updating..." : "Update status"}
              </button>
            </div>
          )}
        </div>

        {/* Timeline */}
        <div className="lg:col-span-2 bg-cream-50 rounded-xl border shadow-sm p-6">
          <h3 className="font-semibold text-slate-800 mb-4">Status history</h3>
          {order.status_history.length === 0 ? (
            <p className="text-sm text-slate-500">No status changes recorded.</p>
          ) : (
            <ol className="relative border-l border-slate-200 ml-2 space-y-6">
              {order.status_history.map((h, i) => (
                <li key={i} className="ml-6">
                  <span className="absolute -left-1.5 w-3 h-3 rounded-full bg-primary-600 mt-1.5" />
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={h.new_status} />
                    <span className="text-xs text-slate-500">
                      {formatDateTime(h.changed_at)} · by {h.changed_by ? `user #${h.changed_by}` : "system"}
                    </span>
                  </div>
                  {h.remarks && <p className="text-sm text-slate-600 mt-1">{h.remarks}</p>}
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}

/* Small card used only on this page */
function InfoCard({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-cream-50 rounded-xl border shadow-sm p-6 text-sm">
      <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
        <Icon size={16} className="text-primary-600" /> {title}
      </h3>
      {children}
    </div>
  );
}
