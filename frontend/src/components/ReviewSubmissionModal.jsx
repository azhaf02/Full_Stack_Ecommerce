import React, { useState } from 'react';

export default function ReviewSubmissionModal({ order, isOpen, onClose, onSubmitReview }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmitReview({
      orderId: order?.id,
      productName: order?.productName,
      rating,
      comment,
      createdAt: new Date().toLocaleDateString()
    });
    setComment('');
    setRating(5);
    onClose();
  };

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Write a Review: {order?.productName}</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label fw-bold">Rating (1 to 5 Stars)</label>
                <div className="d-flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      className="btn btn-link p-0 text-decoration-none"
                      onClick={() => setRating(star)}
                    >
                      <i className={`bi bi-star${star <= rating ? '-fill text-warning' : ' text-secondary'} fs-4`}></i>
                    </button>
                  ))}
                  <span className="ms-2 align-self-center badge bg-secondary">{rating} / 5</span>
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label fw-bold">Feedback / Comments</label>
                <textarea
                  className="form-control"
                  rows="3"
                  required
                  placeholder="Share details about your purchase..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                ></textarea>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary">Submit Review</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}