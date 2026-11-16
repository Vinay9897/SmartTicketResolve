export default function Skeleton({ className = "", rounded = "rounded-md" }) {
  return (
    <span
      aria-hidden="true"
      className={`block animate-pulse bg-slate-200 ${rounded} ${className}`}
    />
  );
}

export function TableSkeleton({ rows = 4, columns = 4 }) {
  return (
    <div aria-label="Loading table" role="status" className="grid gap-4 p-5">
      {Array.from({ length: rows }, (_, row) => (
        <div key={row} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }, (_, column) => (
            <Skeleton key={column} className="h-4 w-full" />
          ))}
        </div>
      ))}
      <span className="sr-only">Loading</span>
    </div>
  );
}
