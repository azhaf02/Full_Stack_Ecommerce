import React, { useState } from 'react';
import axios from 'axios';

interface OrderItem {
  id?: number;
  product_id?: number;
  product_name?: string;
}

interface ReviewSubmissionModalProps {
  order?: OrderItem;
  onClose?: () => void;
  onCancel?: () => void;
  close?: () => void;
  handleClose?: () => void;
  setShowModal?: (show: boolean) => void;
  setShowReviewModal?: (show: boolean) => void;
  onSuccess?: () => void;
  onReviewSubmitted?: () => void;
}

export default function ReviewSubmissionModal(props: ReviewSubmissionModalProps) {
  const {
    order,
    onClose,
    onCancel,
    close,
    setShowModal,
    setShowReviewModal,
    handleClose,
    onSuccess,
    onReviewSubmitted,
  } = props;

  const [rating, setRating] = useState<number>(5);
  const [title, setTitle] = useState<string>('');
  const [comment, setComment] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const handleDismiss = () => {
    if (typeof onClose === 'function') onClose();
    else if (typeof onCancel === 'function') onCancel();
    else if (typeof close === 'function') close();
    else if (typeof handleClose === 'function') handleClose();
    else if (typeof setShowReviewModal === 'function') setShowReviewModal(false);
    else if (typeof setShowModal === 'function') setShowModal(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const payload = {
      product_id: order?.product_id || 1,
      user_id: 1,
      order_id: order?.id || 1,
      rating: Number(rating),
      title: title || 'Product Review',
      comment: comment,
    };

    try {
      await axios.post('http://127.0.0.1:8000/api/reviews', payload);
      setLoading(false);
      if (typeof onSuccess === 'function') onSuccess();
      if (typeof onReviewSubmitted === 'function') onReviewSubmitted();
      handleDismiss();
    } catch (err: any) {
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
        backgroundColor: 'rgba(30, 36, 30, 0.6)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#ffffff',
          borderRadius: '18px',
          width: '440px',
          padding: '28px',
          boxShadow: '0 12px 36px rgba(0, 0, 0, 0.18)',
          border: '1px solid #e8e5de',
          fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1e241e' }}>
              Review {order?.product_name || 'Product'}
            </h3>
            <span style={{ fontSize: '12px', color: '#6e776e' }}>Share your feedback with the community</span>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            style={{
              background: '#f2eee6',
              border: 'none',
              borderRadius: '50%',
              width: '30px',
              height: '30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              color: '#455045',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        {errorMsg && (
          <div style={{
            background: '#fdf2f2',
            color: '#d9534f',
            border: '1px solid #f8b4b4',
            padding: '10px 14px',
            borderRadius: '10px',
            marginBottom: '16px',
            fontSize: '13px',
          }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '13px', marginBottom: '6px', color: '#2f3e30' }}>
              Overall Rating
            </label>
            <select
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '10px',
                border: '1px solid #d1cfc9',
                backgroundColor: '#faf9f6',
                color: '#1e241e',
                fontSize: '14px',
                outline: 'none',
              }}
            >
              <option value="5">⭐⭐⭐⭐⭐ (5 - Excellent)</option>
              <option value="4">⭐⭐⭐⭐ (4 - Good)</option>
              <option value="3">⭐⭐⭐ (3 - Average)</option>
              <option value="2">⭐⭐ (2 - Poor)</option>
              <option value="1">⭐ (1 - Terrible)</option>
            </select>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '13px', marginBottom: '6px', color: '#2f3e30' }}>
              Review Title
            </label>
            <input
              type="text"
              placeholder="e.g. Outstanding sound quality and battery life!"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '10px',
                border: '1px solid #d1cfc9',
                backgroundColor: '#ffffff',
                color: '#1e241e',
                boxSizing: 'border-box',
                fontSize: '13px',
                outline: 'none',
              }}
              required
            />
          </div>

          <div style={{ marginBottom: '22px' }}>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '13px', marginBottom: '6px', color: '#2f3e30' }}>
              Detailed Feedback
            </label>
            <textarea
              rows={4}
              placeholder="Write your detailed experience here..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '10px',
                border: '1px solid #d1cfc9',
                backgroundColor: '#ffffff',
                color: '#1e241e',
                boxSizing: 'border-box',
                fontSize: '13px',
                outline: 'none',
                resize: 'none',
              }}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              onClick={handleDismiss}
              style={{
                padding: '10px 18px',
                background: '#f2eee6',
                color: '#455045',
                border: 'none',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '10px 22px',
                background: '#3b4d3c',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                boxShadow: '0 4px 12px rgba(59,77,60,0.25)',
              }}
            >
              {loading ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}