import React, { useEffect, useState } from "react";

import {
  fetchAnalyticsSummary,
  fetchAnalyticsCharts,
} from "../../api";

import { getSession, logout } from "../../services/authService";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";


// ============================================================
// TYPES
// ============================================================

interface AnalyticsData {
  total_orders: number;
  total_sales: number;
  total_customers: number;
  total_products: number;
  pending_orders: number;
  completed_orders: number;
  cancelled_orders: number;
  pending_payments: number;
  low_stock_count: number;
}

interface SalesData {
  date: string;
  sales: number;
}

interface OrdersData {
  date: string;
  orders: number;
}

interface ProductData {
  product_id: number;
  product_name: string;
  quantity: number;
}

interface CategoryData {
  category_id: number;
  category_name: string;
  quantity: number;
}

interface RevenueCategoryData {
  category_id: number;
  category_name: string;
  revenue: number;
}

interface OrderStatusData {
  status: string;
  orders: number;
}

interface KPICardProps {
  title: string;
  value: string | number;
}


// ============================================================
// KPI CARD
// ============================================================

const KPICard: React.FC<KPICardProps> = ({ title, value }) => {
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e8e8e8",
        borderRadius: "16px",
        padding: "22px",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)",
      }}
    >
      <p
        style={{
          margin: 0,
          color: "#777",
          fontSize: "13px",
          fontWeight: 500,
        }}
      >
        {title}
      </p>

      <h2
        style={{
          margin: "10px 0 0",
          fontSize: "28px",
          fontWeight: 700,
          color: "#171717",
        }}
      >
        {value}
      </h2>
    </div>
  );
};


// ============================================================
// CHART CARD
// ============================================================

interface ChartCardProps {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}

const ChartCard: React.FC<ChartCardProps> = ({
  eyebrow,
  title,
  description,
  children,
}) => {
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e8e8e8",
        borderRadius: "16px",
        padding: "20px",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04)",
      }}
    >
      <p
        style={{
          margin: "0 0 5px",
          fontSize: "11px",
          fontWeight: 600,
          letterSpacing: "1.2px",
          textTransform: "uppercase",
          color: "#999",
        }}
      >
        {eyebrow}
      </p>

      <h2
        style={{
          margin: 0,
          fontSize: "18px",
          fontWeight: 700,
          color: "#171717",
        }}
      >
        {title}
      </h2>

      <p
        style={{
          margin: "6px 0 20px",
          color: "#888",
          fontSize: "13px",
        }}
      >
        {description}
      </p>

      {children}
    </div>
  );
};


// ============================================================
// EMPTY CHART STATE
// ============================================================

const EmptyChart: React.FC = () => {
  return (
    <div
      style={{
        height: "300px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#999",
        fontSize: "14px",
      }}
    >
      No data available.
    </div>
  );
};


// ============================================================
// ANALYTICS PAGE
// ============================================================

