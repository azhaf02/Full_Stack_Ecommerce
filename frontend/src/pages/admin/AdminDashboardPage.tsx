import { useEffect, useState } from "react";
import { IndianRupee, ShoppingBag, Clock, PackageX } from "lucide-react";
import StatCard from "../../components/admin/StatCard";
import { getDashboardSummary } from "../../services/adminService";
import type { DashboardKpis } from "../../services/adminService";
import { formatINR } from "../../utils/format";

export default function AdminDashboardPage() {
  const [kpis, setKpis] = useState<DashboardKpis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch the four numbers from GET /api/admin/dashboard-summary
  const loadSummary = () => {
    setLoading(true);
    setError("");
    getDashboardSummary()
      .then(setKpis)
      .catch(() => setError("Could not load the dashboard numbers. Check that the backend is running."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadSummary();
  }, []);

  const isEmpty =
    kpis !== null &&
    kpis.totalRevenue === 0 &&
    kpis.ordersToday === 0 &&
    kpis.pendingOrders === 0 &&
    kpis.lowStockCount === 0;

  return (
    <div className="space-y-6">
      {/* KPI cards (real data from the backend) */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="bg-cream-50 rounded-xl border shadow-sm p-5 h-24 animate-pulse" />
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm">{error}</p>
          <button
            onClick={loadSummary}
            className="text-sm font-medium px-3 py-1 rounded-lg border border-rose-300 hover:bg-rose-100"
          >
            Try again
          </button>
        </div>
      )}

      {!loading && !error && kpis && (
        <>
          {isEmpty && (
            <p className="text-sm text-slate-500 bg-cream-50 border rounded-xl p-4">
              No orders or products yet. These numbers will update once the store has data.
            </p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Revenue"
              value={formatINR(kpis.totalRevenue)}
              icon={IndianRupee}
              iconBg="bg-primary-100 text-primary-700"
            />
            <StatCard
              title="Orders Today"
              value={String(kpis.ordersToday)}
              icon={ShoppingBag}
              iconBg="bg-cream-200 text-primary-700"
            />
            <StatCard
              title="Pending Orders"
              value={String(kpis.pendingOrders)}
              icon={Clock}
              iconBg="bg-amber-100 text-amber-700"
            />
            <StatCard
              title="Low Stock Items"
              value={String(kpis.lowStockCount)}
              icon={PackageX}
              iconBg="bg-rose-100 text-rose-700"
            />
          </div>
        </>
      )}
    </div>
  );
}
