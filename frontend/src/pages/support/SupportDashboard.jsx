import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  ListFilter,
  Ticket,
  UserCheck,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Link } from "react-router-dom";
import { ChartCard } from "../../components/ui/ChartCard.jsx";
import Card, { CardHeader } from "../../components/ui/Card.jsx";
import DataTable from "../../components/ui/DataTable.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import ErrorState from "../../components/ui/ErrorState.jsx";
import MetricCard from "../../components/ui/MetricCard.jsx";
import PageHeading from "../../components/ui/PageHeading.jsx";
import { PriorityBadge, StatusBadge } from "../../components/ui/Badge.jsx";
import Skeleton from "../../components/ui/Skeleton.jsx";
import { getAllSupportTickets } from "../../services/ticketService.js";

const priorityColors = {
  LOW: "#64748B",
  MEDIUM: "#2563EB",
  HIGH: "#D97706",
  CRITICAL: "#DC2626",
};

const priorities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const EMPTY_TICKETS = Object.freeze([]);

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function getErrorMessage(error) {
  const message = error.response?.data?.message;
  if (typeof message === "string" && message.trim()) return message;
  if (error.response?.status === 401) return "Your session has expired. Sign in again to view support tickets.";
  if (error.response?.status === 403) return "Your account cannot access the support ticket queue.";
  if (error.isAxiosError && !error.response) {
    return "Could not connect to SmartResolve. Check your connection and try again.";
  }
  if (!error.isAxiosError && error.message) return error.message;
  return "Support dashboard data could not be loaded. Please try again.";
}

function SupportDashboardSkeleton() {
  return (
    <div aria-label="Loading support dashboard" className="grid gap-6" role="status">
      <div>
        <Skeleton className="h-7 w-60" />
        <Skeleton className="mt-3 h-4 w-80 max-w-full" />
      </div>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <Card className="grid min-h-36 gap-5 p-5" key={index}>
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-36" />
          </Card>
        ))}
      </section>
      <section className="grid gap-4 xl:grid-cols-2">
        <Card className="min-h-80 p-5">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="mt-8 h-56 w-full" />
        </Card>
        <Card className="min-h-80 p-5">
          <Skeleton className="h-5 w-48" />
          <div className="mt-6 grid gap-5">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton className="h-5 w-full" key={index} />
            ))}
          </div>
        </Card>
      </section>
      <span className="sr-only">Loading support operations dashboard</span>
    </div>
  );
}

const columns = [
  {
    key: "title",
    header: "Ticket",
    render: (ticket) => (
      <div className="min-w-40">
        <p className="truncate font-medium text-slate-800">{ticket.title}</p>
        <p className="mt-1 text-[11px] text-muted">#{ticket.id.slice(0, 8)}</p>
      </div>
    ),
  },
  {
    key: "priority",
    header: "Priority",
    render: (ticket) => <PriorityBadge priority={ticket.priority} />,
  },
  {
    key: "status",
    header: "Status",
    render: (ticket) => <StatusBadge status={ticket.status} />,
  },
  {
    key: "updatedAt",
    header: "Updated",
    className: "whitespace-nowrap",
    render: (ticket) => formatDate(ticket.updatedAt),
  },
];

