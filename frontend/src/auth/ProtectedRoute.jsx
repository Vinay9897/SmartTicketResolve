import { Navigate, Outlet, useLocation } from "react-router-dom";
import AuthLoadingState from "../components/auth/AuthLoadingState.jsx";
import { useAuth } from "./useAuth.js";

export default function ProtectedRoute() {
  const { isAuthenticated, isRestoring } = useAuth();
  const location = useLocation();

  if (isRestoring) return <AuthLoadingState />;
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <Outlet />;
}
