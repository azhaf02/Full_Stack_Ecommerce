import React, { useEffect, useState } from 'react';
import { fetchAnalyticsSummary } from '../../api';

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

interface KPICardProps {
  title: string;
  value: string | number;
}

const KPICard: React.FC<KPICardProps> = ({ title, value }) => {
  return (
    <div>
      <h3>{title}</h3>
      <p>{value}</p>
    </div>
  );
};

const AnalyticsPage: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const token = localStorage.getItem('token');

        if (!token) {
          setError('Admin authentication token not found.');
          return;
        }

        const response = await fetchAnalyticsSummary(token);
        setAnalytics(response.data);
      } catch (err) {
        console.error('Failed to load analytics:', err);
        setError('Failed to load analytics data.');
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, []);

  if (loading) {
    return <div>Loading analytics...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  if (!analytics) {
    return <div>No analytics data available.</div>;
  }

  return (
    <div>
      <h1>Admin Analytics</h1>

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
  );
};

export default AnalyticsPage;