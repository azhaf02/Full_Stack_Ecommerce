import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ReviewsList from '../ReviewsList';

describe('ReviewsList Component', () => {
  const dummyReviews = [
    {
      id: 1,
      user_name: 'Aliza Khan',
      rating: 5,
      title: 'Superb quality',
      comment: 'Exceeded all expectations, great battery life!',
      created_at: '2026-09-28',
    },
  ];

  beforeEach(() => {
    // Mock global fetch to return the review data
    globalThis.fetch = vi.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve(
            // Handles both array response or { reviews: [...] } response format
            Object.assign([...dummyReviews], {
              reviews: dummyReviews,
              average_rating: 5,
              total_reviews: 1,
            })
          ),
      } as Response)
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders review card content when reviews load', async () => {
    render(<ReviewsList productId={1} />);

    const comment = await screen.findByText(/Exceeded all expectations/i);
    expect(comment).toBeInTheDocument();
  });
});