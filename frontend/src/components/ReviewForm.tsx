import React, { useState } from 'react';

interface ReviewFormProps {
  productId: number;
  productName: string;
  orderId: number;
  userId: number;
  onSuccess?: () => void;
  onClose?: () => void;
}

export const ReviewForm: React.FC<ReviewFormProps> = ({
  productId,
  productName,
  orderId,
  userId,
  onSuccess,
  onClose
}) => {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          product_id: productId,
          order_id: orderId,
          rating,
          title,
          comment
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Review submit karne mein error aayi.');
      }

      setSubmitted(true);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#FAF9F5] border border-[#232F24]/20 p-6 max-w-lg mx-auto font-serif">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-normal text-[#232F24]">Write a Review</h3>
          <p className="text-xs uppercase tracking-wider text-[#232F24]/70 mt-1">{productName}</p>
        </div>
        {onClose && (
          <button 
            type="button" 
            onClick={onClose} 
            className="text-gray-400 hover:text-[#232F24] text-lg leading-none"
          >
            ✕
          </button>
        )}
      </div>

      {errorMsg && (
        <div className="p-3 mb-4 text-xs text-red-700 bg-red-50 border border-red-200 font-sans">
          {errorMsg}
        </div>
      )}

      {submitted ? (
        <div className="py-6 text-center font-sans">
          <p className="text-[#232F24] font-medium text-sm">Thank you for your review!</p>
          <p className="text-[#232F24]/70 text-xs mt-1">Your review is currently pending moderation.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 font-sans text-xs">
          <div>
            <label className="block uppercase tracking-wider text-[#232F24] mb-1 font-semibold">Rating</label>
            <div className="flex gap-1 text-2xl cursor-pointer select-none">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  style={{ color: (hoverRating || rating) >= star ? '#232F24' : '#D1D5DB' }}
                >
                  ★
                </span>
              ))}
            </div>
          </div>

          <div>
            <label className="block uppercase tracking-wider text-[#232F24] mb-1 font-semibold">Review Headline</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Elegant cut, fits perfectly"
              className="w-full p-2 border border-[#232F24]/20 bg-white focus:outline-none focus:border-[#232F24]"
            />
          </div>

          <div>
            <label className="block uppercase tracking-wider text-[#232F24] mb-1 font-semibold">Detailed Review</label>
            <textarea
              required
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share details regarding quality, texture, and sizing..."
              className="w-full p-2 border border-[#232F24]/20 bg-white focus:outline-none focus:border-[#232F24]"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 uppercase tracking-wider text-[#232F24]/70 hover:text-[#232F24]"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 uppercase tracking-wider bg-[#232F24] text-white hover:bg-[#1A231B] transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};