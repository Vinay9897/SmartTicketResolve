import { useEffect, useRef, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import AppHeader from "./AppHeader.jsx";
import Sidebar from "./Sidebar.jsx";
import { useAuth } from "../../auth/useAuth.js";
import { getDashboardPath } from "../../constants/auth.js";

function getBreadcrumbs(pathname, role, previewMode) {
  if (pathname === "/design-system") {
    return [{ label: "Design system" }];
  }
  const pageLabels = {
    "/admin/categories": "Categories",
    "/admin/dashboard": "Dashboard",
    "/admin/teams": "Support Teams",
    "/admin/tickets": "Tickets",
    "/admin/users": "Users",
    "/employee/dashboard": "Dashboard",
    "/employee/tickets": "My Tickets",
    "/employee/tickets/create": "Create Ticket",
    "/preview/assigned-tickets": "Assigned Tickets",
    "/preview/categories": "Categories",
    "/preview/create-ticket": "Create Ticket",
    "/preview/dashboard": "Dashboard",
    "/preview/my-tickets": "My Tickets",
    "/preview/support-teams": "Support Teams",
    "/preview/ticket-queue": "Ticket Queue",
    "/preview/tickets": "Tickets",
    "/preview/users": "Users",
    "/support/dashboard": "Dashboard",
    "/support/tickets": "Ticket Queue",
    "/support/tickets/assigned": "Assigned Tickets",
  };
  const label = pageLabels[pathname] ??
    (/^\/employee\/tickets\/[^/]+$/.test(pathname) ? "Ticket details" :
      /^\/support\/tickets\/[^/]+$/.test(pathname) ? "Ticket details" :
        pathname.split("/").filter(Boolean).at(-1)?.replaceAll("-", " ") ?? "Workspace");
  return [
    { label: "Workspace", to: previewMode ? "/preview/dashboard" : getDashboardPath(role) },
    { label },
  ];
}

export default function AppShell({ previewMode = false }) {
  const [previewRole, setPreviewRole] = useState("EMPLOYEE");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  const role = isAuthenticated ? user.role : previewRole;
  const canPreviewRoles = previewMode && !isAuthenticated;
  const sidebarRef = useRef(null);
  const menuButtonRef = useRef(null);

  useEffect(() => {
    if (!mobileMenuOpen) return undefined;
    const menuButton = menuButtonRef.current;
    const focusSidebar = window.requestAnimationFrame(() => {
      sidebarRef.current?.querySelector("nav a[href]")?.focus();
    });
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = sidebarRef.current?.querySelectorAll(
        'a[href], button:not([disabled]), select:not([disabled])',
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.cancelAnimationFrame(focusSidebar);
      window.removeEventListener("keydown", handleKeyDown);
      menuButton?.focus();
    };
  }, [mobileMenuOpen]);

  return (
    <div className="min-h-screen bg-canvas">
      <Sidebar
        onClose={() => setMobileMenuOpen(false)}
        open={mobileMenuOpen}
        onRoleChange={setPreviewRole}
        previewMode={canPreviewRoles}
        ref={sidebarRef}
        role={role}
      />
      <div className="min-h-screen md:pl-[260px]">
        <AppHeader
          breadcrumbs={getBreadcrumbs(location.pathname, role, canPreviewRoles)}
          menuButtonRef={menuButtonRef}
          mobileMenuOpen={mobileMenuOpen}
          onMenuClick={() => setMobileMenuOpen(true)}
          onRoleChange={setPreviewRole}
          previewMode={canPreviewRoles}
          role={role}
          user={user}
        />
        <main className="mx-auto w-full max-w-[1480px] px-4 py-6 md:px-8 md:py-8">
          <Outlet context={{ role, user, previewMode: canPreviewRoles }} />
        </main>
      </div>
    </div>
  );
}
