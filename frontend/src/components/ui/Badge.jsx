const styles = {
  neutral: "bg-slate-100 text-slate-700 ring-slate-200",
  info: "bg-blue-50 text-blue-700 ring-blue-100",
  success: "bg-success-soft text-success ring-green-100",
  warning: "bg-warning-soft text-warning ring-amber-100",
  critical: "bg-critical-soft text-critical ring-red-100",
  ai: "bg-ai-soft text-ai ring-purple-100",
  open: "bg-blue-50 text-blue-700 ring-blue-100",
  in_progress: "bg-brand-50 text-brand-700 ring-brand-100",
  waiting_for_employee: "bg-warning-soft text-warning ring-amber-100",
  resolved: "bg-success-soft text-success ring-green-100",
  closed: "bg-slate-100 text-slate-600 ring-slate-200",
  low: "bg-slate-100 text-slate-700 ring-slate-200",
  medium: "bg-blue-50 text-blue-700 ring-blue-100",
  high: "bg-warning-soft text-warning ring-amber-100",
};

function normalize(value) {
  return String(value ?? "neutral").toLowerCase().replaceAll(" ", "_");
}

export default function Badge({ variant = "neutral", children, className = "" }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium leading-none ring-1 ring-inset ${styles[variant] ?? styles.neutral} ${className}`}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }) {
  return <Badge variant={normalize(status)}>{String(status).replaceAll("_", " ")}</Badge>;
}

export function PriorityBadge({ priority }) {
  const variant = normalize(priority);
  return <Badge variant={variant === "critical" ? "critical" : variant}>{priority}</Badge>;
}
