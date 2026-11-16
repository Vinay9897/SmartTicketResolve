import { LoaderCircle } from "lucide-react";

export default function AuthLoadingState() {
  return (
    <main className="grid min-h-screen place-items-center bg-canvas px-4">
      <div aria-live="polite" className="flex items-center gap-3 text-sm font-medium text-slate-600" role="status">
        <LoaderCircle aria-hidden="true" className="size-5 animate-spin text-brand-600" />
        Restoring your secure session...
      </div>
    </main>
  );
}
