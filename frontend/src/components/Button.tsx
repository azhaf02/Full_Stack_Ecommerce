import type { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  loading?: boolean;
}

const variants = {
  primary: 'bg-viora-olive text-white hover:bg-viora-olive-dark',
  secondary: 'border border-viora-sage bg-white text-viora-olive hover:bg-viora-sage-soft',
  danger: 'border border-red-200 bg-white text-red-700 hover:bg-red-50',
};

export default function Button({ variant = 'primary', loading = false, disabled, className = '', children, ...props }: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center rounded-xl shadow-sm px-4 py-2.5 text-sm font-semibold transition active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-viora-olive disabled:cursor-not-allowed disabled:opacity-60 ${variants[variant]} ${className}`}
      {...props}
    >
      {loading ? 'Please wait…' : children}
    </button>
  );
}
