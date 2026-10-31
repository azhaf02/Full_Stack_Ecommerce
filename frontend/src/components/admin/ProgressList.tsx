interface ProgressItem {
  label: string;
  value: number; // percentage 0–100
}

export default function ProgressList({ items }: { items: ProgressItem[] }) {
  return (
    <ul className="space-y-6 pt-2">
      {items.map((item) => (
        <li key={item.label}>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-600">{item.label}</span>
            <span className="font-medium text-slate-800">{item.value}%</span>
          </div>
          <div className="w-full h-2 bg-slate-200 rounded-full">
            <div
              className="h-2 bg-primary-600 rounded-full"
              style={{ width: `${item.value}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
