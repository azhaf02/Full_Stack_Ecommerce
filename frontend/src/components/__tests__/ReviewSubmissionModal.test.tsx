import '@testing-library/jest-dom/vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ReviewSubmissionModal from '../ReviewSubmissionModal';

describe('ReviewSubmissionModal Component', () => {
  const dummyOrder = {
    id: 9821,
    product_id: 1,
    product_name: 'Bluetooth Noise-Cancelling Headphones',
  };

  it('renders modal with product title, form inputs, and submit button', () => {
    render(<ReviewSubmissionModal order={dummyOrder} onClose={() => {}} />);

    expect(screen.getByText(/Review Bluetooth Noise-Cancelling Headphones/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e\.g\. Outstanding sound quality/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Write your detailed experience here/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Submit Review/i })).toBeInTheDocument();
  });

  it('triggers onClose when close button is clicked', () => {
    const handleClose = vi.fn();
    render(<ReviewSubmissionModal order={dummyOrder} onClose={handleClose} />);

    const closeBtn = screen.getByText('✕');
    fireEvent.click(closeBtn);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});