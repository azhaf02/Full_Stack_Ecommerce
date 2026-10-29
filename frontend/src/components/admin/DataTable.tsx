import type { ReactNode } from "react";
import { Inbox } from "lucide-react";

export interface Column<T> {
  key: keyof T;
  label: string;
  render?: (row: T) => ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  onRowClick?: (row: T) => void;
}

export default function DataTable<T>({ columns, rows, rowKey, onRowClick }: DataTableProps<T>) {
  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <span className="w-12 h-12 rounded-full bg-cream-200/70 flex items-center justify-center mb-3">
          <Inbox size={22} className="text-slate-400" />
        </span>
        <p className="text-sm font-medium text-slate-700">No records found</p>
        <p className="text-xs text-slate-500 mt-1">Try changing the search or filters.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left bg-cream-100/70 border-b">
            {columns.map((col) => (
              <th
                key={String(col.key)}
                className="py-3 px-4 text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              onClick={() => onRowClick?.(row)}
              className={`border-b last:border-0 transition-colors duration-150 hover:bg-cream-100/60 ${
                onRowClick ? "cursor-pointer" : ""
              }`}
            >
              {columns.map((col) => (
                <td key={String(col.key)} className="py-3.5 px-4 text-slate-700">
                  {col.render ? col.render(row) : String(row[col.key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
