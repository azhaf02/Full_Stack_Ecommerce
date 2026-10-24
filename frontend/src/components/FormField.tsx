import { useState, type InputHTMLAttributes } from 'react';

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

const inputBase =
  'block w-full rounded-xl border bg-white px-4 py-3 text-left text-base text-viora-ink shadow-[0_1px_0_rgba(35,41,28,0.04)] outline-none transition ' +
  'placeholder:text-viora-muted/60 hover:border-viora-olive/60 focus:border-viora-olive focus:ring-4 focus:ring-viora-olive/15 ' +
  'disabled:cursor-not-allowed disabled:bg-viora-sage-soft/60 disabled:text-viora-muted';

function EyeIcon({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
      {!open && <path d="M4 20L20 4" />}
    </svg>
  );
}

export default function FormField({ label, error, hint, id, type = 'text', ...props }: FormFieldProps) {
  const [visible, setVisible] = useState(false);
  const inputId = id ?? props.name;
  const isPassword = type === 'password';
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;

  return (
    <div className="mb-5 text-left">
      <label htmlFor={inputId} className="mb-2 block text-sm font-medium text-viora-ink">
        {label}
      </label>
      <div className="relative">
        <input
          id={inputId}
          type={isPassword && visible ? 'text' : type}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={`${inputBase} ${error ? 'border-red-400' : 'border-viora-olive/35'} ${isPassword ? 'pr-12' : ''}`}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="absolute inset-y-0 right-1.5 my-auto flex h-9 w-9 items-center justify-center rounded-lg border-0 bg-transparent p-0 text-viora-muted hover:bg-viora-sage-soft hover:text-viora-olive focus-visible:outline-2 focus-visible:outline-viora-olive"
            aria-label={visible ? 'Hide password' : 'Show password'}
          >
            <EyeIcon open={!visible} />
          </button>
        )}
      </div>
      {error ? (
        <p id={`${inputId}-error`} className="mt-1.5 text-sm text-red-600">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${inputId}-hint`} className="mt-1.5 text-sm text-viora-muted">
            {hint}
          </p>
        )
      )}
    </div>
  );
}
