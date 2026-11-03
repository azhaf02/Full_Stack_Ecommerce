// Grey placeholder rows shown while a list is loading
export default function LoadingRows({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3 py-2" aria-label="Loading" role="status">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-4 animate-pulse">
          <div className="h-4 w-24 rounded bg-cream-200" />
          <div className="h-4 flex-1 rounded bg-cream-200/80" />
          <div className="h-4 w-20 rounded bg-cream-200" />
          <div className="h-5 w-16 rounded-full bg-cream-200/80" />
        </div>
      ))}
    </div>
  );
}
