import { useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  FileText,
  FolderKanban,
  UsersRound,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartCard } from "../components/ui/ChartCard.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import ErrorState from "../components/ui/ErrorState.jsx";
import MetricCard from "../components/ui/MetricCard.jsx";
import PageHeading from "../components/ui/PageHeading.jsx";
import Skeleton from "../components/ui/Skeleton.jsx";
import { getAdminDashboardData } from "../services/adminDashboardService.js";

const statusLabels = {
  OPEN: "Open",
  IN_PROGRESS: "In progress",
  WAITING_FOR_EMPLOYEE: "Waiting for employee",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

const statusColors = {
  OPEN: "#2563EB",
  IN_PROGRESS: "#4F46E5",
  WAITING_FOR_EMPLOYEE: "#D97706",
  RESOLVED: "#15803D",
  CLOSED: "#64748B",
};

const priorityColors = {
  LOW: "#64748B",
  MEDIUM: "#2563EB",
  HIGH: "#D97706",
  CRITICAL: "#DC2626",
};

const chartColors = ["#4F46E5", "#0EA5E9", "#F59E0B", "#16A34A", "#94A3B8", "#D946EF"];
const EMPTY_ROWS = Object.freeze([]);

function getErrorMessage(error) {
  const message = error.response?.data?.message;
  if (typeof message === "string" && message.trim()) return message;
  if (error.response?.status === 401) return "Your session has expired. Sign in again to view administrator reports.";
  if (error.response?.status === 403) return "Your account cannot access administrator reports.";
  if (error.isAxiosError && !error.response) {
    return "Could not connect to SmartResolve. Check your connection and try again.";
  }
  if (error.message) return error.message;
  return "Administrator dashboard data could not be loaded. Please try again.";
}

function humanize(value) {
  if (statusLabels[value]) return statusLabels[value];
  return value.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function DashboardSkeleton() {
  return (
    <div aria-label="Loading administrator dashboard" className="grid gap-6" role="status">
      <div>
        <Skeleton className="h-7 w-60" />
        <Skeleton className="mt-3 h-4 w-80 max-w-full" />
      </div>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
        {Array.from({ length: 5 }, (_, index) => (
          <div className="grid min-h-36 gap-5 rounded-xl border border-line bg-white p-5" key={index}>
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-36" />
          </div>
        ))}
      </section>
      <section className="grid gap-4 xl:grid-cols-2">
        {Array.from({ length: 4 }, (_, index) => (
          <div className="min-h-80 rounded-xl border border-line bg-white p-5" key={index}>
            <Skeleton className="h-5 w-48" />
            <Skeleton className="mt-8 h-56 w-full" />
          </div>
        ))}
      </section>
      <span className="sr-only">Loading administrator dashboard data</span>
    </div>
  );
}

function createChartRows(rows, kind) {
  return rows
    .map((row, index) => {
      const color = kind === "status"
        ? statusColors[row.name] ?? chartColors[index % chartColors.length]
        : kind === "priority"
          ? priorityColors[row.name] ?? chartColors[index % chartColors.length]
          : chartColors[index % chartColors.length];
      return {
        name: kind === "status" || kind === "priority" ? humanize(row.name) : row.name,
        count: row.count,
        color,
      };
    })
    .filter((row) => row.count > 0);
}

function DistributionChart({ title, description, rows = EMPTY_ROWS, kind, icon: Icon }) {
  const data = createChartRows(rows, kind);

  return (
    <ChartCard className="min-h-[340px]" description={description} title={title}>
      {data.length ? (
        <div aria-label={`${title} chart`} className="h-[270px] px-3 pb-5" role="img">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="count" innerRadius={62} nameKey="name" outerRadius={94} paddingAngle={3}>
                {data.map((entry) => <Cell fill={entry.color} key={entry.name} />)}
              </Pie>
              <Tooltip
                contentStyle={{ border: "1px solid #E2E8F0", borderRadius: 10, fontSize: 12 }}
                formatter={(value, name) => [`${value} tickets`, name]}
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
          className="min-h-[260px]"
          description="This distribution will appear when tickets are available."
          icon={Icon}
          title={`No ${title.toLowerCase()} data`}
        />
      )}
    </ChartCard>
  );
}

function VolumeChart({ title, description, rows = EMPTY_ROWS, icon: Icon }) {
  const data = createChartRows(rows, "volume");
  const chartHeight = Math.max(260, data.length * 38);

  return (
    <ChartCard className="min-h-[340px]" description={description} title={title}>
      {data.length ? (
        <div aria-label={`${title} chart`} className="max-h-[560px] overflow-y-auto px-3 pb-5" role="img">
          <div style={{ height: chartHeight }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical" margin={{ top: 8, right: 24, bottom: 4, left: 0 }}>
                <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" horizontal={false} />
                <XAxis
                  allowDecimals={false}
                  axisLine={false}
                  tick={{ fill: "#64748B", fontSize: 11 }}
                  tickLine={false}
                  type="number"
                />
                <YAxis
                  axisLine={false}
                  dataKey="name"
                  tick={{ fill: "#64748B", fontSize: 11 }}
                  tickFormatter={(value) => (value.length > 20 ? `${value.slice(0, 19)}…` : value)}
                  tickLine={false}
                  type="category"
                  width={145}
                />
                <Tooltip
                  contentStyle={{ border: "1px solid #E2E8F0", borderRadius: 10, fontSize: 12 }}
                  formatter={(value) => [`${value} tickets`, "Volume"]}
                />
                <Bar dataKey="count" maxBarSize={24} radius={[0, 5, 5, 0]}>
                  {data.map((entry) => <Cell fill={entry.color} key={entry.name} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <EmptyState
          className="min-h-[260px]"
          description="This distribution will appear when tickets are available."
          icon={Icon}
          title={`No ${title.toLowerCase()} data`}
        />
      )}
    </ChartCard>
  );
}

export default function AdminDashboard() {
  const [retryCount, setRetryCount] = useState(0);
  const [result, setResult] = useState({ requestId: -1, status: "loading", data: null, error: "" });
  const isLoading = result.requestId !== retryCount;
  const error = !isLoading && result.status === "error" ? result.error : "";
  const dashboard = !isLoading && result.status === "success" ? result.data : null;

  useEffect(() => {
    const controller = new AbortController();
    getAdminDashboardData({ signal: controller.signal })
      .then((data) => {
        setResult({ requestId: retryCount, status: "success", data, error: "" });
      })
      .catch((requestError) => {
        if (!controller.signal.aborted) {
          setResult({
            requestId: retryCount,
            status: "error",
            data: null,
            error: getErrorMessage(requestError),
          });
        }
      });

    return () => controller.abort();
  }, [retryCount]);

  if (isLoading) return <DashboardSkeleton />;
  if (error) {
    return (
      <div className="mx-auto max-w-3xl">
        <PageHeading
          description="Organization-wide ticket metrics and workload from administrator reporting APIs."
          eyebrow="Administrator dashboard"
          title="Administration overview"
        />
        <ErrorState
          className="mt-6"
          description={error}
          onRetry={() => setRetryCount((count) => count + 1)}
          title="Dashboard reports could not be loaded"
        />
      </div>
    );
  }

  const { summary, statuses, priorities, categories } = dashboard;
  const metrics = [
    { label: "Total tickets", value: summary.totalTickets, icon: FileText, tone: "brand" },
    { label: "Open tickets", value: summary.openTickets, icon: Activity, tone: "warning" },
    { label: "In progress", value: summary.inProgressTickets, icon: Clock3, tone: "brand" },
    { label: "Resolved", value: summary.resolvedTickets, icon: CheckCircle2, tone: "success" },
    { label: "Closed", value: summary.closedTickets, icon: CheckCircle2, tone: "neutral" },
  ];

  return (
    <div className="mx-auto grid max-w-[1480px] gap-6">
      <PageHeading
        description="Monitor ticket health and support workload across the organization."
        eyebrow="Administrator dashboard"
        title="Administration overview"
      />

      <section aria-label="Organization ticket metrics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
        {metrics.map((metric) => (
          <MetricCard
            className="min-h-[144px] transition-shadow duration-200 hover:shadow-md"
            detail="Reported from all tickets."
            icon={metric.icon}
            key={metric.label}
            label={metric.label}
            tone={metric.tone}
            value={metric.value}
          />
        ))}
      </section>

      <section aria-label="Ticket analytics" className="grid gap-4 xl:grid-cols-2">
        <DistributionChart
          description="All tickets grouped by their current workflow status."
          icon={Activity}
          kind="status"
          rows={statuses}
          title="Ticket status distribution"
        />
        <DistributionChart
          description="All tickets grouped by their assigned priority."
          icon={AlertTriangle}
          kind="priority"
          rows={priorities}
          title="Priority distribution"
        />
        <VolumeChart
          description="Ticket counts by category, including uncategorized tickets."
          icon={FolderKanban}
          rows={categories}
          title="Tickets by category"
        />
        <VolumeChart
          description="Current ticket volume per support team, including unassigned tickets."
          icon={UsersRound}
          rows={summary.ticketsBySupportTeam}
          title="Tickets by support team"
        />
      </section>
    </div>
  );
}
