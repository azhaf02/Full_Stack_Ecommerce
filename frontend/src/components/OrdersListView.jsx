import React from 'react';

export default function OrdersListView({ orders, onOpenReview }) {
  return (
    <div className="card shadow-sm border-0 mb-4">
      <div className="card-header bg-white py-3">
        <h5 className="mb-0"><i className="bi bi-box-seam text-primary me-2"></i>My Orders</h5>
      </div>
      <div className="card-body p-0">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>Order ID</th>
                <th>Product</th>
                <th>Date</th>
                <th>Status</th>
                <th>Total</th>
                <th className="text-end">Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="fw-semibold">{order.orderCode}</td>
                  <td>{order.productName}</td>
                  <td>{order.date}</td>
                  <td>
                    <span className={`badge ${order.status === 'Delivered' ? 'bg-success' : 'bg-warning text-dark'}`}>
                      {order.status}
                    </span>
                  </td>
                  <td>${order.total.toFixed(2)}</td>
                  <td className="text-end">
                    {order.status === 'Delivered' ? (
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => onOpenReview(order)}
                      >
                        <i className="bi bi-star me-1"></i>Review
                      </button>
                    ) : (
                      <span className="text-muted small">In Transit</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}