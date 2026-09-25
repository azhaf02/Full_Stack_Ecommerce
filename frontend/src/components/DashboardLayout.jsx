import React, { useState } from 'react';
import OrdersListView from './OrdersListView';
import NotificationCenter from './NotificationCenter';
import ReviewSubmissionModal from './ReviewSubmissionModal';

export default function DashboardLayout() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);

  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Order Dispatched', message: 'Your package #ORD-9821 has been shipped.', time: '10 mins ago', isRead: false },
    { id: 2, title: 'Review Accepted', message: 'Thank you for reviewing the Wireless Headphones.', time: '2 hours ago', isRead: true }
  ]);

  const [orders] = useState([
    { id: 1, orderCode: '#ORD-9821', productName: 'Bluetooth Noise-Cancelling Headphones', date: '2026-09-21', status: 'Delivered', total: 89.99 },
    { id: 2, orderCode: '#ORD-9825', productName: 'Ergonomic Mechanical Keyboard', date: '2026-09-24', status: 'Shipped', total: 129.50 }
  ]);

  const [reviews, setReviews] = useState([
    { id: 1, productName: 'Wireless Mouse', rating: 5, comment: 'Excellent battery life and feel.', createdAt: '2026-09-15' }
  ]);

  const handleMarkAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
  };

  const handleToggleRead = (id) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const handleOpenReview = (order) => {
    setSelectedOrder(order);
    setIsReviewOpen(true);
  };

  const handleAddReview = (newReview) => {
    setReviews([newReview, ...reviews]);
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="min-vh-100 bg-light">
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark sticky-top shadow-sm">
        <div className="container-fluid px-4">
          <span className="navbar-brand fw-bold">Customer Portal</span>
          <div className="d-flex align-items-center">
            <button
              className="btn btn-outline-light position-relative me-3"
              onClick={() => setActiveTab('notifications')}
            >
              <i className="bi bi-bell"></i>
              {unreadCount > 0 && (
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                  {unreadCount}
                </span>
              )}
            </button>
            <span className="text-white-50">Customer Dashboard</span>
          </div>
        </div>
      </nav>

      <div className="container-fluid px-4 py-4">
        <div className="row g-4">
          <div className="col-lg-3">
            <div className="card border-0 shadow-sm">
              <div className="card-body text-center p-4">
                <i className="bi bi-person-circle display-4 text-primary mb-2"></i>
                <h5 className="card-title mb-1">Customer Account</h5>
                <p className="text-muted small mb-3">customer@example.com</p>
                <div className="list-group list-group-flush text-start">
                  <button
                    className={`list-group-item list-group-item-action ${activeTab === 'overview' ? 'active' : ''}`}
                    onClick={() => setActiveTab('overview')}
                  >
                    <i className="bi bi-grid-fill me-2"></i>Dashboard Overview
                  </button>
                  <button
                    className={`list-group-item list-group-item-action ${activeTab === 'orders' ? 'active' : ''}`}
                    onClick={() => setActiveTab('orders')}
                  >
                    <i className="bi bi-bag-check-fill me-2"></i>Orders
                  </button>
                  <button
                    className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${activeTab === 'notifications' ? 'active' : ''}`}
                    onClick={() => setActiveTab('notifications')}
                  >
                    <span><i className="bi bi-bell-fill me-2"></i>Notifications</span>
                    {unreadCount > 0 && <span className="badge bg-danger rounded-pill">{unreadCount}</span>}
                  </button>
                  <button
                    className={`list-group-item list-group-item-action ${activeTab === 'reviews' ? 'active' : ''}`}
                    onClick={() => setActiveTab('reviews')}
                  >
                    <i className="bi bi-star-fill me-2"></i>My Reviews
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-9">
            {activeTab === 'overview' && (
              <>
                <div className="row g-3 mb-4">
                  <div className="col-md-4">
                    <div className="card border-0 shadow-sm p-3">
                      <div className="text-muted small">Total Orders</div>
                      <div className="fs-3 fw-bold">{orders.length}</div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="card border-0 shadow-sm p-3">
                      <div className="text-muted small">Unread Alerts</div>
                      <div className="fs-3 fw-bold text-danger">{unreadCount}</div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="card border-0 shadow-sm p-3">
                      <div className="text-muted small">Submitted Reviews</div>
                      <div className="fs-3 fw-bold text-warning">{reviews.length}</div>
                    </div>
                  </div>
                </div>
                <OrdersListView orders={orders} onOpenReview={handleOpenReview} />
              </>
            )}

            {activeTab === 'orders' && (
              <OrdersListView orders={orders} onOpenReview={handleOpenReview} />
            )}

            {activeTab === 'notifications' && (
              <NotificationCenter
                notifications={notifications}
                onMarkAllRead={handleMarkAllRead}
                onToggleRead={handleToggleRead}
              />
            )}

            {activeTab === 'reviews' && (
              <div className="card shadow-sm border-0">
                <div className="card-header bg-white py-3">
                  <h5 className="mb-0"><i className="bi bi-star-fill text-warning me-2"></i>Submitted Reviews</h5>
                </div>
                <div className="card-body">
                  {reviews.length === 0 ? (
                    <p className="text-muted">No reviews submitted yet.</p>
                  ) : (
                    <div className="list-group list-group-flush">
                      {reviews.map((r, idx) => (
                        <div key={idx} className="list-group-item py-3">
                          <div className="d-flex justify-content-between">
                            <h6 className="mb-1 fw-bold">{r.productName}</h6>
                            <span className="text-muted small">{r.createdAt}</span>
                          </div>
                          <div className="text-warning mb-1">
                            {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                          </div>
                          <p className="mb-0 text-secondary">{r.comment}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <ReviewSubmissionModal
        order={selectedOrder}
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        onSubmitReview={handleAddReview}
      />
    </div>
  );
}