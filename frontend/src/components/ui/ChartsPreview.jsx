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
import { ChartCard } from "./ChartCard.jsx";
import EmptyState from "./EmptyState.jsx";

const chartColors = ["#4F46E5", "#0EA5E9", "#F59E0B", "#16A34A", "#94A3B8"];

function StatusDonutChart({ data = [] }) {
  if (!data.length) {
    return <EmptyState title="Status data will appear here" description="Connect ticket data to view this chart." />;
  }

  return (
    <div className="h-64 px-4 pb-5">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="count" nameKey="name" innerRadius={58} outerRadius={84} paddingAngle={3}>
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={entry.color ?? chartColors[index % chartColors.length]} />
            ))}
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
  );
}

function PriorityBarChart({ data = [] }) {
  if (!data.length) {
    return <EmptyState title="Priority data will appear here" description="Connect ticket data to view this chart." />;
  }

  return (
    <div className="h-64 px-4 pb-5">
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
          <Bar dataKey="count" radius={[5, 5, 0, 0]} maxBarSize={44}>
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={entry.color ?? chartColors[index % chartColors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function ChartsPreview({ statusData = [], priorityData = [] }) {
  return (
    <section className="grid gap-4 xl:grid-cols-2">
      <ChartCard
        description="Local sample data · counts are illustrative."
        title="Ticket status"
      >
        <StatusDonutChart data={statusData} />
      </ChartCard>
      <ChartCard
        description="Local sample data · counts are illustrative."
        title="Priority distribution"
      >
        <PriorityBarChart data={priorityData} />
      </ChartCard>
    </section>
  );
}
