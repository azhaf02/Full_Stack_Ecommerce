import React, { useEffect, useState } from "react";

interface ReviewItem {
  id: number;
  product_id: number;
  user_id: number;
  order_id: number;
  rating: number;
  title?: string;
  comment: string;
  status: string;
  created_at: string;
}

interface ReviewsSummaryResponse {
  product_id: number;
  average_rating: number;
  total_reviews: number;
  page: number;
  page_size: number;
  reviews: ReviewItem[];
}

interface ReviewsListProps {
  productId: number;
  refreshTrigger?: number;
}

export const ReviewsList: React.FC<ReviewsListProps> = ({
  productId,
  refreshTrigger = 0,
}) => {
  const [data, setData] = useState<ReviewsSummaryResponse | null>(null);
  const [page, setPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReviews = async (pageNumber: number) => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(
        `http://127.0.0.1:8000/api/products/${productId}/reviews?page=${pageNumber}&page_size=5`
      );
      if (!res.ok) {
        throw new Error("Failed to load reviews");
      }
      const json: ReviewsSummaryResponse = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || "An error occurred fetching reviews.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews(page);
  }, [productId, page, refreshTrigger]);

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span
        key={i}
        style={{
          color: i < rating ? "#d4a373" : "#d1d5db",
          fontSize: "15px",
          marginRight: "2px",
        }}
      >
        ★
      </span>
    ));
  };

  // Calculate rating breakdown distribution (5 down to 1)
  const getRatingDistribution = () => {
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    if (!data || !data.reviews) return counts;
    data.reviews.forEach((r) => {
      const star = Math.min(5, Math.max(1, Math.round(r.rating))) as 1 | 2 | 3 | 4 | 5;
      counts[star] = (counts[star] || 0) + 1;
    });
    return counts;
  };

  if (loading && !data) {
    return (
      <div style={{ padding: "32px 0", textAlign: "center", color: "#6e776e", fontSize: "14px" }}>
        Loading reviews...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        padding: "16px 20px",
        borderRadius: "12px",
        backgroundColor: "#fdf2f2",
        color: "#d9534f",
        border: "1px solid #f8b4b4",
        fontSize: "14px",
        margin: "16px 0",
      }}>
        {error}
      </div>
    );
  }

  const totalPages = data ? Math.ceil(data.total_reviews / data.page_size) : 1;
  const ratingCounts = getRatingDistribution();

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif" }}>
      {/* Top Aggregated Summary & Rating Distribution */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "220px 1fr",
        gap: "28px",
        padding: "24px",
        backgroundColor: "#faf9f6",
        borderRadius: "16px",
        border: "1px solid #ede8de",
        marginBottom: "24px",
      }}>
        {/* Left: Overall Rating Box */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          borderRight: "1px solid #e8e5de",
          paddingRight: "24px",
        }}>
          <div style={{ fontSize: "44px", fontWeight: "800", color: "#2f3e30", lineHeight: 1 }}>
            {data?.average_rating ? data.average_rating.toFixed(1) : "0.0"}
          </div>
          <div style={{ margin: "8px 0 4px" }}>
            {renderStars(Math.round(data?.average_rating ?? 0))}
          </div>
          <div style={{ fontSize: "12px", color: "#6e776e", fontWeight: "500" }}>
            {data?.total_reviews ?? 0} Customer Reviews
          </div>
        </div>

        {/* Right: Star Breakdown Progress Bars */}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: "6px" }}>
          {[5, 4, 3, 2, 1].map((stars) => {
            const count = ratingCounts[stars as keyof typeof ratingCounts] || 0;
            const percentage = data?.total_reviews ? Math.round((count / data.total_reviews) * 100) : 0;
            return (
              <div key={stars} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "12px" }}>
                <span style={{ width: "42px", color: "#455045", fontWeight: "600" }}>{stars} star</span>
                <div style={{
                  flex: 1,
                  height: "8px",
                  borderRadius: "8px",
                  backgroundColor: "#e8e5de",
                  overflow: "hidden",
                }}>
                  <div style={{
                    width: `${percentage}%`,
                    height: "100%",
                    borderRadius: "8px",
                    backgroundColor: "#a3b899",
                    transition: "width 0.4s ease",
                  }} />
                </div>
                <span style={{ width: "32px", textAlign: "right", color: "#8a948a", fontSize: "11px" }}>
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Review Entries List */}
      {data && data.reviews.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {data.reviews.map((rev) => (
            <div
              key={rev.id}
              style={{
                padding: "18px 20px",
                borderRadius: "14px",
                border: "1px solid #ede8de",
                backgroundColor: "#ffffff",
                transition: "box-shadow 0.2s ease",
              }}
            >
              {/* Header row: stars, verified badge, date */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div>{renderStars(rev.rating)}</div>
                  <span style={{
                    backgroundColor: "#e9f2eb",
                    color: "#2f3e30",
                    fontSize: "11px",
                    fontWeight: "600",
                    padding: "2px 8px",
                    borderRadius: "12px",
                  }}>
                    ✓ Verified Purchase
                  </span>
                </div>
                <span style={{ fontSize: "12px", color: "#8a948a" }}>
                  {new Date(rev.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>

              {/* Title & Feedback */}
              {rev.title && (
                <h4 style={{ margin: "0 0 6px", fontSize: "14px", fontWeight: "700", color: "#1e241e" }}>
                  {rev.title}
                </h4>
              )}
              <p style={{ margin: 0, fontSize: "13px", lineHeight: "1.5", color: "#455045" }}>
                {rev.comment}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div style={{
          padding: "40px 20px",
          textAlign: "center",
          borderRadius: "14px",
          border: "1px dashed #d1cfc9",
          backgroundColor: "#faf9f6",
        }}>
          <p style={{ margin: 0, fontSize: "14px", color: "#6e776e" }}>
            No reviews yet. Write a review from the "My Orders" tab to be the first!
          </p>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: "20px",
          paddingTop: "16px",
          borderTop: "1px solid #e8e5de",
        }}>
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            style={{
              padding: "8px 16px",
              borderRadius: "10px",
              border: "1px solid #d1cfc9",
              backgroundColor: page <= 1 ? "#f5f5f5" : "#ffffff",
              color: page <= 1 ? "#9ca3af" : "#2f3e30",
              fontSize: "12px",
              fontWeight: "600",
              cursor: page <= 1 ? "not-allowed" : "pointer",
              transition: "all 0.2s ease",
            }}
          >
            ← Previous
          </button>

          <span style={{ fontSize: "12px", color: "#6e776e", fontWeight: "500" }}>
            Page {page} of {totalPages}
          </span>

          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
            style={{
              padding: "8px 16px",
              borderRadius: "10px",
              border: "1px solid #d1cfc9",
              backgroundColor: page >= totalPages ? "#f5f5f5" : "#ffffff",
              color: page >= totalPages ? "#9ca3af" : "#2f3e30",
              fontSize: "12px",
              fontWeight: "600",
              cursor: page >= totalPages ? "not-allowed" : "pointer",
              transition: "all 0.2s ease",
            }}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
};

export default ReviewsList;