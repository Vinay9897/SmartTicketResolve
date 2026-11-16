import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({ page, pageSize, totalItems, onPageChange, itemLabel = "tickets" }) {
  const totalPages = Math.ceil(totalItems / pageSize);
  const firstItem = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastItem = Math.min(page * pageSize, totalItems);

  return (
    <nav aria-label="Pagination" className="flex flex-col gap-3 border-t border-line px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-muted" aria-live="polite">
        Showing <span className="font-medium text-slate-700">{firstItem}-{lastItem}</span> of{" "}
        <span className="font-medium text-slate-700">{totalItems}</span> {itemLabel}
      </p>
      <div className="flex items-center gap-2">
        <button
          aria-label="Previous page"
          className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-line bg-white px-3 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-50"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          type="button"
        >
          <ChevronLeft aria-hidden="true" className="size-3.5" />
          Previous
        </button>
        <span aria-current="page" className="min-w-16 text-center text-xs font-medium text-slate-600">
          Page {totalPages === 0 ? 0 : page} of {totalPages}
        </span>
        <button
          aria-label="Next page"
          className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-line bg-white px-3 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-50"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          type="button"
        >
          Next
          <ChevronRight aria-hidden="true" className="size-3.5" />
        </button>
      </div>
    </nav>
  );
}
