import React, { useEffect, useState } from 'react';

interface ReviewItem {
  id: number;
  user_id: number;
  rating: number;
  title: string;
  comment: string;
  created_at: string;
}

interface ReviewsResponse {
  product_id: number;
  average_rating: number;
  total_reviews: number;
  page: number;
  limit: number;
  reviews: ReviewItem[];
}

interface ReviewsListProps {
  productId: number;
}

export const ReviewsList: React.FC<ReviewsListProps> = ({ productId }) => {
  const [data, setData] = useState<ReviewsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/products/${productId}/reviews?page=${page}&limit=5`)
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching reviews:', err);
        setLoading(false);
      });
  }, [productId, page]);

  if (loading) {
    return <div className="py-6 text-sm text-neutral-500">Loading reviews...</div>;
  }

  if (!data || data.total_reviews === 0) {
    return (
      <div className="py-6 text-sm text-neutral-500 italic">
        No reviews yet for this piece. Be the first to review.
      </div>
    );
  }

  return (
    <section className="mt-8 border-t border-neutral-200 pt-8 font-sans">
      <div className="flex items-center gap-4 mb-6">
        <h3 className="text-xl font-serif text-[#232F24] tracking-tight">Customer Reviews</h3>
        <div className="flex items-center gap-2 bg-[#232F24] text-white px-3 py-1 rounded-sm text-sm font-medium">
          <span>★ {data.average_rating.toFixed(1)}</span>
          <span className="text-xs text-neutral-300">({data.total_reviews})</span>
        </div>
      </div>

      <div className="space-y-4">
        {data.reviews.map((rev) => (
          <div key={rev.id} className="p-4 border border-neutral-100 rounded bg-[#FAF9F6]">
            <div className="flex items-center justify-between mb-1">
              <span className="text-amber-600 font-bold text-sm">{'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}</span>
              <span className="text-xs text-neutral-400">
                {rev.created_at ? new Date(rev.created_at).toLocaleDateString() : ''}
              </span>
            </div>
            {rev.title && <h4 className="font-semibold text-sm text-neutral-900 mb-1">{rev.title}</h4>}
            <p className="text-sm text-neutral-700 leading-relaxed">{rev.comment}</p>
          </div>
        ))}
      </div>

      {/* Pagination controls */}
      {data.total_reviews > 5 && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-neutral-100 text-sm">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 text-xs uppercase tracking-wider text-[#232F24] border border-[#232F24] disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-xs text-neutral-600">Page {data.page}</span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={data.reviews.length < 5}
            className="px-3 py-1 text-xs uppercase tracking-wider text-[#232F24] border border-[#232F24] disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </section>
  );
};