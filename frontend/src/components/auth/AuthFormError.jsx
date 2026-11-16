import { AlertCircle } from "lucide-react";

export default function AuthFormError({ message }) {
  if (!message) return null;
  return (
    <div
      className="flex items-start gap-2.5 rounded-lg border border-critical/20 bg-critical-soft px-3.5 py-3 text-sm text-critical"
      role="alert"
    >
      <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <p className="leading-5">{message}</p>
    </div>
  );
}
