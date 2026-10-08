import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, User, MapPin, CreditCard } from "lucide-react";
import StatusBadge from "../../components/admin/StatusBadge";
import { orders, orderDetailExtras, allowedTransitions } from "../../mocks/adminMock";
import { formatINR } from "../../utils/format";

interface HistoryEntry {
  status: string;
  by: string;
  at: string;
  remarks: string;
}

export default function AdminOrderDetailPage() {
  const { id } = useParams();
  const order = orders.find((o) => o.id === Number(id));

  // Local state (later this comes from / is saved to the backend)
  const [status, setStatus] = useState(order?.status ?? "");
  const [paymentStatus, setPaymentStatus] = useState(
    order?.paymentMethod === "COD" ? "PENDING" : "SUCCESS"
  );
  const [history, setHistory] = useState<HistoryEntry[]>(() => {
    if (!order) return [];
    const start = [{ status: "PLACED", by: "Customer", at: order.date, remarks: "Order placed" }];
    return order.status === "PLACED"
      ? start
      : [...start, { status: order.status, by: "Admin", at: order.date, remarks: "" }];
  });
  const [nextStatus, setNextStatus] = useState("");
  const [remarks, setRemarks] = useState("");

  if (!order) {
    return (
      <div className="space-y-4">
        <Link to="/admin/orders" className="text-sm text-primary-600 hover:underline">← Back to orders</Link>
        <p className="text-slate-600">Order not found.</p>
      </div>
    );
  }

  const options = allowedTransitions[status] ?? [];
  const { items, email, phone, address } = orderDetailExtras;

  const handleUpdate = () => {
    if (!nextStatus) return;
    setHistory([
      ...history,
      { status: nextStatus, by: "You (Admin)", at: new Date().toISOString().slice(0, 10), remarks },
    ]);
    setStatus(nextStatus);
    setNextStatus("");
    setRemarks("");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link to="/admin/orders" className="text-sm text-primary-600 hover:underline flex items-center gap-1">
            <ArrowLeft size={14} /> Back to orders
          </Link>
          <h2 className="text-2xl font-bold text-slate-800 mt-2">{order.orderNumber}</h2>
          <p className="text-sm text-slate-500">Placed on {order.date}</p>
        </div>
        <StatusBadge status={status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Items */}
        <div className="lg:col-span-2 bg-cream-50 rounded-xl border shadow-sm p-6">
          <h3 className="font-semibold text-slate-800 mb-4">Items</h3>
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
              {items.map((item) => (
                <tr key={item.id} className="border-b last:border-0">
                  <td className="py-3">
                    <p className="font-medium text-slate-800">{item.name}</p>
                    <p className="text-xs text-slate-500">{item.variant}</p>
                  </td>
                  <td className="py-3">{item.qty}</td>
                  <td className="py-3 text-right">{formatINR(item.price)}</td>
                  <td className="py-3 text-right">{formatINR(item.price * item.qty)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex justify-end mt-4 text-base font-semibold">
            Order total: {formatINR(order.total)}
          </div>
        </div>

        {/* Right column: customer, address, payment */}
        <div className="space-y-6">
          <InfoCard icon={User} title="Customer">
            <p className="font-medium">{order.customer}</p>
            <p className="text-slate-500">{email}</p>
            <p className="text-slate-500">{phone}</p>
          </InfoCard>

          <InfoCard icon={MapPin} title="Shipping address">
            <p className="text-slate-600">{address}</p>
          </InfoCard>

          <InfoCard icon={CreditCard} title="Payment">
            <p>Method: <span className="font-medium">{order.paymentMethod}</span></p>
            <p className="flex items-center gap-2 mt-1">
              Status: <StatusBadge status={paymentStatus} />
            </p>
            {order.paymentMethod === "COD" && paymentStatus === "PENDING" && (
              <button
                onClick={() => setPaymentStatus("SUCCESS")}
                className="mt-3 w-full bg-primary-600 hover:bg-primary-700 text-white rounded-lg py-2 text-sm"
              >
                Mark as Paid
              </button>
            )}
          </InfoCard>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status update */}
        <div className="bg-cream-50 rounded-xl border shadow-sm p-6">
          <h3 className="font-semibold text-slate-800 mb-4">Update status</h3>
          {options.length === 0 ? (
            <p className="text-sm text-slate-500">This order is {status.toLowerCase()}. No further changes allowed.</p>
          ) : (
            <div className="space-y-3">
              <select
                value={nextStatus}
                onChange={(e) => setNextStatus(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Select new status</option>
                {options.map((s) => (
                  <option key={s} value={s}>{s.replaceAll("_", " ")}</option>
                ))}
              </select>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Remarks (optional)"
                rows={3}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
              <button
                onClick={handleUpdate}
                disabled={!nextStatus}
                className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-40 text-white rounded-lg py-2 text-sm"
              >
                Update status
              </button>
            </div>
          )}
        </div>

        {/* Timeline */}
        <div className="lg:col-span-2 bg-cream-50 rounded-xl border shadow-sm p-6">
          <h3 className="font-semibold text-slate-800 mb-4">Status history</h3>
          <ol className="relative border-l border-slate-200 ml-2 space-y-6">
            {history.map((h, i) => (
              <li key={i} className="ml-6">
                <span className="absolute -left-1.5 w-3 h-3 rounded-full bg-primary-600 mt-1.5" />
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={h.status} />
                  <span className="text-xs text-slate-500">{h.at} · by {h.by}</span>
                </div>
                {h.remarks && <p className="text-sm text-slate-600 mt-1">{h.remarks}</p>}
              </li>
            ))}
          </ol>
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
