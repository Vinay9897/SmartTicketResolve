import { z } from "zod";
import { apiClient } from "./api.js";

const CREATE_TICKET_TIMEOUT_MS = 30000;

const ticketStatusSchema = z.enum([
  "OPEN",
  "IN_PROGRESS",
  "WAITING_FOR_EMPLOYEE",
  "RESOLVED",
  "CLOSED",
]);

const ticketPrioritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);

export const ticketResponseSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string(),
  issueSummary: z.string().nullable(),
  categoryId: z.string().uuid().nullable(),
  categoryName: z.string().nullable(),
  priority: ticketPrioritySchema,
  status: ticketStatusSchema,
  createdById: z.string().uuid(),
  createdByName: z.string(),
  assignedToId: z.string().uuid().nullable(),
  assignedToName: z.string().nullable(),
  supportTeamId: z.string().uuid().nullable(),
  supportTeamName: z.string().nullable(),
  resolutionNotes: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  resolvedAt: z.string().datetime().nullable(),
});

const aiAnalysisResponseSchema = z.object({
  id: z.string().uuid(),
  ticketId: z.string().uuid(),
  suggestedCategoryName: z.string().nullable(),
  suggestedCategoryId: z.string().uuid().nullable(),
  suggestedPriority: ticketPrioritySchema.nullable(),
  issueSummary: z.string().nullable(),
  troubleshootingSteps: z.array(z.string()),
  suggestedResponse: z.string().nullable(),
  reviewedById: z.string().uuid().nullable(),
  reviewedAt: z.string().datetime().nullable(),
  status: z.enum(["PENDING", "COMPLETED", "FAILED", "REVIEWED"]),
  createdAt: z.string().datetime(),
  failureMessage: z.string().nullable(),
});

const pageResponseSchema = z.object({
  content: z.array(ticketResponseSchema),
  page: z.number().int().nonnegative(),
  size: z.number().int().positive(),
  totalElements: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
  first: z.boolean(),
  last: z.boolean(),
});

const commentResponseSchema = z.object({
  id: z.string().uuid(),
  ticketId: z.string().uuid(),
  userId: z.string().uuid(),
  userName: z.string(),
  comment: z.string(),
  visibility: z.enum(["PUBLIC", "INTERNAL"]),
  createdAt: z.string().datetime(),
});

const commentPageResponseSchema = z.object({
  content: z.array(commentResponseSchema),
  page: z.number().int().nonnegative(),
  size: z.number().int().positive(),
  totalElements: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
  first: z.boolean(),
  last: z.boolean(),
});

const statusHistoryResponseSchema = z.object({
  id: z.string().uuid(),
  ticketId: z.string().uuid(),
  fromStatus: ticketStatusSchema.nullable(),
  toStatus: ticketStatusSchema,
  note: z.string().nullable(),
  changedByName: z.string().nullable(),
  changedAt: z.string().datetime(),
});

const statusHistoryPageResponseSchema = z.object({
  content: z.array(statusHistoryResponseSchema),
  page: z.number().int().nonnegative(),
  size: z.number().int().positive(),
  totalElements: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
  first: z.boolean(),
  last: z.boolean(),
});

const assignableEngineerSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
});

const assignableTeamSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
});

function parsePageResponse(response) {
  const parsed = pageResponseSchema.safeParse(response);
  if (!parsed.success) {
    throw new Error("The ticket service returned an unexpected paginated response.");
  }
  return parsed.data;
}

function parseTicketResponse(response) {
  const parsed = ticketResponseSchema.safeParse(response);
  if (!parsed.success) {
    throw new Error("The ticket service returned an unexpected ticket response.");
  }
  return parsed.data;
}

export async function createTicket(request) {
  const { data } = await apiClient.post("/tickets", request, {
    timeout: CREATE_TICKET_TIMEOUT_MS,
  });
  return parseTicketResponse(data);
}

export async function getTicketById(ticketId, { signal } = {}) {
  const { data } = await apiClient.get(`/tickets/${ticketId}`, { signal });
  return parseTicketResponse(data);
}

export async function getSupportTicketById(ticketId, { signal } = {}) {
  const { data } = await apiClient.get(`/support/tickets/${ticketId}`, { signal });
  return parseTicketResponse(data);
}

export async function getAssignableSupportEngineers({ teamId, signal } = {}) {
  const { data } = await apiClient.get("/support/assignment-options/engineers", {
    params: teamId ? { teamId } : {},
    signal,
  });
  const parsed = z.array(assignableEngineerSchema).safeParse(data);
  if (!parsed.success) {
    throw new Error("The assignment service returned unexpected engineer data.");
  }
  return parsed.data;
}

export async function getAssignableSupportTeams({ signal } = {}) {
  const { data } = await apiClient.get("/support/assignment-options/teams", { signal });
  const parsed = z.array(assignableTeamSchema).safeParse(data);
  if (!parsed.success) {
    throw new Error("The assignment service returned unexpected team data.");
  }
  return parsed.data;
}

async function submitTicketAssignment(basePath, ticketId, request) {
  const { data } = await apiClient.put(`${basePath}/${ticketId}/assign`, request);
  return parseTicketResponse(data);
}

export async function assignSupportTicket(ticketId, request) {
  return submitTicketAssignment("/support/tickets", ticketId, request);
}

export async function changeSupportTicketStatus(ticketId, request) {
  const { data } = await apiClient.put(`/support/tickets/${ticketId}/status`, request);
  return parseTicketResponse(data);
}

export async function resolveSupportTicket(ticketId, request) {
  const { data } = await apiClient.put(`/support/tickets/${ticketId}/resolve`, request);
  return parseTicketResponse(data);
}