function PriorityDistribution({ tickets }) {
  const data = useMemo(() => priorities.map((priority) => ({
    name: priority,
    count: tickets.filter((ticket) => ticket.priority === priority).length,
    color: priorityColors[priority],
  })), [tickets]);

  return (
    <ChartCard
      className="min-h-[340px]"
      description="Priority levels across tickets in your accessible queue."
      title="Tickets by priority"
    >
      {tickets.length === 0 ? (
        <EmptyState
          className="min-h-[240px]"
          icon={AlertTriangle}
          title="No ticket priority data"
          description="Priority distribution will appear when tickets are available in your queue."
        />
      ) : (
        <div aria-label="Tickets by priority chart" className="h-[270px] px-4 pb-5" role="img">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
              <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: "#64748B", fontSize: 11 }} />
              <YAxis allowDecimals={false} width={34} tickLine={false} axisLine={false} tick={{ fill: "#64748B", fontSize: 11 }} />
              <Tooltip
                contentStyle={{ border: "1px solid #E2E8F0", borderRadius: 10, fontSize: 12 }}
                formatter={(value) => [`${value} tickets`, "Volume"]}
                labelFormatter={(label) => `Priority: ${label}`}
              />
              <Bar dataKey="count" maxBarSize={48} radius={[5, 5, 0, 0]}>
                {data.map((entry) => <Cell fill={entry.color} key={entry.name} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartCard>
  );
}

export default function SupportDashboard({ engineer }) {
  const [retryCount, setRetryCount] = useState(0);
  const [result, setResult] = useState({ requestId: -1, status: "loading", tickets: [] });
  const isLoading = result.requestId !== retryCount;
  const error = !isLoading && result.status === "error" ? result.error : "";
  const tickets = !isLoading && result.status === "success" ? result.tickets : EMPTY_TICKETS;

  useEffect(() => {
    const controller = new AbortController();
    getAllSupportTickets({ signal: controller.signal })
      .then((items) => {
        setResult({ requestId: retryCount, status: "success", tickets: items });
      })
      .catch((requestError) => {
        if (!controller.signal.aborted) {
          setResult({
            requestId: retryCount,
            status: "error",
            tickets: [],
            error: getErrorMessage(requestError),
          });
        }
      });

    return () => controller.abort();
  }, [retryCount]);

  const metrics = useMemo(() => {
    const assignedToEngineer = tickets.filter((ticket) => ticket.assignedToId === engineer.id);
    return {
      incoming: tickets.length,
      assigned: assignedToEngineer.length,
      open: tickets.filter((ticket) => ticket.status === "OPEN").length,
      inProgress: tickets.filter((ticket) => ticket.status === "IN_PROGRESS").length,
      resolved: tickets.filter((ticket) => ticket.status === "RESOLVED").length,
      highPriority: tickets.filter((ticket) => ticket.priority === "HIGH" || ticket.priority === "CRITICAL").length,
      recentAssigned: assignedToEngineer
        .sort((left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt))
        .slice(0, 5),
    };
  }, [tickets, engineer.id]);

  if (isLoading) return <SupportDashboardSkeleton />;

  return (
    <div className="mx-auto grid max-w-[1480px] gap-6">
      <PageHeading
        actions={(
          <Link
            className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
            to="/support/tickets"
          >
            <ListFilter aria-hidden="true" className="size-4" />
            Open ticket queue
            <ArrowRight aria-hidden="true" className="size-4 opacity-80" />
          </Link>
        )}
        description="Monitor your accessible queue, focus on urgent work, and track assigned requests."
        eyebrow="Support operations"
        title={`Welcome back, ${engineer.name}`}
      />

      {error ? (
        <ErrorState
          description={error}
          onRetry={() => setRetryCount((count) => count + 1)}
          title="Support dashboard could not be loaded"
        />
      ) : (
        <>
          <section aria-label="Support ticket metrics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <MetricCard
              className="min-h-[144px] transition-shadow duration-200 hover:shadow-md"
              detail="Directly assigned, team, and unassigned tickets you can access."
              icon={Ticket}
              label="Incoming tickets"
              tone="brand"
              value={metrics.incoming}
            />
            <MetricCard
              className="min-h-[144px] transition-shadow duration-200 hover:shadow-md"
              detail="Tickets currently assigned directly to you."
              icon={UserCheck}
              label="Assigned to you"
              tone="brand"
              value={metrics.assigned}
            />
            <MetricCard
              className="min-h-[144px] transition-shadow duration-200 hover:shadow-md"
              detail="Accessible tickets awaiting work."
              icon={Activity}
              label="Open tickets"
              tone="warning"
              value={metrics.open}
            />
            <MetricCard
              className="min-h-[144px] transition-shadow duration-200 hover:shadow-md"
              detail="Accessible tickets being worked on."
              icon={Clock3}
              label="In progress"
              tone="brand"
              value={metrics.inProgress}
            />
            <MetricCard
              className="min-h-[144px] transition-shadow duration-200 hover:shadow-md"
              detail="Accessible tickets marked resolved."
              icon={CheckCircle2}
              label="Resolved"
              tone="success"
              value={metrics.resolved}
            />
            <MetricCard
              className="min-h-[144px] border-red-200 transition-shadow duration-200 hover:shadow-md"
              detail="High and critical priority in your accessible queue."
              icon={AlertTriangle}
              label="High priority"
              tone="critical"
              value={metrics.highPriority}
            />
          </section>

          <section aria-label="Queue analytics and assigned tickets" className="grid gap-4 xl:grid-cols-2">
            <PriorityDistribution tickets={tickets} />
            <Card className="overflow-hidden">
              <CardHeader
                action={(
                  <Link
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-brand-700 transition-colors hover:bg-brand-50"
                    to="/support/tickets"
                  >
                    View queue
                    <ArrowRight aria-hidden="true" className="size-3.5" />
                  </Link>
                )}
                description="Your five most recently updated assigned tickets."
                title="Recent assigned tickets"
              />
              {metrics.recentAssigned.length ? (
                <DataTable columns={columns} rows={metrics.recentAssigned} />
              ) : (
                <EmptyState
                  className="min-h-[260px]"
                  icon={UserCheck}
                  title="No tickets assigned to you"
                  description={tickets.length
                    ? "Tickets assigned directly to you will appear here."
                    : "There are no accessible tickets in your queue right now."}
                  action={(
                    <Link
                      className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-line bg-white px-3 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
                      to="/support/tickets"
                    >
                      Open ticket queue
                      <ArrowRight aria-hidden="true" className="size-3.5" />
                    </Link>
                  )}
                />
              )}
            </Card>
          </section>
        </>
      )}
    </div>
  );
}
