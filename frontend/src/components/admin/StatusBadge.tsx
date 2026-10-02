const styles: Record<string, string> = {
  PLACED: "bg-slate-100 text-slate-700",
  CONFIRMED: "bg-sky-100 text-sky-700",
  PROCESSING: "bg-amber-100 text-amber-700",
  PACKED: "bg-amber-100 text-amber-700",
  SHIPPED: "bg-primary-100 text-primary-700",
  OUT_FOR_DELIVERY: "bg-indigo-100 text-indigo-700",
  DELIVERED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
  RETURN_REQUESTED: "bg-orange-100 text-orange-700",
  REFUND_PENDING: "bg-orange-100 text-orange-700",
  REFUNDED: "bg-teal-100 text-teal-700",
  ADMIN: "bg-primary-100 text-primary-800",
  CUSTOMER: "bg-slate-100 text-slate-700",
  ACTIVE: "bg-green-100 text-green-700",
  INACTIVE: "bg-slate-200 text-slate-600",
  SUCCESS: "bg-green-100 text-green-700",
  PENDING: "bg-amber-100 text-amber-700",
  FAILED: "bg-red-100 text-red-700",

};

export default function StatusBadge({ status }: { status: string }) {
  const style = styles[status] ?? "bg-slate-100 text-slate-700";
  const text = status.replaceAll("_", " ").toLowerCase();

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${style}`}>
      {text}
    </span>
  );
}
