import Card from "./Card.jsx";

export default function MetricCard({ label, value, icon: Icon, detail, tone = "brand", className = "" }) {
  const iconTones = {
    brand: "bg-brand-50 text-brand-600",
    success: "bg-success-soft text-success",
    warning: "bg-warning-soft text-warning",
    critical: "bg-critical-soft text-critical",
    neutral: "bg-slate-100 text-slate-600",
  };

  return (
    <Card className={`p-5 ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-muted">{label}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-ink" aria-live="polite">
            {value ?? "—"}
          </p>
        </div>
        {Icon && (
          <span className={`grid size-10 place-items-center rounded-xl ${iconTones[tone]}`}>
            <Icon aria-hidden="true" className="size-5" />
          </span>
        )}
      </div>
      {detail && <p className="mt-3 text-xs leading-5 text-muted">{detail}</p>}
    </Card>
  );
}
