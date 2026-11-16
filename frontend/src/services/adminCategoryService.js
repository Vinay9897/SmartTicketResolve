import { z } from "zod";
import { apiClient } from "./api.js";

const categoryResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  active: z.boolean(),
}).strict();

function parseCategoryResponse(data) {
  const parsed = categoryResponseSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error("The category service returned an unexpected category response.");
  }
  return parsed.data;
}

export async function getAdminCategories({ signal } = {}) {
  const { data } = await apiClient.get("/admin/categories", { signal });
  const parsed = z.array(categoryResponseSchema).safeParse(data);
  if (!parsed.success) {
    throw new Error("The category service returned unexpected category data.");
  }
  return parsed.data;
}

export async function createAdminCategory(request) {
  const { data } = await apiClient.post("/admin/categories", request);
  return parseCategoryResponse(data);
}

export async function updateAdminCategory(categoryId, request) {
  const { data } = await apiClient.put(`/admin/categories/${categoryId}`, request);
  return parseCategoryResponse(data);
}

export async function deactivateAdminCategory(categoryId) {
  await apiClient.delete(`/admin/categories/${categoryId}`);
}
