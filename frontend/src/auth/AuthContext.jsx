import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AUTH_FORBIDDEN_EVENT,
  AUTH_SESSION_EXPIRED_EVENT,
} from "../constants/auth.js";
import {
  getCurrentUser,
  login as loginRequest,
  register as registerRequest,
} from "../services/authService.js";
import { clearAccessToken, setAccessToken } from "../services/tokenStore.js";
import {
  clearStoredSession,
  readStoredSession,
  saveStoredSession,
} from "../services/sessionStore.js";
import { AuthContext } from "./authContext.js";

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [isRestoring, setIsRestoring] = useState(true);
  const [restoreError, setRestoreError] = useState("");
  const [sessionExpired, setSessionExpired] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);

  const expireSession = useCallback(() => {
    clearAccessToken();
    clearStoredSession();
    setSession(null);
    setAccessDenied(false);
    setSessionExpired(true);
  }, []);

  const logout = useCallback(() => {
    clearAccessToken();
    clearStoredSession();
    setSession(null);
    setAccessDenied(false);
    setSessionExpired(false);
    setRestoreError("");
  }, []);

  const acceptAuthResponse = useCallback((response) => {
    if (!response.user.active) {
      throw new Error("This account is inactive. Contact an administrator for assistance.");
    }

    const expiresAt = Date.now() + response.expiresIn * 1000;
    saveStoredSession(response.accessToken, expiresAt);
    setAccessToken(response.accessToken);
    setSession({
      user: response.user,
      expiresAt,
    });
    setAccessDenied(false);
    setSessionExpired(false);
    setRestoreError("");
    return response.user;
  }, []);

  const signIn = useCallback(async (credentials) => {
    const response = await loginRequest(credentials);
    return acceptAuthResponse(response);
  }, [acceptAuthResponse]);

  const signUp = useCallback(async (registration) => {
    const response = await registerRequest(registration);
    return acceptAuthResponse(response);
  }, [acceptAuthResponse]);

  const clearAccessDenied = useCallback(() => setAccessDenied(false), []);

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      try {
        const stored = readStoredSession();
        if (!active) return;
        if (stored.invalid) {
          setSessionExpired(true);
          setIsRestoring(false);
          return;
        }
        if (!stored.session) {
          setIsRestoring(false);
          return;
        }
        if (stored.session.expiresAt <= Date.now()) {
          expireSession();
          setIsRestoring(false);
          return;
        }

        setAccessToken(stored.session.accessToken);
        const user = await getCurrentUser();
        if (!active) return;
        if (!user.active) {
          expireSession();
          return;
        }
        setSession({ user, expiresAt: stored.session.expiresAt });
        setSessionExpired(false);
      } catch (error) {
        clearAccessToken();
        if (active) {
          if (error.response?.status === 401) {
            expireSession();
          } else {
            setRestoreError("Unable to verify your saved session. Sign in below to continue.");
          }
        }
      } finally {
        if (active) setIsRestoring(false);
      }
    }

    void restoreSession();
    return () => {
      active = false;
    };
  }, [expireSession]);

  useEffect(() => {
    if (!session) return undefined;
    const delay = Math.max(0, session.expiresAt - Date.now());
    const timeoutId = window.setTimeout(expireSession, delay);
    return () => window.clearTimeout(timeoutId);
  }, [expireSession, session]);

  useEffect(() => {
    const handleSessionExpired = () => expireSession();
    const handleForbidden = () => setAccessDenied(true);
    window.addEventListener(AUTH_SESSION_EXPIRED_EVENT, handleSessionExpired);
    window.addEventListener(AUTH_FORBIDDEN_EVENT, handleForbidden);
    return () => {
      window.removeEventListener(AUTH_SESSION_EXPIRED_EVENT, handleSessionExpired);
      window.removeEventListener(AUTH_FORBIDDEN_EVENT, handleForbidden);
    };
  }, [expireSession]);

  const value = useMemo(() => ({
    user: session?.user ?? null,
    expiresAt: session?.expiresAt ?? null,
    isAuthenticated: Boolean(session),
    isRestoring,
    restoreError,
    sessionExpired,
    accessDenied,
    signIn,
    signUp,
    logout,
    clearAccessDenied,
  }), [
    accessDenied,
    clearAccessDenied,
    isRestoring,
    logout,
    restoreError,
    session,
    sessionExpired,
    signIn,
    signUp,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
