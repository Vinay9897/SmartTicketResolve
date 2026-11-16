export const AUTH_SESSION_EXPIRED_EVENT = "smartresolve:session-expired";
export const AUTH_FORBIDDEN_EVENT = "smartresolve:forbidden";

export const USER_ROLES = ["EMPLOYEE", "SUPPORT_ENGINEER", "ADMIN"];

export function getDashboardPath(role) {
  const dashboardByRole = {
    EMPLOYEE: "/employee/dashboard",
    SUPPORT_ENGINEER: "/support/dashboard",
    ADMIN: "/admin/dashboard",
  };
  return dashboardByRole[role] ?? "/unauthorized";
}

export function getPostAuthPath(location, role) {
  const requestedPath = location.state?.from?.pathname;
  if (
    typeof requestedPath === "string" &&
    requestedPath.startsWith("/") &&
    !["/login", "/register", "/unauthorized"].includes(requestedPath)
  ) {
    return requestedPath;
  }
  return getDashboardPath(role);
}
