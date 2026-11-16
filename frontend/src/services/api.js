import axios from "axios";
import {
  AUTH_FORBIDDEN_EVENT,
  AUTH_SESSION_EXPIRED_EVENT,
} from "../constants/auth.js";
import { clearAccessToken, getAccessToken } from "./tokenStore.js";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim() || "/api";

export const apiClient = axios.create({
  baseURL: apiBaseUrl || undefined,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

apiClient.interceptors.request.use((config) => {
  const accessToken = getAccessToken();
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

function isAuthRequest(url = "") {
  const path = url.split("?")[0].replace(/\/+$/, "");
  return path.endsWith("/auth/login") || path.endsWith("/auth/register");
}

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    if (!isAuthRequest(error.config?.url)) {
      if (status === 401) {
        clearAccessToken();
        window.dispatchEvent(new Event(AUTH_SESSION_EXPIRED_EVENT));
      } else if (status === 403) {
        window.dispatchEvent(new Event(AUTH_FORBIDDEN_EVENT));
      }
    }
    return Promise.reject(error);
  },
);
