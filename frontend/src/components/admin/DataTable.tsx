import type { ReactNode } from "react";

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
    return <p className="text-sm text-slate-500 py-8 text-center">No records found.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-slate-500 border-b">
            {columns.map((col) => (
              <th key={String(col.key)} className="py-2 pr-4 font-medium">{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              onClick={() => onRowClick?.(row)}
              className={`border-b last:border-0 ${onRowClick ? "cursor-pointer hover:bg-cream-100" : ""}`}
            >
              {columns.map((col) => (
                <td key={String(col.key)} className="py-3 pr-4 text-slate-700">
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
