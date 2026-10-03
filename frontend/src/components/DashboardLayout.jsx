import React, { useState } from 'react';

export default function CustomerDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  // Support Form States
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('General Inquiry');
  const [orderRef, setOrderRef] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFeedback(null);
    try {
      const response = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          category,
          order_reference: orderRef || null,
          message,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create ticket. Please try again.');
      }

      setFeedback({ type: 'success', text: 'Support ticket submitted successfully! (Simulated Mode)' });
      setSubject('');
      setCategory('General Inquiry');
      setOrderRef('');
      setMessage('');
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Something went wrong.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ backgroundColor: '#f7f6f0', minHeight: '100vh' }}>
      {/* 1. Dark Olive Green Top Navbar */}
      <nav 
        className="navbar px-4 py-2 text-white" 
        style={{ backgroundColor: '#3b4328', color: '#ffffff' }}
      >
        <div className="container-fluid d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center gap-2 fw-bold fs-4">
            <i className="bi bi-bag-check-fill"></i>
            <span>VIORA</span>
          </div>
          <div className="d-flex align-items-center gap-2 text-white-50 small">
            <i className="bi bi-person-circle text-white"></i>
            <span className="text-white">customer@example.com</span>
          </div>
        </div>
      </nav>

      {/* 2. Main Centered Card Container */}
      <div className="container py-5">
        <div className="card border-0 shadow-sm p-4 p-md-5 rounded-4" style={{ backgroundColor: '#ffffff' }}>
          
          {/* Title Header */}
          <div className="mb-4">
            <h2 className="fw-bold mb-1" style={{ color: '#3b4328' }}>
              Customer Portal
            </h2>
            <p className="text-muted small mb-0">
              Manage your orders, tracking profiles, and system entries
            </p>
          </div>

          {/* Navigation Buttons Row */}
          <div className="d-flex gap-2 mb-4 flex-wrap">
            <button
              type="button"
              className="btn px-3 py-2 fw-medium"
              style={{
                backgroundColor: activeTab === 'overview' ? '#556b2f' : '#f4f4f0',
                color: activeTab === 'overview' ? '#ffffff' : '#4a4a4a',
                border: 'none',
                borderRadius: '8px'
              }}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>

            <button
              type="button"
              className="btn px-3 py-2 fw-medium"
              style={{
                backgroundColor: activeTab === 'orders' ? '#556b2f' : '#f4f4f0',
                color: activeTab === 'orders' ? '#ffffff' : '#4a4a4a',
                border: 'none',
                borderRadius: '8px'
              }}
              onClick={() => setActiveTab('orders')}
            >
              Orders
            </button>

            <button
              type="button"
              className="btn px-3 py-2 fw-medium d-flex align-items-center gap-1"
              style={{
                backgroundColor: activeTab === 'notifications' ? '#556b2f' : '#f4f4f0',
                color: activeTab === 'notifications' ? '#ffffff' : '#4a4a4a',
                border: 'none',
                borderRadius: '8px'
              }}
              onClick={() => setActiveTab('notifications')}
            >
              Notifications <span className="badge rounded-pill bg-danger ms-1">1</span>
            </button>

            <button
              type="button"
              className="btn px-3 py-2 fw-medium"
              style={{
                backgroundColor: activeTab === 'support' ? '#556b2f' : '#f4f4f0',
                color: activeTab === 'support' ? '#ffffff' : '#4a4a4a',
                border: 'none',
                borderRadius: '8px'
              }}
              onClick={() => setActiveTab('support')}
            >
              Support Form
            </button>

            <button
              type="button"
              className="btn px-3 py-2 fw-medium"
              style={{
                backgroundColor: activeTab === 'reviews' ? '#556b2f' : '#f4f4f0',
                color: activeTab === 'reviews' ? '#ffffff' : '#4a4a4a',
                border: 'none',
                borderRadius: '8px'
              }}
              onClick={() => setActiveTab('reviews')}
            >
              My Reviews
            </button>
          </div>

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div>
              <div className="row g-3 mb-4">
                <div className="col-12 col-md-4">
                  <div className="card border-0 p-3 d-flex flex-row justify-content-between align-items-center" style={{ backgroundColor: '#fcfbf7', borderRadius: '12px' }}>
                    <div>
                      <div className="text-muted small">Total Orders</div>
                      <div className="fs-2 fw-bold">2</div>
                    </div>
                    <i className="bi bi-cart-check fs-1" style={{ color: '#556b2f' }}></i>
                  </div>
                </div>
                <div className="col-12 col-md-4">
                  <div className="card border-0 p-3 d-flex flex-row justify-content-between align-items-center" style={{ backgroundColor: '#fcfbf7', borderRadius: '12px' }}>
                    <div>
                      <div className="text-muted small">Unread Alerts</div>
                      <div className="fs-2 fw-bold">1</div>
                    </div>
                    <i className="bi bi-bell fs-1 text-danger"></i>
                  </div>
                </div>
                <div className="col-12 col-md-4">
                  <div className="card border-0 p-3 d-flex flex-row justify-content-between align-items-center" style={{ backgroundColor: '#fcfbf7', borderRadius: '12px' }}>
                    <div>
                      <div className="text-muted small">Submitted Reviews</div>
                      <div className="fs-2 fw-bold">1</div>
                    </div>
                    <i className="bi bi-star-fill fs-1 text-warning"></i>
                  </div>
                </div>
              </div>

              <h5 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: '#3b4328' }}>
                <i className="bi bi-box-seam"></i> My Orders
              </h5>
              <div className="card border-0 shadow-sm rounded-3 overflow-hidden">
                <div className="table-responsive">
                  <table className="table align-middle mb-0">
                    <thead className="table-light">
                      <tr className="small text-uppercase text-muted">
                        <th>Order ID</th>
                        <th>Product Name</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Total Amount</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="fw-bold">#ORD-9821</td>
                        <td>Bluetooth Noise-Cancelling Headphones</td>
                        <td>2026-09-21</td>
                        <td><span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1">Delivered</span></td>
                        <td className="fw-bold">$89.99</td>
                        <td>
                          <button 
                            className="btn btn-sm text-white fw-medium px-3"
                            style={{ backgroundColor: '#556b2f', border: 'none', borderRadius: '6px' }}
                          >
                            <i className="bi bi-pencil-square me-1"></i> Review
                          </button>
                        </td>
                      </tr>
                      <tr>
                        <td className="fw-bold">#ORD-9825</td>
                        <td>Ergonomic Mechanical Keyboard</td>
                        <td>2026-09-24</td>
                        <td><span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle px-2 py-1">Shipped</span></td>
                        <td className="fw-bold">$129.50</td>
                        <td><span className="text-muted small"><i className="bi bi-truck me-1"></i>In Transit</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div className="p-3">
              <h4 className="fw-bold mb-3" style={{ color: '#3b4328' }}>Notifications & Alerts</h4>
              <div className="alert alert-warning border-0 shadow-sm d-flex align-items-center gap-3" role="alert">
                <i className="bi bi-bell-fill fs-4 text-warning"></i>
                <div>
                  <strong>Order #ORD-9825 Dispatched!</strong> Your item is currently in transit with express shipping.
                  <div className="text-muted small">2 hours ago</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SUPPORT FORM */}
          {activeTab === 'support' && (
            <div>
              <div className="mb-4">
                <h3 className="fw-bold mb-1" style={{ color: '#556b2f' }}>
                  Create Support Ticket
                </h3>
                <p className="text-muted small mb-0">
                  Submit your inquiry and our support team will get back to you shortly.
                </p>
              </div>

              {feedback && (
                <div
                  className={`alert ${
                    feedback.type === 'success' ? 'alert-success' : 'alert-danger'
                  } alert-dismissible fade show mb-4`}
                  role="alert"
                >
                  <i className={`bi ${feedback.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} me-2`}></i>
                  {feedback.text}
                </div>
              )}

              <div className="card p-4 border-0 rounded-3" style={{ backgroundColor: '#fcfbf7' }}>
                <form onSubmit={handleSubmit}>
                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">
                        Subject <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Brief summary of the issue"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        required
                      />
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label fw-semibold">
                        Category <span className="text-danger">*</span>
                      </label>
                      <select
                        className="form-select"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                      >
                        <option value="General Inquiry">General Inquiry</option>
                        <option value="Orders">Order Tracking & Delivery</option>
                        <option value="Payments">Payment & Refund</option>
                        <option value="Product">Product Issue</option>
                      </select>
                    </div>

                    <div className="col-12">
                      <label className="form-label fw-semibold">
                        Order Reference <span className="text-muted small">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. #ORD-9821"
                        value={orderRef}
                        onChange={(e) => setOrderRef(e.target.value)}
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label fw-semibold">
                        Detailed Description <span className="text-danger">*</span>
                      </label>
                      <textarea
                        className="form-control"
                        rows={5}
                        placeholder="Provide detailed information regarding your problem..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        required
                      ></textarea>
                    </div>

                    <div className="col-12 mt-4 text-end">
                      <button
                        type="submit"
                        disabled={loading}
                        className="btn px-4 py-2 fw-semibold text-white"
                        style={{ backgroundColor: '#556b2f', borderRadius: '8px' }}
                      >
                        {loading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                            Submitting...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-send-fill me-2"></i> Submit Ticket
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* TAB 4 & 5 */}
          {activeTab === 'orders' && (
            <div className="p-3">
              <h4 className="fw-bold mb-2" style={{ color: '#3b4328' }}>Orders List</h4>
              <p className="text-muted">Your order history appears here.</p>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="p-3">
              <h4 className="fw-bold mb-2" style={{ color: '#3b4328' }}>My Reviews</h4>
              <p className="text-muted">Your product reviews list appears here.</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}