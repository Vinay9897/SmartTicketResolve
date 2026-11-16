import { LifeBuoy, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

export default function AuthLayout({ title, description, children }) {
  return (
    <main className="min-h-screen bg-canvas px-4 py-8 sm:px-6 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(380px,480px)] lg:items-center lg:gap-16 lg:px-12">
      <section className="mx-auto hidden w-full max-w-xl lg:block">
        <Link aria-label="SmartResolve sign-in" className="inline-flex items-center gap-3" to="/login">
          <span className="grid size-11 place-items-center rounded-xl bg-brand-600 text-white shadow-sm">
            <LifeBuoy aria-hidden="true" className="size-6" />
          </span>
          <span className="text-lg font-bold tracking-tight text-ink">SmartResolve</span>
        </Link>
        <p className="mt-12 text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">
          IT support, made clearer
        </p>
        <h1 className="mt-4 max-w-lg text-4xl font-semibold leading-tight tracking-tight text-ink">
          A thoughtful workspace for every support request.
        </h1>
        <p className="mt-5 max-w-lg text-base leading-7 text-muted">
          Sign in to follow your tickets, collaborate with support, and keep work moving.
        </p>
        <div className="mt-10 inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-2 text-xs font-medium text-slate-600 shadow-sm">
          <ShieldCheck aria-hidden="true" className="size-4 text-success" />
          Your session is protected with secure token authentication
        </div>
      </section>

      <section className="mx-auto w-full max-w-[440px]">
        <div className="mb-6 flex items-center justify-center gap-2 lg:hidden">
          <span className="grid size-9 place-items-center rounded-xl bg-brand-600 text-white">
            <LifeBuoy aria-hidden="true" className="size-5" />
          </span>
          <span className="text-base font-bold tracking-tight text-ink">SmartResolve</span>
        </div>
        <div className="rounded-2xl border border-line bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.07)] sm:p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold tracking-tight text-ink">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
          </div>
          {children}
        </div>
        <p className="mt-5 text-center text-xs text-muted">
          SmartResolve · Secure IT support workspace
        </p>
      </section>
    </main>
  );
}
