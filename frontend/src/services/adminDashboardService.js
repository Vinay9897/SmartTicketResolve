import { z } from "zod";
import { apiClient } from "./api.js";

const dashboardCountSchema = z.object({
  key: z.enum(["status", "priority", "category", "supportTeam"]),
  id: z.string().uuid().nullable(),
  name: z.string(),
  count: z.number().int().nonnegative(),
});

const ticketDashboardSummarySchema = z.object({
  totalTickets: z.number().int().nonnegative(),
  openTickets: z.number().int().nonnegative(),
  inProgressTickets: z.number().int().nonnegative(),
  waitingForEmployeeTickets: z.number().int().nonnegative(),
  resolvedTickets: z.number().int().nonnegative(),
  closedTickets: z.number().int().nonnegative(),
  ticketsBySupportTeam: z.array(dashboardCountSchema),
});

function parseDashboardData(data, schema, description) {
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    throw new Error(`The admin dashboard returned unexpected ${description} data.`);
  }
  return parsed.data;
}

async function getDashboardEndpoint(path, signal) {
  const { data } = await apiClient.get(path, { signal });
  return data;
}

export async function getAdminDashboardData({ signal } = {}) {
  const [summaryData, statusData, priorityData, categoryData] = await Promise.all([
    getDashboardEndpoint("/admin/dashboard/summary", signal),
    getDashboardEndpoint("/admin/dashboard/tickets-by-status", signal),
    getDashboardEndpoint("/admin/dashboard/tickets-by-priority", signal),
    getDashboardEndpoint("/admin/dashboard/tickets-by-category", signal),
  ]);

  return {
    summary: parseDashboardData(summaryData, ticketDashboardSummarySchema, "summary"),
    statuses: parseDashboardData(statusData, z.array(dashboardCountSchema), "status"),
    priorities: parseDashboardData(priorityData, z.array(dashboardCountSchema), "priority"),
    categories: parseDashboardData(categoryData, z.array(dashboardCountSchema), "category"),
  };
}
