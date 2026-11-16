import { Navigate, Outlet, useLocation, useOutletContext } from "react-router-dom";
import AuthLoadingState from "../components/auth/AuthLoadingState.jsx";
import { USER_ROLES } from "../constants/auth.js";
import { useAuth } from "./useAuth.js";

export default function RoleBasedRoute({ allowedRoles = [] }) {
  const { isAuthenticated, isRestoring, user } = useAuth();
  const location = useLocation();
  const outletContext = useOutletContext();

  if (isRestoring) return <AuthLoadingState />;
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  if (
    !Array.isArray(allowedRoles) ||
    allowedRoles.length === 0 ||
    allowedRoles.some((role) => !USER_ROLES.includes(role)) ||
    !allowedRoles.includes(user?.role)
  ) {
    return <Navigate to="/unauthorized" replace state={{ from: location }} />;
  }
  return <Outlet context={outletContext} />;
}
