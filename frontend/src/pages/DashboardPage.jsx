import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileText,
  ListFilter,
  Plus,
  TicketCheck,
  UsersRound,
} from "lucide-react";
import { Link, useOutletContext } from "react-router-dom";
import Card, { CardHeader } from "../components/ui/Card.jsx";
import { ChartCard } from "../components/ui/ChartCard.jsx";
import DataTable from "../components/ui/DataTable.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import MetricCard from "../components/ui/MetricCard.jsx";
import PageHeading from "../components/ui/PageHeading.jsx";
import EmployeeDashboard from "./employee/EmployeeDashboard.jsx";
import SupportDashboard from "./support/SupportDashboard.jsx";

const dashboardByRole = {
  EMPLOYEE: {
    title: "Your support overview",
    description: "Track your requests and see where support can help next.",
    action: { label: "Preview ticket creation", to: "/employee/tickets/create", icon: Plus },
    metrics: [
      { label: "My tickets", icon: FileText, tone: "brand" },
      { label: "Open", icon: Activity, tone: "warning" },
      { label: "In progress", icon: Clock3, tone: "brand" },
      { label: "Resolved", icon: CheckCircle2, tone: "success" },
    ],
    charts: [
      { title: "Ticket status", description: "A clear view of your requests by status." },
      { title: "Support activity", description: "Recent updates on your requests." },
    ],
    tickets: {
      title: "Recent tickets",
      description: "Your latest support requests will appear here.",
      emptyTitle: "No ticket data to display",
    },
  },
  SUPPORT_ENGINEER: {
    title: "Support operations",
    description: "Keep the queue moving and focus on the issues that need attention.",
    action: { label: "Preview ticket queue", to: "/support/tickets", icon: ListFilter },
    metrics: [
      { label: "Incoming", icon: FileText, tone: "brand" },
      { label: "Unassigned", icon: UsersRound, tone: "warning" },
      { label: "In progress", icon: Clock3, tone: "brand" },
      { label: "High priority", icon: AlertTriangle, tone: "critical" },
    ],
    charts: [
      { title: "Priority distribution", description: "Compare active workload by priority." },
      { title: "Tickets by category", description: "Understand the mix of incoming issues." },
    ],
    tickets: {
      title: "Ticket queue",
      description: "The most recently updated accessible tickets will appear here.",
      emptyTitle: "No queue data to display",
    },
  },
  ADMIN: {
    title: "Administration overview",
    description: "Monitor ticket health and keep your support organization on track.",
    action: { label: "Preview user management", to: "/admin/users", icon: UsersRound },
    metrics: [
      { label: "Total tickets", icon: FileText, tone: "brand" },
      { label: "Open", icon: Activity, tone: "warning" },
      { label: "In progress", icon: Clock3, tone: "brand" },
      { label: "Resolved", icon: TicketCheck, tone: "success" },
    ],
    charts: [
      { title: "Tickets by status", description: "Review the distribution across ticket states." },
      { title: "Support team workload", description: "Compare ticket volume across teams." },
    ],
    tickets: {
      title: "Latest tickets",
      description: "Recent tickets across the organization will appear here.",
      emptyTitle: "No ticket data to display",
    },
  },
};

const ticketColumns = [
  { key: "ticket", header: "Ticket" },
  { key: "status", header: "Status" },
  { key: "priority", header: "Priority" },
  { key: "updatedAt", header: "Last updated", className: "whitespace-nowrap" },
];

function DashboardChart({ title, description }) {
  return (
    <ChartCard className="min-h-[284px]" title={title} description={description}>
      <EmptyState
        className="min-h-[196px] px-5 py-7"
        icon={Activity}
        title="Live chart data is not connected"
        description="This preview will show the chart when dashboard data is available."
      />
    </ChartCard>
  );
}

export default function DashboardPage() {
  const { role, user, previewMode } = useOutletContext();
  if (role === "EMPLOYEE" && !previewMode) {
    return <EmployeeDashboard employee={user} />;
  }
  if (role === "SUPPORT_ENGINEER" && !previewMode) {
    return <SupportDashboard engineer={user} />;
  }
  const dashboard = dashboardByRole[role] ?? dashboardByRole.EMPLOYEE;
  const ActionIcon = dashboard.action.icon;

  return (
    <div className="mx-auto grid max-w-[1480px] gap-6">
      <PageHeading
        actions={(
          <Link
            className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
            to={dashboard.action.to}
          >
            <ActionIcon aria-hidden="true" className="size-4" />
            {dashboard.action.label}
            <ArrowRight aria-hidden="true" className="size-4 opacity-80" />
          </Link>
        )}
        description={dashboard.description}
        eyebrow={previewMode ? "Dashboard preview" : "Dashboard"}
        title={dashboard.title}
      />

      <section aria-label="Dashboard metrics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {dashboard.metrics.map((metric) => (
          <MetricCard
            key={metric.label}
            className="min-h-[144px] transition-shadow duration-200 hover:shadow-md"
            detail="Waiting for live dashboard data."
            icon={metric.icon}
            label={metric.label}
            tone={metric.tone}
            value={null}
          />
        ))}
      </section>

      <section aria-label="Dashboard analytics" className="grid gap-4 xl:grid-cols-2">
        {dashboard.charts.map((chart) => (
          <DashboardChart key={chart.title} {...chart} />
        ))}
      </section>

      <Card className="overflow-hidden">
        <CardHeader
          action={
            <Link
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-brand-700 transition-colors hover:bg-brand-50"
              to={role === "EMPLOYEE" ? "/preview/my-tickets" : role === "ADMIN" ? "/preview/tickets" : "/preview/assigned-tickets"}
            >
              View all
              <ArrowRight aria-hidden="true" className="size-3.5" />
            </Link>
          }
          description={dashboard.tickets.description}
          title={dashboard.tickets.title}
        />
        <DataTable
          columns={ticketColumns}
          emptyDescription="Ticket records will be shown here once this preview is connected to the backend."
          emptyTitle={dashboard.tickets.emptyTitle}
          rows={[]}
        />
      </Card>
    </div>
  );
}
