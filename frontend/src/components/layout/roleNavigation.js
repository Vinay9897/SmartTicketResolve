import {
  Activity,
  ClipboardList,
  LayoutDashboard,
  Plus,
  Ticket,
  Users,
  UsersRound,
  Tags,
} from "lucide-react";

export const roleOptions = [
  { value: "EMPLOYEE", label: "Employee" },
  { value: "SUPPORT_ENGINEER", label: "Support Engineer" },
  { value: "ADMIN", label: "Administrator" },
];

const navigationByRole = {
  EMPLOYEE: [
    { label: "Dashboard", path: "/employee/dashboard", icon: LayoutDashboard },
    { label: "My Tickets", path: "/employee/tickets", icon: ClipboardList },
    { label: "Create Ticket", path: "/employee/tickets/create", icon: Plus },
  ],
  SUPPORT_ENGINEER: [
    { label: "Dashboard", path: "/support/dashboard", icon: LayoutDashboard },
    { label: "Ticket Queue", path: "/support/tickets", icon: Activity },
    { label: "Assigned Tickets", path: "/support/tickets/assigned", icon: ClipboardList },
  ],
  ADMIN: [
    { label: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Tickets", path: "/admin/tickets", icon: Ticket },
    { label: "Users", path: "/admin/users", icon: Users },
    { label: "Categories", path: "/admin/categories", icon: Tags },
    { label: "Support Teams", path: "/admin/teams", icon: UsersRound },
  ],
};

const previewPathsByRole = {
  EMPLOYEE: ["/preview/dashboard", "/preview/my-tickets", "/preview/create-ticket"],
  SUPPORT_ENGINEER: ["/preview/dashboard", "/preview/ticket-queue", "/preview/assigned-tickets"],
  ADMIN: ["/preview/dashboard", "/preview/tickets", "/preview/users", "/preview/categories", "/preview/support-teams"],
};

export function getNavigationForRole(role, previewMode = false) {
  const navigation = navigationByRole[role] ?? navigationByRole.EMPLOYEE;
  if (!previewMode) return navigation;
  return navigation.map((item, index) => ({
    ...item,
    path: previewPathsByRole[role]?.[index] ?? item.path,
  }));
}
