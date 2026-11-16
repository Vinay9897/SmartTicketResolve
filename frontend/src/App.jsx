import { Navigate, Route, Routes } from "react-router-dom";
import { lazy, Suspense } from "react";
import ProtectedRoute from "./auth/ProtectedRoute.jsx";
import RoleBasedRoute from "./auth/RoleBasedRoute.jsx";
import { useAuth } from "./auth/useAuth.js";
import { getDashboardPath } from "./constants/auth.js";
import AppShell from "./components/layout/AppShell.jsx";
import AuthLoadingState from "./components/auth/AuthLoadingState.jsx";

const DesignSystemPage = lazy(() => import("./pages/DesignSystemPage.jsx"));
const DashboardPage = lazy(() => import("./pages/DashboardPage.jsx"));
const PreviewPage = lazy(() => import("./pages/PreviewPage.jsx"));
const LoginPage = lazy(() => import("./pages/auth/LoginPage.jsx"));
const RegisterPage = lazy(() => import("./pages/auth/RegisterPage.jsx"));
const UnauthorizedPage = lazy(() => import("./pages/auth/UnauthorizedPage.jsx"));
const CreateTicketPage = lazy(() => import("./pages/employee/CreateTicketPage.jsx"));
const TicketDetailsPage = lazy(() => import("./pages/employee/TicketDetailsPage.jsx"));
const MyTicketsPage = lazy(() => import("./pages/employee/MyTicketsPage.jsx"));
const SupportTicketQueuePage = lazy(() => import("./pages/support/SupportTicketQueuePage.jsx"));
const SupportTicketDetailsPage = lazy(() => import("./pages/support/SupportTicketDetailsPage.jsx"));
const AdminUsersPage = lazy(() => import("./pages/AdminUsersPage.jsx"));
const AdminCategoriesPage = lazy(() => import("./pages/AdminCategoriesPage.jsx"));
const AdminTeamsPage = lazy(() => import("./pages/AdminTeamsPage.jsx"));
const AdminTicketsPage = lazy(() => import("./pages/AdminTicketsPage.jsx"));

function PageLoading() {
  return (
    <div aria-label="Loading page" className="grid gap-4" role="status">
      <span className="h-7 w-48 animate-pulse rounded bg-slate-200" />
      <span className="h-4 w-72 max-w-full animate-pulse rounded bg-slate-100" />
      <span className="mt-4 h-48 rounded-xl border border-line bg-white" />
      <span className="sr-only">Loading</span>
    </div>
  );
}

function RootRedirect() {
  const { isAuthenticated, isRestoring, user } = useAuth();
  if (isRestoring) return <AuthLoadingState />;
  return <Navigate to={isAuthenticated ? getDashboardPath(user.role) : "/login"} replace />;
}

export default function App() {
  return (
    <Suspense fallback={<PageLoading />}>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route element={<AppShell previewMode />}>
          <Route path="/design-system" element={<DesignSystemPage />} />
          <Route path="/preview/dashboard" element={<DashboardPage />} />
          <Route path="/preview/:page" element={<PreviewPage />} />
        </Route>
        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route element={<RoleBasedRoute allowedRoles={["EMPLOYEE"]} />}>
              <Route path="/employee/dashboard" element={<DashboardPage />} />
              <Route path="/employee/tickets" element={<MyTicketsPage />} />
              <Route path="/employee/tickets/create" element={<CreateTicketPage />} />
              <Route path="/employee/tickets/:ticketId" element={<TicketDetailsPage />} />
            </Route>
            <Route element={<RoleBasedRoute allowedRoles={["SUPPORT_ENGINEER"]} />}>
              <Route path="/support/dashboard" element={<DashboardPage />} />
              <Route path="/support/tickets" element={<SupportTicketQueuePage />} />
              <Route
                path="/support/tickets/assigned"
                element={<SupportTicketQueuePage assignedOnly />}
              />
              <Route path="/support/tickets/:ticketId" element={<SupportTicketDetailsPage />} />
            </Route>
            <Route element={<RoleBasedRoute allowedRoles={["ADMIN"]} />}>
              <Route path="/admin/dashboard" element={<DashboardPage />} />
              <Route path="/admin/tickets" element={<AdminTicketsPage />} />
              <Route path="/admin/users" element={<AdminUsersPage />} />
              <Route path="/admin/categories" element={<AdminCategoriesPage />} />
              <Route path="/admin/teams" element={<AdminTeamsPage />} />
            </Route>
          </Route>
        </Route>
        <Route path="*" element={<RootRedirect />} />
      </Routes>
    </Suspense>
  );
}