const AnalyticsPage: React.FC = () => {
  const [analytics, setAnalytics] =
    useState<AnalyticsData | null>(null);

  const [salesData, setSalesData] =
    useState<SalesData[]>([]);

  const [ordersData, setOrdersData] =
    useState<OrdersData[]>([]);

  const [topProducts, setTopProducts] =
    useState<ProductData[]>([]);

  const [topCategories, setTopCategories] =
    useState<CategoryData[]>([]);

  const [revenueByCategory, setRevenueByCategory] =
    useState<RevenueCategoryData[]>([]);

  const [orderStatusDistribution, setOrderStatusDistribution] =
    useState<OrderStatusData[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");


// ============================================================
// LOAD ANALYTICS DATA
// ============================================================

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const session = getSession();

        if (!session?.token) {
          setError("Admin authentication token not found.");
          return;
        }

        const token = session.token;

        // ----------------------------------------------------
        // KPI DATA
        // ----------------------------------------------------

        const summaryResponse =
          await fetchAnalyticsSummary(token);

        setAnalytics(summaryResponse.data);


        // ----------------------------------------------------
        // CHART DATA
        // ----------------------------------------------------

        const chartsResponse =
          await fetchAnalyticsCharts(token);

        const chartData = chartsResponse.data;

        setSalesData(
          chartData.sales_over_time || []
        );

        setOrdersData(
          chartData.orders_over_time || []
        );

        setTopProducts(
          chartData.top_products || []
        );

        setTopCategories(
          chartData.top_categories || []
        );

        setRevenueByCategory(
          chartData.revenue_by_category || []
        );

        setOrderStatusDistribution(
          chartData.order_status_distribution || []
        );

      } catch (err) {
        // 401 = the login token is missing or expired: go back to the login page,
        // the same way the other admin pages do
        const status = (err as { response?: { status?: number } })?.response?.status;

        if (status === 401) {
          logout();
          window.location.assign("/admin/login");
          return;
        }

        console.error(
          "Failed to load analytics:",
          err
        );

        setError(
          "Failed to load analytics data."
        );
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, []);


// ============================================================
// LOADING
// ============================================================

  if (loading) {
    return (
      <div
        style={{
          padding: "40px",
          textAlign: "center",
          color: "#777",
        }}
      >
        Loading analytics...
      </div>
    );
  }


// ============================================================
// ERROR
// ============================================================

  if (error) {
    return (
      <div
        style={{
          padding: "40px",
          textAlign: "center",
          color: "#c0392b",
        }}
      >
        {error}
      </div>
    );
  }


// ============================================================
// NO DATA
// ============================================================

  if (!analytics) {
    return (
      <div
        style={{
          padding: "40px",
          textAlign: "center",
          color: "#777",
        }}
      >
        No analytics data available.
      </div>
    );
  }


// ============================================================
// PAGE
// ============================================================

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f7f7f5",
        padding: "32px",
      }}
    >

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div style={{ marginBottom: "30px" }}>

        <p
          style={{
            margin: "0 0 6px",
            fontSize: "13px",
            fontWeight: 600,
            letterSpacing: "1.5px",
            textTransform: "uppercase",
            color: "#999",
          }}
        >
          Admin Dashboard
        </p>

        <h1
          style={{
            margin: 0,
            fontSize: "36px",
            fontWeight: 700,
            color: "#171717",
          }}
        >
          Analytics
        </h1>

        <p
          style={{
            marginTop: "8px",
            color: "#777",
            fontSize: "15px",
          }}
        >
          Monitor your store performance and sales activity.
        </p>

      </div>


      {/* ======================================================
          KPI CARDS
      ====================================================== */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "14px",
          marginBottom: "30px",
        }}
      >

        <KPICard
          title="Total Orders"
          value={analytics.total_orders}
        />

        <KPICard
          title="Total Revenue"
          value={`₹${analytics.total_sales.toFixed(2)}`}
        />

        <KPICard
          title="Total Customers"
          value={analytics.total_customers}
        />

        <KPICard
          title="Total Products"
          value={analytics.total_products}
        />

        <KPICard
          title="Pending Orders"
          value={analytics.pending_orders}
        />

        <KPICard
          title="Completed Orders"
          value={analytics.completed_orders}
        />

        <KPICard
          title="Cancelled Orders"
          value={analytics.cancelled_orders}
        />

        <KPICard
          title="Pending Payments"
          value={analytics.pending_payments}
        />

        <KPICard
          title="Low Stock Products"
          value={analytics.low_stock_count}
        />

      </div>


      {/* ======================================================
          LINE CHARTS
      ====================================================== */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(420px, 1fr))",
          gap: "20px",
          marginBottom: "20px",
        }}
      >

        {/* SALES OVER TIME */}

        <ChartCard
          eyebrow="Performance"
          title="Sales Over Time"
          description="Track daily sales performance."
        >
          {salesData.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#eeeeee"
                />

                <XAxis
                  dataKey="date"
                  tick={{
                    fill: "#777",
                    fontSize: 12,
                  }}
                />

                <YAxis
                  tick={{
                    fill: "#777",
                    fontSize: 12,
                  }}
                />

                <Tooltip
                  formatter={(value) => [
                    `₹${Number(value).toFixed(2)}`,
                    "Sales",
                  ]}
                />

                <Line
                  type="monotone"
                  dataKey="sales"
                  stroke="#171717"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>


        {/* ORDERS OVER TIME */}

        <ChartCard
          eyebrow="Performance"
          title="Orders Over Time"
          description="Track daily order activity."
        >
          {ordersData.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={ordersData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#eeeeee"
                />

                <XAxis
                  dataKey="date"
                  tick={{
                    fill: "#777",
                    fontSize: 12,
                  }}
                />

                <YAxis
                  allowDecimals={false}
                  tick={{
                    fill: "#777",
                    fontSize: 12,
                  }}
                />

                <Tooltip
                  formatter={(value) => [
                    Number(value),
                    "Orders",
                  ]}
                />

                <Line
                  type="monotone"
                  dataKey="orders"
                  stroke="#171717"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

      </div>


      {/* ======================================================
          BAR CHARTS
      ====================================================== */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(420px, 1fr))",
          gap: "20px",
          marginBottom: "20px",
        }}
      >

        {/* TOP PRODUCTS */}

        <ChartCard
          eyebrow="Products"
          title="Top Products"
          description="Products ranked by quantity sold."
        >
          {topProducts.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart
                data={topProducts}
                layout="vertical"
                margin={{
                  left: 20,
                  right: 20,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#eeeeee"
                />

                <XAxis
                  type="number"
                  allowDecimals={false}
                />

                <YAxis
                  type="category"
                  dataKey="product_name"
                  width={150}
                  tick={{
                    fontSize: 11,
                  }}
                />

                <Tooltip />

                <Bar
                  dataKey="quantity"
                  name="Quantity Sold"
                  fill="#171717"
                  radius={[0, 5, 5, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>


        {/* TOP CATEGORIES */}

        <ChartCard
          eyebrow="Categories"
          title="Top Categories"
          description="Categories ranked by quantity sold."
        >
          {topCategories.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart
                data={topCategories}
                margin={{
                  left: 10,
                  right: 10,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#eeeeee"
                />

                <XAxis
                  dataKey="category_name"
                  tick={{
                    fontSize: 11,
                  }}
                />

                <YAxis
                  allowDecimals={false}
                />

                <Tooltip />

                <Bar
                  dataKey="quantity"
                  name="Quantity Sold"
                  fill="#171717"
                  radius={[5, 5, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

      </div>


      {/* ======================================================
          REVENUE + ORDER STATUS
      ====================================================== */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(420px, 1fr))",
          gap: "20px",
          paddingBottom: "30px",
        }}
      >

        {/* REVENUE BY CATEGORY */}

        <ChartCard
          eyebrow="Revenue"
          title="Revenue by Category"
          description="Revenue generated by each product category."
        >
          {revenueByCategory.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart
                data={revenueByCategory}
                margin={{
                  left: 10,
                  right: 20,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#eeeeee"
                />

                <XAxis
                  dataKey="category_name"
                  tick={{
                    fontSize: 11,
                  }}
                />

                <YAxis
                  tick={{
                    fontSize: 11,
                  }}
                />

                <Tooltip
                  formatter={(value) => [
                    `₹${Number(value).toFixed(2)}`,
                    "Revenue",
                  ]}
                />

                <Bar
                  dataKey="revenue"
                  name="Revenue"
                  fill="#171717"
                  radius={[5, 5, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>


        {/* ORDER STATUS DISTRIBUTION */}

        <ChartCard
          eyebrow="Orders"
          title="Order Status Distribution"
          description="Distribution of orders by current status."
        >
          {orderStatusDistribution.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={orderStatusDistribution}
                  dataKey="orders"
                  nameKey="status"
                  cx="50%"
                  cy="45%"
                  outerRadius={100}
                  label
                >
                  {orderStatusDistribution.map(
                    (_, index) => (
                      <Cell
                        key={`status-${index}`}
                        fill={
                          [
                            "#171717",
                            "#555555",
                            "#777777",
                            "#999999",
                            "#bbbbbb",
                            "#dddddd",
                          ][index % 6]
                        }
                      />
                    )
                  )}
                </Pie>

                <Tooltip />

                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

      </div>

    </div>
  );
};

export default AnalyticsPage;