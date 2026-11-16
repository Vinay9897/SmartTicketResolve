import { z } from "zod";
import { USER_ROLES } from "../constants/auth.js";
import { apiClient } from "./api.js";

const userResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(USER_ROLES),
  active: z.boolean(),
  createdAt: z.string().datetime(),
});

const authResponseSchema = z.object({
  accessToken: z.string().min(1),
  tokenType: z.literal("Bearer"),
  expiresIn: z.number().int().positive(),
  user: userResponseSchema,
});

function parseAuthResponse(response) {
  const result = authResponseSchema.safeParse(response);
  if (!result.success) {
    throw new Error("The authentication service returned an unexpected response.");
  }
  return result.data;
}

function parseUserResponse(response) {
  const result = userResponseSchema.safeParse(response);
  if (!result.success) {
    throw new Error("The authentication service returned an unexpected user profile.");
  }
  return result.data;
}

export async function login(credentials) {
  const { data } = await apiClient.post("/auth/login", credentials);
  return parseAuthResponse(data);
}

export async function getCurrentUser() {
  const { data } = await apiClient.get("/auth/me");
  return parseUserResponse(data);
}

export async function register(registration) {
  const { name, email, password } = registration;
  const { data } = await apiClient.post("/auth/register", { name, email, password });
  return parseAuthResponse(data);
}

export function getAuthErrorMessage(error, fallback) {
  const status = error.response?.status;
  if (status === 401) return "Email or password is incorrect.";
  if (status === 403) return "You do not have permission to complete this request.";

  const serverMessage = error.response?.data?.message;
  if (typeof serverMessage === "string" && serverMessage.trim()) return serverMessage;

  if (
    error.message?.includes("VITE_API_BASE_URL") ||
    error.message?.includes("unexpected response") ||
    error.message?.includes("account is inactive") ||
    error.message?.includes("session storage")
  ) {
    return error.message;
  }
  if (error.isAxiosError && !error.response) {
    return "Unable to reach the SmartResolve server. Check your connection and try again.";
  }
  if (!error.isAxiosError && error.message) return error.message;
  return fallback;
}
