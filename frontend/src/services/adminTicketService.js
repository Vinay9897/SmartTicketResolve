import { z } from "zod";
import { ticketResponseSchema } from "./ticketService.js";
import { apiClient } from "./api.js";

const pageResponseSchema = z.object({
  content: z.array(ticketResponseSchema),
  page: z.number().int().nonnegative(),
  size: z.number().int().positive(),
  totalElements: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
  first: z.boolean(),
  last: z.boolean(),
});

function parseTicketResponse(data) {
  const parsed = ticketResponseSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error("The administrator ticket service returned an unexpected ticket response.");
  }
  return parsed.data;
}

export async function getAdminTicketsPage({
  page = 0,
  size = 20,
  sortBy = "createdAt",
  direction = "DESC",
  signal,
} = {}) {
  const { data } = await apiClient.get("/admin/tickets", {
    params: { page, size, sortBy, direction },
    signal,
  });
  const parsed = pageResponseSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error("The administrator ticket service returned unexpected paginated data.");
  }
  return parsed.data;
}

export async function getAdminTicketById(ticketId, { signal } = {}) {
  const { data } = await apiClient.get(`/admin/tickets/${ticketId}`, { signal });
  return parseTicketResponse(data);
}

export async function assignAdminTicket(ticketId, request) {
  const { data } = await apiClient.put(`/admin/tickets/${ticketId}/assign`, request);
  return parseTicketResponse(data);
}
