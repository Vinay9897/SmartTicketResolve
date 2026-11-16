export default function Card({ className = "", children, ...props }) {
  return (
    <section
      className={`rounded-xl border border-line bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] ${className}`}
      {...props}
    >
      {children}
    </section>
  );
}

export function CardHeader({ title, description, action, className = "" }) {
  return (
    <div className={`flex items-start justify-between gap-4 px-5 pb-4 pt-5 ${className}`}>
      <div className="min-w-0">
        <h2 className="text-sm font-semibold text-ink">{title}</h2>
        {description && <p className="mt-1 text-xs leading-5 text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}
