import type { ReactNode } from "react";

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}

export default function ChartCard({ title, subtitle, children, className = "" }: ChartCardProps) {
  return (
    <div className={`admin-card p-6 transition-shadow duration-200 hover:shadow-md ${className}`}>
      <div className="mb-5">
        <h3 className="font-display text-lg font-semibold text-primary-900">{title}</h3>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      <div className="h-72">{children}</div>
    </div>
  );
}
