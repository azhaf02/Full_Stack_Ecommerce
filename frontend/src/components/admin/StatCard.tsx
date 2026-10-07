import type { LucideIcon } from "lucide-react";
import { ArrowUp, ArrowDown } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  change?: number;      // % vs last month, e.g. 12.4 or -3.1 (hidden when not given)
  icon: LucideIcon;
  iconBg: string;       // Tailwind classes for the icon box colour
}

export default function StatCard({ title, value, change, icon: Icon, iconBg }: StatCardProps) {
  const isPositive = change !== undefined && change >= 0;

  return (
    <div className="bg-cream-50 rounded-xl border shadow-sm p-5 flex items-start gap-4">
      <div className={`p-3 rounded-full ${iconBg}`}>
        <Icon size={24} />
      </div>

      <div>
        <p className="text-sm text-slate-500 font-medium">{title}</p>
        <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
        {change !== undefined && (
          <p className={`text-xs mt-2 flex items-center gap-1 ${isPositive ? "text-green-600" : "text-red-600"}`}>
            {isPositive ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
            {Math.abs(change)}%
            <span className="text-slate-400">vs last month</span>
          </p>
        )}
      </div>
    </div>
  );
}
