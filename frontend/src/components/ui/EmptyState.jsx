import { Inbox } from "lucide-react";

export default function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className = "",
}) {
  return (
    <div className={`flex min-h-48 flex-col items-center justify-center px-6 py-10 text-center ${className}`}>
      <span className="mb-4 grid size-11 place-items-center rounded-full bg-slate-100 text-slate-500">
        <Icon aria-hidden="true" className="size-5" />
      </span>
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-sm leading-6 text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
