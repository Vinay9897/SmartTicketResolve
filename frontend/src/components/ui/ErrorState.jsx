import { AlertCircle } from "lucide-react";
import Button from "./Button.jsx";

export default function ErrorState({
  title = "We couldn’t load this content",
  description = "Try again in a moment. If the problem continues, contact your administrator.",
  onRetry,
  className = "",
}) {
  return (
    <div className={`flex min-h-48 flex-col items-center justify-center px-6 py-10 text-center ${className}`} role="alert">
      <span className="mb-4 grid size-11 place-items-center rounded-full bg-critical-soft text-critical">
        <AlertCircle aria-hidden="true" className="size-5" />
      </span>
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm leading-6 text-muted">{description}</p>
      {onRetry && (
        <Button className="mt-5" onClick={onRetry} variant="secondary">
          Try again
        </Button>
      )}
    </div>
  );
}
