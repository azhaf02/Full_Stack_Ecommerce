import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";

interface Slice {
  status: string;
  count: number;
  color: string;
}

export default function OrderStatusChart({ data }: { data: Slice[] }) {
  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="flex items-center h-full gap-4">
      {/* Donut with total in the middle */}
      <div className="relative w-1/2 h-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="count" nameKey="status" innerRadius="60%" outerRadius="90%" paddingAngle={2}>
              {data.map((d) => (
                <Cell key={d.status} fill={d.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-xs text-slate-500">Total</span>
          <span className="text-lg font-bold text-slate-800">{total}</span>
        </div>
      </div>

      {/* Legend */}
      <ul className="w-1/2 space-y-3">
        {data.map((d) => (
          <li key={d.status} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-slate-600">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
              {d.status}
            </span>
            <span className="font-medium">{Math.round((d.count / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
