import { ArrowLeft, Construction } from "lucide-react";
import { Link, useLocation, useParams } from "react-router-dom";
import EmptyState from "../components/ui/EmptyState.jsx";

const labels = {
  dashboard: "Dashboard",
  "my-tickets": "My Tickets",
  "create-ticket": "Create Ticket",
  "ticket-queue": "Ticket Queue",
  "assigned-tickets": "Assigned Tickets",
  tickets: "Tickets",
  users: "Users",
  categories: "Categories",
  "support-teams": "Support Teams",
};

const labelsByPath = {
  "/admin/categories": "Categories",
  "/admin/tickets": "Tickets",
  "/admin/teams": "Support Teams",
  "/admin/users": "Users",
  "/employee/dashboard": "Dashboard",
  "/employee/tickets": "My Tickets",
  "/employee/tickets/create": "Create Ticket",
  "/support/dashboard": "Dashboard",
  "/support/tickets": "Ticket Queue",
  "/support/tickets/assigned": "Assigned Tickets",
};

export default function PreviewPage() {
  const { page } = useParams();
  const { pathname } = useLocation();
  const title = labels[page] ?? labelsByPath[pathname] ??
    (/^\/employee\/tickets\/[^/]+$/.test(pathname) || /^\/support\/tickets\/[^/]+$/.test(pathname)
      ? "Ticket details"
      : "Workspace");

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-600">Screen preview</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink">{title}</h1>
      </div>
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white">
        <EmptyState
          icon={Construction}
          title={`${title} is planned for a later phase`}
          description="This phase builds the shared design system and reusable components. No backend data is fabricated or requested from the server."
          action={
            <Link
              className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-line px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              to="/design-system"
            >
              <ArrowLeft aria-hidden="true" className="size-4" />
              Explore design system
            </Link>
          }
        />
      </div>
    </div>
  );
}
