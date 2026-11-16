import { z } from "zod";
import { apiClient } from "./api.js";

const userRoleSchema = z.enum(["EMPLOYEE", "SUPPORT_ENGINEER", "ADMIN"]);

export const adminUserResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  role: userRoleSchema,
  active: z.boolean(),
  createdAt: z.string().datetime(),
}).strict();

const pageResponseSchema = z.object({
  content: z.array(adminUserResponseSchema),
  page: z.number().int().nonnegative(),
  size: z.number().int().positive(),
  totalElements: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
  first: z.boolean(),
  last: z.boolean(),
});

function parseUserResponse(data) {
  const parsed = adminUserResponseSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error("The user service returned an unexpected user response.");
  }
  return parsed.data;
}

export async function getAdminUsersPage({
  page = 0,
  size = 20,
  sortBy = "createdAt",
  direction = "DESC",
  search,
  role,
  signal,
} = {}) {
  const { data } = await apiClient.get("/admin/users", {
    params: { page, size, sortBy, direction, search: search || undefined, role: role || undefined },
    signal,
  });
  const parsed = pageResponseSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error("The user service returned an unexpected paginated response.");
  }
  return parsed.data;
}

export async function getAllActiveAdminSupportEngineers({ signal } = {}) {
  const engineers = [];
  let page = 0;
  let totalPages = 1;

  while (page < totalPages) {
    const result = await getAdminUsersPage({
      page,
      size: 100,
      sortBy: "name",
      direction: "ASC",
      role: "SUPPORT_ENGINEER",
      signal,
    });
    engineers.push(...result.content.filter((user) => user.active));
    totalPages = result.totalPages;
    page += 1;
  }

  return engineers;
}

export async function getAdminUserById(userId, { signal } = {}) {
  const { data } = await apiClient.get(`/admin/users/${userId}`, { signal });
  return parseUserResponse(data);
}

export async function createAdminUser(request) {
  const { data } = await apiClient.post("/admin/users", request);
  return parseUserResponse(data);
}

export async function updateAdminUser(userId, request) {
  const { data } = await apiClient.put(`/admin/users/${userId}`, request);
  return parseUserResponse(data);
}

export async function updateAdminUserStatus(userId, active) {
  const { data } = await apiClient.patch(`/admin/users/${userId}/status`, { active });
  return parseUserResponse(data);
}
