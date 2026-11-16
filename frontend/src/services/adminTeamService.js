import { z } from "zod";
import { apiClient } from "./api.js";

const teamResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  active: z.boolean(),
}).strict();

function parseTeamResponse(data) {
  const parsed = teamResponseSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error("The support team service returned an unexpected team response.");
  }
  return parsed.data;
}

export async function getAdminTeams({ signal } = {}) {
  const { data } = await apiClient.get("/admin/teams", { signal });
  const parsed = z.array(teamResponseSchema).safeParse(data);
  if (!parsed.success) {
    throw new Error("The support team service returned unexpected team data.");
  }
  return parsed.data;
}

export async function createAdminTeam(request) {
  const { data } = await apiClient.post("/admin/teams", request);
  return parseTeamResponse(data);
}

export async function updateAdminTeam(teamId, request) {
  const { data } = await apiClient.put(`/admin/teams/${teamId}`, request);
  return parseTeamResponse(data);
}

export async function deactivateAdminTeam(teamId) {
  await apiClient.delete(`/admin/teams/${teamId}`);
}
