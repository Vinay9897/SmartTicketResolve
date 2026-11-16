import { Search } from "lucide-react";

export default function SearchInput({
  id,
  label = "Search",
  visibleLabel = false,
  placeholder = "Search...",
  className = "",
  ...props
}) {
  return (
    <div className={`${visibleLabel ? "grid gap-1.5" : ""} ${className}`}>
      <label className={visibleLabel ? "text-sm font-medium text-slate-700" : "sr-only"} htmlFor={id}>
        {label}
      </label>
      <div className="relative">
        <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <input
          className="min-h-11 w-full rounded-lg border border-line bg-white pl-9 pr-3 text-sm text-ink placeholder:text-slate-400 transition-shadow focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100"
          id={id}
          placeholder={placeholder}
          type="search"
          {...props}
        />
      </div>
    </div>
  );
}
