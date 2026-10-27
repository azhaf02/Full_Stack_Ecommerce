import React, { useEffect, useState } from "react";

interface Order {
  id: number;
  order_number: string;
  date: string;
  status: string;
  total_amount: number;
  items_count: number;
}

interface WishlistItem {
  id: number;
  title: string;
  price: number;
}

interface DashboardData {
  user: {
    id: number;
    email: string;
    role: string;
  };
  summary: {
    recent_orders_count: number;
    wishlist_count: number;
    unread_notifications: number;
  };
  recent_orders: Order[];
  wishlist: {
    count: number;
    items: WishlistItem[];
  };
}

export const DashboardPage: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("http://localhost:8000/api/account/dashboard")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load dashboard overview");
        return res.json();
      })
      .then((json: DashboardData) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div style={{ padding: "2rem", textAlign: "center" }}>Loading customer dashboard...</div>;
  }

  if (error) {
    return <div style={{ padding: "2rem", color: "red" }}>Error: {error}</div>;
  }

  const { summary, recent_orders, wishlist } = data || {
    summary: { recent_orders_count: 0, wishlist_count: 0, unread_notifications: 0 },
    recent_orders: [],
    wishlist: { count: 0, items: [] }
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "1100px", margin: "0 auto", fontFamily: "sans-serif" }}>
      <header style={{ marginBottom: "2rem" }}>
        <h1 style={{ margin: 0, fontSize: "1.8rem" }}>Customer Dashboard Overview</h1>
        <p style={{ color: "#666", marginTop: "0.25rem" }}>
          Welcome back! Here is an aggregated summary of your account activity.
        </p>
      </header>

      {/* Summary Cards Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "1.25rem",
          marginBottom: "2.5rem"
        }}
      >
        <div style={{ background: "#f8f9fa", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "1.25rem" }}>
          <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "0.95rem", color: "#475569" }}>Recent Orders</h3>
          <p style={{ margin: 0, fontSize: "1.8rem", fontWeight: "bold", color: "#1e293b" }}>
            {summary.recent_orders_count}
          </p>
          <span style={{ fontSize: "0.8rem", color: "#64748b" }}>Track active orders</span>
        </div>

        <div style={{ background: "#f8f9fa", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "1.25rem" }}>
          <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "0.95rem", color: "#475569" }}>Wishlist Items</h3>
          <p style={{ margin: 0, fontSize: "1.8rem", fontWeight: "bold", color: "#1e293b" }}>
            {summary.wishlist_count}
          </p>
          <span style={{ fontSize: "0.8rem", color: "#64748b" }}>Saved for later</span>
        </div>

        <div style={{ background: "#f8f9fa", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "1.25rem" }}>
          <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "0.95rem", color: "#475569" }}>Unread Notifications</h3>
          <p style={{ margin: 0, fontSize: "1.8rem", fontWeight: "bold", color: "#1e293b" }}>
            {summary.unread_notifications}
          </p>
          <span style={{ fontSize: "0.8rem", color: "#64748b" }}>Account & delivery alerts</span>
        </div>
      </div>

      {/* Recent Orders Section */}
      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.25rem", borderBottom: "2px solid #e2e8f0", paddingBottom: "0.5rem" }}>
          Recent Orders
        </h2>
        {recent_orders && recent_orders.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "1rem" }}>
            {recent_orders.map((order) => (
              <div
                key={order.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "1rem",
                  border: "1px solid #e2e8f0",
                  borderRadius: "6px"
                }}
              >
                <div>
                  <strong>{order.order_number}</strong>
                  <div style={{ fontSize: "0.85rem", color: "#666" }}>Date: {order.date} • {order.items_count} items</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: "bold" }}>${order.total_amount.toFixed(2)}</div>
                  <span style={{ fontSize: "0.8rem", background: "#e0f2fe", color: "#0369a1", padding: "2px 8px", borderRadius: "4px" }}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: "1.5rem", background: "#f1f5f9", borderRadius: "6px", color: "#64748b" }}>
            No orders found. When you place orders, they will show up here.
          </div>
        )}
      </section>

      {/* Wishlist Section */}
      <section>
        <h2 style={{ fontSize: "1.25rem", borderBottom: "2px solid #e2e8f0", paddingBottom: "0.5rem" }}>
          Wishlist Highlights
        </h2>
        {wishlist && wishlist.items && wishlist.items.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "1rem" }}>
            {wishlist.items.map((item) => (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "0.85rem 1rem",
                  border: "1px solid #e2e8f0",
                  borderRadius: "6px"
                }}
              >
                <span>{item.title}</span>
                <strong>${item.price.toFixed(2)}</strong>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: "1.5rem", background: "#f1f5f9", borderRadius: "6px", color: "#64748b" }}>
            Your wishlist is empty. Browse products to save your favorites.
          </div>
        )}
      </section>
    </div>
  );
};

export default DashboardPage;