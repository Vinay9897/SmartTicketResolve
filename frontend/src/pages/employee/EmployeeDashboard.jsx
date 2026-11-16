import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileText,
  MessageSquareText,
  Plus,
} from "lucide-react";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
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
import { getAllMyTickets, getRecentMyTicketActivity } from "../../services/ticketService.js";

const ticketStatuses = [
  { value: "OPEN", label: "Open", color: "#2563EB" },
  { value: "IN_PROGRESS", label: "In progress", color: "#4F46E5" },
  { value: "WAITING_FOR_EMPLOYEE", label: "Waiting for you", color: "#D97706" },
  { value: "RESOLVED", label: "Resolved", color: "#15803D" },
  { value: "CLOSED", label: "Closed", color: "#64748B" },
];

const ticketColumns = [
  {
    key: "title",
    header: "Ticket",
    render: (ticket) => (
      <Link
        className="block min-w-48 rounded font-medium text-slate-800 hover:text-brand-700"
        to={`/employee/tickets/${ticket.id}`}
      >
        <span className="block truncate">{ticket.title}</span>
        <span className="mt-1 block text-[11px] font-normal text-muted">
          #{ticket.id.slice(0, 8)}
        </span>
      </Link>
    ),
  },
  {
    key: "status",
    header: "Status",
    render: (ticket) => <StatusBadge status={ticket.status} />,
  },
  {
    key: "priority",
    header: "Priority",
    render: (ticket) => <PriorityBadge priority={ticket.priority} />,
  },
  {
    key: "createdAt",
    header: "Submitted",
    className: "whitespace-nowrap",
    render: (ticket) => formatDate(ticket.createdAt),
  },
];

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function getErrorMessage(error) {
  const message = error.response?.data?.message;
  if (typeof message === "string" && message.trim()) return message;
  if (error.isAxiosError && !error.response) {
    return "Could not connect to SmartResolve. Check your connection and try again.";
  }
  if (!error.isAxiosError && error.message) return error.message;
  return "Your tickets could not be loaded. Please try again.";
}

function DashboardSkeleton({ employeeName }) {
  return (
    <div aria-label="Loading employee dashboard" className="grid gap-6" role="status">
      <div>
        <Skeleton className="h-7 w-60" />
        <Skeleton className="mt-3 h-4 w-80 max-w-full" />
      </div>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {ticketStatuses.slice(0, 4).map((status) => (
          <Card className="grid min-h-36 gap-5 p-5" key={status.value}>
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-36" />
          </Card>
        ))}
      </section>
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <Card className="min-h-80 p-5">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="mx-auto mt-8 size-48 rounded-full" />
        </Card>
        <Card className="min-h-80 p-5">
          <Skeleton className="h-4 w-40" />
          <div className="mt-6 grid gap-5">
            {Array.from({ length: 4 }, (_, index) => (
              <div className="flex gap-3" key={index}>
                <Skeleton className="size-8 shrink-0 rounded-full" />
                <div className="grid flex-1 gap-2">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </section>
      <Card className="min-h-72">
        <CardHeader title="Recently submitted tickets" />
        <div className="grid gap-5 px-5 pb-5">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton className="h-5 w-full" key={index} />
          ))}
        </div>
      </Card>
      <span className="sr-only">Loading dashboard for {employeeName}</span>
    </div>
  );
}

