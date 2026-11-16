import { z } from "zod";

const SESSION_STORAGE_KEY = "smartresolve.auth-session.v1";

const storedSessionSchema = z.object({
  accessToken: z.string().min(1),
  expiresAt: z.number().int().positive(),
}).strict();

export function readStoredSession() {
  const serializedSession = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (serializedSession === null) return { session: null, invalid: false };

  let storedSession;
  try {
    storedSession = JSON.parse(serializedSession);
  } catch {
    window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
    return { session: null, invalid: true };
  }

  const result = storedSessionSchema.safeParse(storedSession);
  if (!result.success) {
    window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
    return { session: null, invalid: true };
  }
  return { session: result.data, invalid: false };
}

export function saveStoredSession(accessToken, expiresAt) {
  window.sessionStorage.setItem(
    SESSION_STORAGE_KEY,
    JSON.stringify({ accessToken, expiresAt }),
  );
}

export function clearStoredSession() {
  window.sessionStorage.removeItem(SESSION_STORAGE_KEY);
}
