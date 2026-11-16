import { CheckCircle2, X, XCircle } from "lucide-react";
import Button from "./Button.jsx";

export default function Toast({ message, type = "success", onClose }) {
  if (!message) return null;
  const isError = type === "error";
  const Icon = isError ? XCircle : CheckCircle2;

  return (
    <div
      aria-live={isError ? "assertive" : "polite"}
      className={`fixed bottom-5 right-5 z-[60] flex max-w-sm items-center gap-3 rounded-xl border bg-white px-4 py-3 shadow-lg ${isError ? "border-red-200" : "border-green-200"}`}
      role={isError ? "alert" : "status"}
    >
      <Icon aria-hidden="true" className={`size-5 shrink-0 ${isError ? "text-critical" : "text-success"}`} />
      <p className="flex-1 text-sm font-medium text-ink">{message}</p>
      <Button aria-label="Dismiss notification" className="size-8 min-h-8 px-0" onClick={onClose} variant="ghost">
        <X aria-hidden="true" className="size-4" />
      </Button>
    </div>
  );
}
