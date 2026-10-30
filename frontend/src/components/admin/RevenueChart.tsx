import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";
import { formatINR } from "../../utils/format";
import { chartColors } from "../../config/theme";

interface Point {
  date: string;
  revenue: number;
}

export default function RevenueChart({ data }: { data: Point[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={chartColors.primary} stopOpacity={0.3} />
            <stop offset="100%" stopColor={chartColors.primary} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartColors.grid} />
        <XAxis dataKey="date" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis
          tick={{ fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `₹${Number(v) / 1000}K`}
        />
        <Tooltip formatter={(v) => formatINR(Number(v))} />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke={chartColors.primary}
          strokeWidth={2}
          fill="url(#revFill)"
          dot={{ r: 4, fill: chartColors.primary }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
