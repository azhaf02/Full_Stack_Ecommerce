import type { ReactNode } from 'react';

export default function Alert({ type = 'error', children }: { type?: 'error' | 'success'; children: ReactNode }) {
  const styles =
    type === 'error'
      ? 'border-red-200 bg-red-50 text-red-700'
      : 'border-viora-sage bg-viora-sage-soft text-viora-olive-dark';
  return (
    <div role={type === 'error' ? 'alert' : 'status'} className={`mb-4 rounded-lg border px-4 py-3 text-sm ${styles}`}>
      {children}
    </div>
  );
}
