import { LoaderCircle } from "lucide-react";

export default function Spinner({ label = "Loading", className = "" }) {
  return (
    <span aria-label={label} aria-live="polite" className={`inline-flex items-center gap-2 text-sm text-muted ${className}`} role="status">
      <LoaderCircle aria-hidden="true" className="size-4 animate-spin text-brand-600" />
      <span>{label}</span>
    </span>
  );
}