function TicketStatusSummary({ tickets }) {
  const statusData = useMemo(() => ticketStatuses
    .map((status) => ({
      name: status.label,
      count: tickets.filter((ticket) => ticket.status === status.value).length,
      color: status.color,
    }))
    .filter((status) => status.count > 0), [tickets]);

  return (
    <ChartCard
      className="min-h-[330px]"
      description="Your tickets grouped by their current status."
      title="Ticket status summary"
    >
      {statusData.length ? (
        <div aria-label="Ticket status distribution chart" className="h-[260px] px-3 pb-5" role="img">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={statusData}
                dataKey="count"
                innerRadius={62}
                nameKey="name"
                outerRadius={92}
                paddingAngle={3}
              >
                {statusData.map((entry) => (
                  <Cell fill={entry.color} key={entry.name} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ border: "1px solid #E2E8F0", borderRadius: 10, fontSize: 12 }}
                formatter={(value) => [`${value} tickets`, "Count"]}
              />
              <Legend
                align="center"
                iconSize={8}
                iconType="circle"
                wrapperStyle={{ fontSize: 11, paddingTop: 4 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <EmptyState
          className="min-h-[250px]"
          icon={Activity}
          title="No ticket status data yet"
          description="Once you submit a ticket, its status will be summarized here."
        />
      )}
    </ChartCard>
  );
}

function RecentActivity({ tickets }) {
  const [retryCount, setRetryCount] = useState(0);
  const requestKey = `${retryCount}:${tickets.map((ticket) => `${ticket.id}:${ticket.updatedAt}`).join(",")}`;
  const [result, setResult] = useState({ requestKey: "", status: "loading", activity: [] });
  const isLoading = result.requestKey !== requestKey;
  const error = isLoading || result.status !== "error" ? "" : result.error;
  const activity = isLoading || result.status !== "success" ? [] : result.activity;

  useEffect(() => {
    const controller = new AbortController();
    getRecentMyTicketActivity(tickets, { signal: controller.signal })
      .then((items) => {
        setResult({ requestKey, status: "success", activity: items });
      })
      .catch((requestError) => {
        if (!controller.signal.aborted) {
          setResult({
            requestKey,
            status: "error",
            activity: [],
            error: getErrorMessage(requestError),
          });
        }
      });

    return () => controller.abort();
  }, [requestKey, tickets]);

  return (
    <Card className="min-h-[330px]">
      <CardHeader
        description="Recent public comments on your tickets."
        title="Recent ticket activity"
      />
      {isLoading ? (
        <div aria-label="Loading ticket activity" className="grid gap-5 px-5 pb-6" role="status">
          {Array.from({ length: 4 }, (_, index) => (
            <div className="flex gap-3" key={index}>
              <Skeleton className="size-8 shrink-0 rounded-full" />
              <div className="grid flex-1 gap-2">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <ErrorState
          className="min-h-[245px]"
          description={error}
          onRetry={() => setRetryCount((count) => count + 1)}
          title="Ticket activity is unavailable"
        />
      ) : activity.length ? (
        <ol aria-label="Recent ticket comments" className="grid gap-5 px-5 pb-6">
          {activity.map((item) => (
            <li className="flex gap-3" key={item.id}>
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-700">
                <MessageSquareText aria-hidden="true" className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <p className="text-xs font-semibold text-ink">{item.userName}</p>
                  <time className="text-[11px] text-muted" dateTime={item.createdAt}>
                    {formatDateTime(item.createdAt)}
                  </time>
                </div>
                <Link
                  className="mt-1 block truncate text-xs font-medium text-brand-700 hover:text-brand-600"
                  to={`/employee/tickets/${item.ticketId}`}
                >
                  {item.ticketTitle}
                </Link>
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-600">{item.comment}</p>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <EmptyState
          className="min-h-[245px]"
          icon={MessageSquareText}
          title={tickets.length ? "No comments yet" : "No activity yet"}
          description={
            tickets.length
              ? "Support replies and your comments will appear here."
              : "Ticket conversations will appear here after you submit a request."
          }
        />
      )}
    </Card>
  );
}

export default function EmployeeDashboard({ employee }) {
  const [retryCount, setRetryCount] = useState(0);
  const [result, setResult] = useState({ requestId: -1, status: "loading", tickets: [] });
  const isLoading = result.requestId !== retryCount;
  const error = isLoading || result.status !== "error" ? "" : result.error;
  const tickets = useMemo(
    () => (isLoading || result.status !== "success" ? [] : result.tickets),
    [isLoading, result.status, result.tickets],
  );

  useEffect(() => {
    const controller = new AbortController();
    getAllMyTickets({ signal: controller.signal })
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

  const counts = useMemo(() => ({
    total: tickets.length,
    open: tickets.filter((ticket) => ticket.status === "OPEN").length,
    inProgress: tickets.filter((ticket) => ticket.status === "IN_PROGRESS").length,
    resolved: tickets.filter((ticket) => ticket.status === "RESOLVED").length,
  }), [tickets]);

  const recentTickets = useMemo(() => [...tickets]
    .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
    .slice(0, 5), [tickets]);

  const metrics = [
    { label: "Total tickets", value: counts.total, icon: FileText, tone: "brand" },
    { label: "Open tickets", value: counts.open, icon: Activity, tone: "warning" },
    { label: "In progress", value: counts.inProgress, icon: Clock3, tone: "brand" },
    { label: "Resolved", value: counts.resolved, icon: CheckCircle2, tone: "success" },
  ];

  if (isLoading) return <DashboardSkeleton employeeName={employee.name} />;

  return (
    <div className="mx-auto grid max-w-[1480px] gap-6">
      <PageHeading
        actions={(
          <Link
            className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
            to="/employee/tickets/create"
          >
            <Plus aria-hidden="true" className="size-4" />
            Create ticket
            <ArrowRight aria-hidden="true" className="size-4 opacity-80" />
          </Link>
        )}
        description="Here is the latest on your support requests."
        eyebrow="Employee dashboard"
        title={`Welcome back, ${employee.name}`}
      />

      {error ? (
        <ErrorState
          description={error}
          onRetry={() => setRetryCount((count) => count + 1)}
          title="Your dashboard could not be loaded"
        />
      ) : (
        <>
          <section aria-label="Ticket totals" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.map((metric) => (
              <MetricCard
                className="min-h-[144px] transition-shadow duration-200 hover:shadow-md"
                detail="Based on all your tickets."
                icon={metric.icon}
                key={metric.label}
                label={metric.label}
                tone={metric.tone}
                value={metric.value}
              />
            ))}
          </section>

          <section
            aria-label="Ticket status and recent activity"
            className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]"
          >
            <TicketStatusSummary tickets={tickets} />
            <RecentActivity tickets={tickets} />
          </section>

          <Card className="overflow-hidden">
            <CardHeader
              action={tickets.length > 0 ? (
                <Link
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-brand-700 transition-colors hover:bg-brand-50"
                  to="/employee/tickets"
                >
                  View all
                  <ArrowRight aria-hidden="true" className="size-3.5" />
                </Link>
              ) : null}
              description="Your five most recently submitted support requests."
              title="Recently submitted tickets"
            />
            <DataTable
              columns={ticketColumns}
              emptyDescription="Create a support ticket and it will appear here."
              emptyTitle="You haven't submitted any tickets"
              rows={recentTickets}
            />
          </Card>
        </>
      )}
    </div>
  );
}
