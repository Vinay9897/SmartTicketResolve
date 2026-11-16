import { ChevronRight, Home } from "lucide-react";
import { Link } from "react-router-dom";

export default function Breadcrumbs({ items = [], homePath = "/design-system" }) {
  return (
    <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-xs text-muted">
      <Link aria-label="Home" className="rounded text-slate-500 hover:text-brand-600" to={homePath}>
        <Home aria-hidden="true" className="size-3.5" />
      </Link>
      {items.map((item, index) => {
        const current = index === items.length - 1;
        return (
          <span className="flex min-w-0 items-center gap-1.5" key={`${item.label}-${index}`}>
            <ChevronRight aria-hidden="true" className="size-3 shrink-0 text-slate-400" />
            {item.to && !current ? (
              <Link className="truncate hover:text-brand-600" to={item.to}>{item.label}</Link>
            ) : (
              <span aria-current={current ? "page" : undefined} className={`truncate ${current ? "font-medium text-slate-700" : ""}`}>
                {item.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
