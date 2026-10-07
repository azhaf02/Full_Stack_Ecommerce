import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { IndianRupee, ShoppingBag, Clock, PackageX, ClipboardList } from "lucide-react";
import StatCard from "../../components/admin/StatCard";
import ChartCard from "../../components/admin/ChartCard";
import RevenueChart from "../../components/admin/RevenueChart";
import OrderStatusChart from "../../components/admin/OrderStatusChart";
import WeeklyOrdersChart from "../../components/admin/WeeklyOrdersChart";
import ProgressList from "../../components/admin/ProgressList";
import DataTable from "../../components/admin/DataTable";
import type { Column } from "../../components/admin/DataTable";
import StatusBadge from "../../components/admin/StatusBadge";
import { getAnalyticsCharts, getDashboardSummary, getOrders } from "../../services/adminService";
import type { AdminOrder, AnalyticsCharts, DashboardKpis } from "../../services/adminService";
import { formatINR } from "../../utils/format";

// Colour of each order status in the donut chart
const STATUS_COLORS: Record<string, string> = {
  PLACED: "#d4a340",
  CONFIRMED: "#b1bb8a",
  PROCESSING: "#8f9c63",
  PACKED: "#6f7d48",
  SHIPPED: "#9aa86f",
  OUT_FOR_DELIVERY: "#47522e",
  DELIVERED: "#586638",
  CANCELLED: "#b5543c",
};
const OTHER_STATUS_COLOR = "#94a3b8";

const shortDate = (value: string) =>
  new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });

const statusLabel = (status: string) => {
  const text = status.replace(/_/g, " ").toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
};

const orderColumns: Column<AdminOrder>[] = [
  { key: "orderNumber", label: "Order" },
  { key: "customerName", label: "Customer" },
  { key: "totalAmount", label: "Total", render: (o) => formatINR(o.totalAmount) },
  { key: "status", label: "Status", render: (o) => <StatusBadge status={o.status} /> },
];

function NoData() {
  return (
    <div className="h-full flex items-center justify-center">
      <p className="text-sm text-slate-500">No data yet</p>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [kpis, setKpis] = useState<DashboardKpis | null>(null);
  const [charts, setCharts] = useState<AnalyticsCharts | null>(null);
  const [recentOrders, setRecentOrders] = useState<AdminOrder[]>([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // KPI cards: GET /api/admin/dashboard-summary
  // Charts:    GET /api/admin/analytics/charts (same data as the Analytics page)
  // Table:     GET /api/admin/orders (latest 5)
  const loadDashboard = () => {
    setLoading(true);
    setError("");
    Promise.all([getDashboardSummary(), getAnalyticsCharts(), getOrders({ page: 1, pageSize: 5 })])
      .then(([kpiData, chartData, orderData]) => {
        setKpis(kpiData);
        setCharts(chartData);
        setRecentOrders(orderData.items);
        setTotalOrders(orderData.total);
      })
      .catch(() => setError("Could not load the dashboard. Check that the backend is running."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {[1, 2, 3, 4, 5].map((n) => (
          <div key={n} className="bg-cream-50 rounded-xl border shadow-sm p-5 h-24 animate-pulse" />
        ))}
      </div>
    );
  }

  if (error || !kpis || !charts) {
    return (
      <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm">{error || "Could not load the dashboard."}</p>
        <button
          onClick={loadDashboard}
          className="text-sm font-medium px-3 py-1 rounded-lg border border-rose-300 hover:bg-rose-100"
        >
          Try again
        </button>
      </div>
    );
  }

  const isEmpty =
    kpis.totalRevenue === 0 &&
    kpis.ordersToday === 0 &&
    kpis.pendingOrders === 0 &&
    kpis.lowStockCount === 0;

  const salesTrend = charts.sales_over_time.map((d) => ({ date: shortDate(d.date), revenue: d.sales }));
  const ordersPerDay = charts.orders_over_time.map((d) => ({ day: shortDate(d.date), orders: d.orders }));
  const ordersByStatus = charts.order_status_distribution.map((d) => ({
    status: statusLabel(d.status),
    count: d.orders,
    color: STATUS_COLORS[d.status] ?? OTHER_STATUS_COLOR,
  }));

  // Each product's share of all units sold, for the progress bars
  const unitsSold = charts.top_products.reduce((sum, p) => sum + p.quantity, 0);
  const topProducts = charts.top_products.slice(0, 5).map((p) => ({
    label: p.product_name,
    value: unitsSold > 0 ? Math.round((p.quantity / unitsSold) * 100) : 0,
  }));

  return (
    <div className="space-y-6">
      {isEmpty && (
        <p className="text-sm text-slate-500 bg-cream-50 border rounded-xl p-4">
          No orders or products yet. These numbers will update once the store has data.
        </p>
      )}

      {/* Row 1: KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard
          title="Total Revenue"
          value={formatINR(kpis.totalRevenue)}
          icon={IndianRupee}
          iconBg="bg-primary-100 text-primary-700"
        />
        <StatCard
          title="Total Orders"
          value={String(totalOrders)}
          icon={ClipboardList}
          iconBg="bg-sky-100 text-sky-700"
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

      {/* Row 2: sales trend and order status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ChartCard title="Sales Overview" subtitle="Sales per day" className="lg:col-span-2">
          {salesTrend.length === 0 ? <NoData /> : <RevenueChart data={salesTrend} />}
        </ChartCard>
        <ChartCard title="Orders by Status">
          {ordersByStatus.length === 0 ? <NoData /> : <OrderStatusChart data={ordersByStatus} />}
        </ChartCard>
      </div>

      {/* Row 3: orders per day, top products, recent orders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ChartCard title="Orders per Day">
          {ordersPerDay.length === 0 ? <NoData /> : <WeeklyOrdersChart data={ordersPerDay} />}
        </ChartCard>
        <ChartCard title="Top Products" subtitle="Share of units sold">
          {topProducts.length === 0 ? <NoData /> : <ProgressList items={topProducts} />}
        </ChartCard>
        <ChartCard title="Recent Orders">
          {recentOrders.length === 0 ? (
            <NoData />
          ) : (
            <DataTable columns={orderColumns} rows={recentOrders} rowKey={(o) => o.id} />
          )}
        </ChartCard>
      </div>

      <div className="text-right">
        <Link to="/admin/analytics" className="text-sm font-medium text-primary-700 hover:underline">
          View full analytics →
        </Link>
      </div>
    </div>
  );
}
