import React, { useState } from 'react';
import axios from 'axios';

export default function ReviewSubmissionModal(props) {
  // Support any prop name passed from parent (onClose, onCancel, setShowModal, etc.)
  const {
    order,
    onClose,
    onCancel,
    close,
    setShowModal,
    setShowReviewModal,
    handleClose,
    onSuccess
  } = props;

  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Universal close handler
  const handleDismiss = () => {
    if (typeof onClose === 'function') onClose();
    else if (typeof onCancel === 'function') onCancel();
    else if (typeof close === 'function') close();
    else if (typeof handleClose === 'function') handleClose();
    else if (typeof setShowReviewModal === 'function') setShowReviewModal(false);
    else if (typeof setShowModal === 'function') setShowModal(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const payload = {
      product_id: order?.product_id || 1,
      user_id: 1,
      order_id: order?.id || 1,
      rating: parseInt(rating, 10),
      title: title || 'Product Review',
      comment: comment
    };

    try {
      await axios.post('http://localhost:8000/api/reviews/', payload);
      setLoading(false);
      if (typeof onSuccess === 'function') onSuccess();
      handleDismiss();
    } catch (err) {
      setLoading(false);
      setErrorMsg(err.response?.data?.detail || 'Failed to submit review');
    }
  };

  return (
    <div
      onClick={handleDismiss}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: '12px',
          width: '420px',
          padding: '24px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>
            Review {order?.product_name || 'Product'}
          </h3>
          <button
            type="button"
            onClick={handleDismiss}
            style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', lineHeight: 1 }}
          >
            ×
          </button>
        </div>

        {errorMsg && (
          <div style={{ background: '#ffe6e6', color: '#d93025', padding: '10px', borderRadius: '6px', marginBottom: '14px', fontSize: '14px' }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '13px', marginBottom: '6px' }}>Rating</label>
            <select
              value={rating}
              onChange={(e) => setRating(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ccc' }}
            >
              <option value="5">⭐⭐⭐⭐⭐ (5 - Excellent)</option>
              <option value="4">⭐⭐⭐⭐ (4 - Good)</option>
              <option value="3">⭐⭐⭐ (3 - Average)</option>
              <option value="2">⭐⭐ (2 - Poor)</option>
              <option value="1">⭐ (1 - Terrible)</option>
            </select>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '13px', marginBottom: '6px' }}>Title</label>
            <input
              type="text"
              placeholder="e.g. Great quality!"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }}
              required
            />
          </div>

          <div style={{ marginBottom: '18px' }}>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '13px', marginBottom: '6px' }}>Feedback</label>
            <textarea
              rows="3"
              placeholder="Share your experience..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ccc', boxSizing: 'border-box' }}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              onClick={handleDismiss}
              style={{ padding: '8px 16px', background: '#6c757d', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{ padding: '8px 18px', background: '#0d6efd', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
            >
              {loading ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}