import { z } from "zod";
import { apiClient } from "./api.js";

const teamResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  active: z.boolean(),
}).strict();

const teamOverviewResponseSchema = teamResponseSchema.extend({
  memberCount: z.number().int().nonnegative(),
});

const teamMemberResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  active: z.boolean(),
  joinedAt: z.string().datetime(),
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

export async function getAdminTeamOverviews({ signal } = {}) {
  const { data } = await apiClient.get("/admin/teams/overview", { signal });
  const parsed = z.array(teamOverviewResponseSchema).safeParse(data);
  if (!parsed.success) {
    throw new Error("The support team service returned unexpected team overview data.");
  }
  return parsed.data;
}

export async function getAdminTeamMembers(teamId, { signal } = {}) {
  const { data } = await apiClient.get(`/admin/teams/${teamId}/members`, { signal });
  const parsed = z.array(teamMemberResponseSchema).safeParse(data);
  if (!parsed.success) {
    throw new Error("The support team service returned unexpected member data.");
  }
  return parsed.data;
}

export async function assignAdminTeamMembers(teamId, engineerIds) {
  const { data } = await apiClient.post(`/admin/teams/${teamId}/members`, { engineerIds });
  const parsed = z.array(teamMemberResponseSchema).safeParse(data);
  if (!parsed.success) {
    throw new Error("The support team service returned unexpected member data.");
  }
  return parsed.data;
}

export async function unassignAdminTeamMember(teamId, engineerId) {
  await apiClient.delete(`/admin/teams/${teamId}/members/${engineerId}`);
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