export async function addSupportTroubleshootingNote(ticketId, comment) {
  const { data } = await apiClient.post(`/tickets/${ticketId}/comments`, {
    comment,
    visibility: "INTERNAL",
  });
  const parsed = commentResponseSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error("The ticket service returned an unexpected troubleshooting note response.");
  }
  return parsed.data;
}

export async function getSupportTicketStatusHistoryPage(
  ticketId,
  { page = 0, size = 100, signal } = {},
) {
  const { data } = await apiClient.get(`/support/tickets/${ticketId}/status-history`, {
    params: { page, size },
    signal,
  });
  const parsed = statusHistoryPageResponseSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error("The ticket service returned unexpected status history data.");
  }
  return parsed.data;
}

export async function getAllSupportTicketStatusHistory(ticketId, { signal } = {}) {
  const firstPage = await getSupportTicketStatusHistoryPage(ticketId, { page: 0, size: 100, signal });
  const history = [...firstPage.content];

  for (let page = 1; page < firstPage.totalPages; page += 1) {
    const result = await getSupportTicketStatusHistoryPage(ticketId, { page, size: 100, signal });
    history.push(...result.content);
  }

  return history;
}

export async function getTicketAiAnalysis(ticketId, { signal } = {}) {
  const { data } = await apiClient.get(`/tickets/${ticketId}/ai-analysis`, { signal });
  const parsed = aiAnalysisResponseSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error("The AI analysis service returned an unexpected response.");
  }
  return parsed.data;
}

export async function generateTicketAiAnalysis(ticketId) {
  const { data } = await apiClient.post(`/tickets/${ticketId}/ai-analysis`);
  const parsed = aiAnalysisResponseSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error("The AI analysis service returned an unexpected response.");
  }
  return parsed.data;
}

export async function reviewSupportTicketAiAnalysis(ticketId, request) {
  const { data } = await apiClient.put(`/support/tickets/${ticketId}/ai-analysis`, request);
  const parsed = aiAnalysisResponseSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error("The AI review service returned an unexpected response.");
  }
  return parsed.data;
}

export async function getMyTicketsPage({ page = 0, size = 100, signal } = {}) {
  const { data } = await apiClient.get("/tickets/my", {
    params: { page, size, sortBy: "updatedAt", direction: "DESC" },
    signal,
  });
  return parsePageResponse(data);
}

export async function getAllMyTickets({ signal } = {}) {
  const firstPage = await getMyTicketsPage({ page: 0, size: 100, signal });
  const tickets = [...firstPage.content];

  for (let page = 1; page < firstPage.totalPages; page += 1) {
    const result = await getMyTicketsPage({ page, size: 100, signal });
    tickets.push(...result.content);
  }

  return tickets;
}

export async function getSupportTicketsPage({
  page = 0,
  size = 100,
  sortBy = "updatedAt",
  direction = "DESC",
  categoryId,
  priority,
  status,
  signal,
} = {}) {
  const filters = { categoryId, priority, status };
  const hasFilters = Object.values(filters).some(Boolean);
  const { data } = await apiClient.get(
    hasFilters ? "/support/tickets/filter" : "/support/tickets",
    {
      params: { page, size, sortBy, direction, ...filters },
      signal,
    },
  );
  return parsePageResponse(data);
}

export async function getAllSupportTickets({
  categoryId,
  priority,
  status,
  sortBy = "updatedAt",
  direction = "DESC",
  signal,
} = {}) {
  const firstPage = await getSupportTicketsPage({
    page: 0,
    size: 100,
    categoryId,
    priority,
    status,
    sortBy,
    direction,
    signal,
  });
  const tickets = [...firstPage.content];

  for (let page = 1; page < firstPage.totalPages; page += 1) {
    const result = await getSupportTicketsPage({
      page,
      size: 100,
      categoryId,
      priority,
      status,
      sortBy,
      direction,
      signal,
    });
    tickets.push(...result.content);
  }

  return tickets;
}

export async function getTicketCommentsPage(ticketId, { page = 0, size = 100, signal } = {}) {
  const { data } = await apiClient.get(`/tickets/${ticketId}/comments`, {
    params: { page, size },
    signal,
  });
  const parsed = commentPageResponseSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error("The ticket service returned unexpected comment data.");
  }
  return parsed.data;
}

export async function getAllTicketComments(ticketId, { signal } = {}) {
  const firstPage = await getTicketCommentsPage(ticketId, { page: 0, size: 100, signal });
  const comments = [...firstPage.content];

  for (let page = 1; page < firstPage.totalPages; page += 1) {
    const result = await getTicketCommentsPage(ticketId, { page, size: 100, signal });
    comments.push(...result.content);
  }

  return comments;
}

export async function addTicketComment(ticketId, comment) {
  const { data } = await apiClient.post(`/tickets/${ticketId}/comments`, {
    comment,
    visibility: "PUBLIC",
  });
  const parsed = commentResponseSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error("The ticket service returned an unexpected comment response.");
  }
  return parsed.data;
}

async function getTicketComments(ticketId, { signal } = {}) {
  return getTicketCommentsPage(ticketId, { page: 0, size: 20, signal });
}

export async function getRecentMyTicketActivity(tickets, { signal } = {}) {
  const recentTickets = [...tickets]
    .sort((left, right) => Date.parse(right.updatedAt) - Date.parse(left.updatedAt))
    .slice(0, 5);

  const activityByTicket = await Promise.all(
    recentTickets.map(async (ticket) => {
      const commentsPage = await getTicketComments(ticket.id, { signal });
      return commentsPage.content.map((comment) => ({
        ...comment,
        ticketTitle: ticket.title,
      }));
    }),
  );

  return activityByTicket
    .flat()
    .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
    .slice(0, 5);
}
