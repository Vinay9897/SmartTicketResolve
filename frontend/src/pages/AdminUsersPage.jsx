import { useEffect, useState } from "react";
import { Eye, Pencil, Plus, UserRoundCheck, UserRoundX } from "lucide-react";
import toast from "react-hot-toast";
import AdminUserFormDialog from "../components/AdminUserFormDialog.jsx";
import Badge from "../components/ui/Badge.jsx";
import Button from "../components/ui/Button.jsx";
import Card, { CardHeader } from "../components/ui/Card.jsx";
import ConfirmationDialog from "../components/ui/ConfirmationDialog.jsx";
import DataTable from "../components/ui/DataTable.jsx";
import ErrorState from "../components/ui/ErrorState.jsx";
import { SelectInput } from "../components/ui/FormField.jsx";
import Modal from "../components/ui/Modal.jsx";
import PageHeading from "../components/ui/PageHeading.jsx";
import Pagination from "../components/ui/Pagination.jsx";
import SearchInput from "../components/ui/SearchInput.jsx";
import Skeleton from "../components/ui/Skeleton.jsx";
import {
  getAdminUserById,
  getAdminUsersPage,
  updateAdminUserStatus,
} from "../services/adminUserService.js";

const PAGE_SIZE = 20;
const userRoles = ["EMPLOYEE", "SUPPORT_ENGINEER", "ADMIN"];

function formatRole(role) {
  return role.replaceAll("_", " ");
}

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function getErrorMessage(error) {
  const message = error.response?.data?.message;
  if (typeof message === "string" && message.trim()) return message;
  if (error.response?.status === 401) return "Your session has expired. Sign in again to manage users.";
  if (error.response?.status === 403) return "Only administrators can access user management.";
  if (error.response?.status === 404) return "This user is no longer available.";
  if (error.isAxiosError && !error.response) {
    return "Could not connect to SmartResolve. Check your connection and try again.";
  }
  if (error.message) return error.message;
  return "User data could not be loaded. Please try again.";
}

function UserListSkeleton() {
  return (
    <div aria-label="Loading users" className="grid gap-4 p-5" role="status">
      {Array.from({ length: 6 }, (_, index) => (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-5" key={index}>
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-40 max-w-full" />
          <Skeleton className="h-6 w-28" />
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-8 w-24" />
        </div>
      ))}
      <span className="sr-only">Loading user records</span>
    </div>
  );
}

function UserDetailsDialog({ userId, onClose }) {
  const [retryCount, setRetryCount] = useState(0);
  const [result, setResult] = useState({ key: "", status: "loading", user: null, error: "" });
  const requestKey = `${userId}:${retryCount}`;
  const isLoading = result.key !== requestKey;

  useEffect(() => {
    const controller = new AbortController();
    getAdminUserById(userId, { signal: controller.signal })
      .then((user) => setResult({ key: requestKey, status: "success", user, error: "" }))
      .catch((error) => {
        if (!controller.signal.aborted) {
          setResult({ key: requestKey, status: "error", user: null, error: getErrorMessage(error) });
        }
      });
    return () => controller.abort();
  }, [requestKey, userId]);

  const user = !isLoading && result.status === "success" ? result.user : null;
  const error = !isLoading && result.status === "error" ? result.error : "";

  return (
    <Modal
      description="Account details returned by the administrator user API."
      onClose={onClose}
      open
      title="User details"
    >
      {isLoading ? (
        <div aria-label="Loading user details" className="grid gap-4" role="status">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <span className="sr-only">Loading user details</span>
        </div>
      ) : error ? (
        <ErrorState
          description={error}
          onRetry={() => setRetryCount((count) => count + 1)}
          title="User details could not be loaded"
        />
      ) : (
        <dl className="grid gap-4 sm:grid-cols-2">
          <div className="min-w-0">
            <dt className="text-xs font-medium uppercase tracking-wide text-muted">Name</dt>
            <dd className="mt-1 break-words text-sm text-slate-800">{user.name}</dd>
          </div>
          <div className="min-w-0">
            <dt className="text-xs font-medium uppercase tracking-wide text-muted">Email</dt>
            <dd className="mt-1 break-all text-sm text-slate-800">{user.email}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted">Role</dt>
            <dd className="mt-1 text-sm text-slate-800">{formatRole(user.role)}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted">Account status</dt>
            <dd className="mt-1 text-sm text-slate-800">{user.active ? "Active" : "Inactive"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted">Created</dt>
            <dd className="mt-1 text-sm text-slate-800">{formatDate(user.createdAt)}</dd>
          </div>
          <div className="min-w-0 sm:col-span-2">
            <dt className="text-xs font-medium uppercase tracking-wide text-muted">User ID</dt>
            <dd className="mt-1 break-all font-mono text-xs text-slate-600">{user.id}</dd>
          </div>
        </dl>
      )}
    </Modal>
  );
}

export default function AdminUsersPage() {
  const [searchText, setSearchText] = useState("");
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [page, setPage] = useState(0);
  const [reloadCount, setReloadCount] = useState(0);
  const [result, setResult] = useState({ key: "", status: "loading", pageData: null, error: "" });
  const [dialog, setDialog] = useState(null);
  const [deactivatingUser, setDeactivatingUser] = useState(null);
  const [updatingStatusUserId, setUpdatingStatusUserId] = useState(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setSearch(searchText.trim());
      setPage(0);
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [searchText]);

  const requestKey = JSON.stringify([page, search, role, reloadCount]);
  const isLoading = result.key !== requestKey;
  const error = !isLoading && result.status === "error" ? result.error : "";
  const pageData = !isLoading && result.status === "success" ? result.pageData : null;

  useEffect(() => {
    const controller = new AbortController();
    getAdminUsersPage({
      page,
      size: PAGE_SIZE,
      sortBy: "createdAt",
      direction: "DESC",
      search: search || undefined,
      role: role || undefined,
      signal: controller.signal,
    })
      .then((response) => {
        setResult({ key: requestKey, status: "success", pageData: response, error: "" });
      })
      .catch((requestError) => {
        if (!controller.signal.aborted) {
          setResult({
            key: requestKey,
            status: "error",
            pageData: null,
            error: getErrorMessage(requestError),
          });
        }
      });
    return () => controller.abort();
  }, [page, requestKey, role, search]);

  function refreshUsers() {
    setReloadCount((count) => count + 1);
  }

  async function activateUser(user) {
    setUpdatingStatusUserId(user.id);
    try {
      await updateAdminUserStatus(user.id, true);
      toast.success(`${user.name} was activated.`);
      refreshUsers();
    } catch (error) {
      const message = getErrorMessage(error);
      toast.error(message);
    } finally {
      setUpdatingStatusUserId(null);
    }
  }

  async function deactivateUser() {
    if (!deactivatingUser) return;
    setUpdatingStatusUserId(deactivatingUser.id);
    try {
      await updateAdminUserStatus(deactivatingUser.id, false);
      toast.success(`${deactivatingUser.name} was deactivated.`);
      setDeactivatingUser(null);
      refreshUsers();
    } catch (error) {
      const message = getErrorMessage(error);
      toast.error(message);
    } finally {
      setUpdatingStatusUserId(null);
    }
  }

  const columns = [
    {
      key: "name",
      header: "User",
      render: (user) => <span className="font-medium text-slate-800">{user.name}</span>,
    },
    {
      key: "email",
      header: "Email",
      render: (user) => <span className="break-all">{user.email}</span>,
    },
    {
      key: "role",
      header: "Role",
      render: (user) => <Badge variant="info">{formatRole(user.role)}</Badge>,
    },
    {
      key: "active",
      header: "Status",
      render: (user) => <Badge variant={user.active ? "success" : "neutral"}>{user.active ? "Active" : "Inactive"}</Badge>,
    },
    {
      key: "createdAt",
      header: "Created",
      className: "whitespace-nowrap",
      render: (user) => formatDate(user.createdAt),
    },
    {
      key: "actions",
      header: "Actions",
      className: "whitespace-nowrap",
      render: (user) => (
        <div className="flex items-center gap-2">
          <Button
            aria-label={`View ${user.name} details`}
            className="size-10 shrink-0 px-0"
            onClick={() => setDialog({ kind: "details", userId: user.id })}
            title="View details"
            type="button"
            variant="ghost"
          >
            <Eye aria-hidden="true" className="size-5 shrink-0" />
          </Button>
          <Button
            aria-label={`Edit ${user.name}`}
            className="size-10 shrink-0 px-0"
            onClick={() => setDialog({ kind: "edit", user })}
            title="Edit user"
            type="button"
            variant="ghost"
          >
            <Pencil aria-hidden="true" className="size-5 shrink-0" />
          </Button>
          {user.active ? (
            <Button
              aria-label={`Deactivate ${user.name}`}
              className="size-10 shrink-0 px-0 text-critical"
              disabled={Boolean(updatingStatusUserId)}
              onClick={() => setDeactivatingUser(user)}
              title="Deactivate user"
              type="button"
              variant="ghost"
            >
              <UserRoundX aria-hidden="true" className="size-5 shrink-0" />
            </Button>
          ) : (
            <Button
              aria-label={`Activate ${user.name}`}
              className="size-10 shrink-0 px-0 text-success"
              disabled={Boolean(updatingStatusUserId)}
              onClick={() => activateUser(user)}
              title="Activate user"
              type="button"
              variant="ghost"
            >
              <UserRoundCheck aria-hidden="true" className="size-5 shrink-0" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  if (error) {
    return (
      <div className="mx-auto max-w-3xl">
        <PageHeading
          description="Search, view, and manage SmartResolve accounts."
          eyebrow="Administration"
          title="User management"
        />
        <ErrorState
          className="mt-6"
          description={error}
          onRetry={refreshUsers}
          title="Users could not be loaded"
        />
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-[1480px] gap-6">
      <PageHeading
        actions={(
          <Button onClick={() => setDialog({ kind: "create" })} type="button">
            <Plus aria-hidden="true" className="size-4" />
            Create user
          </Button>
        )}
        description="Search accounts, review access, and manage user roles and status."
        eyebrow="Administration"
        title="User management"
      />

      <Card className="overflow-hidden">
        <CardHeader
          description="Search by name or email and narrow the list by role."
          title="Users"
        />
        <div className="grid gap-3 px-5 pb-5 sm:grid-cols-[minmax(0,1fr)_240px]">
          <SearchInput
            id="admin-users-search"
            label="Search users"
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="Search by name or email..."
            value={searchText}
            visibleLabel
          />
          <SelectInput
            id="admin-users-role-filter"
            label="Filter by role"
            onChange={(event) => {
              setRole(event.target.value);
              setPage(0);
            }}
            value={role}
          >
            <option value="">All roles</option>
            {userRoles.map((userRole) => (
              <option key={userRole} value={userRole}>{formatRole(userRole)}</option>
            ))}
          </SelectInput>
        </div>

        {isLoading ? (
          <UserListSkeleton />
        ) : (
          <>
            <DataTable
              columns={columns}
              emptyDescription={search || role
                ? "Try changing the search text or role filter."
                : "Users will appear here when available."}
              emptyTitle={search || role ? "No matching users" : "No users found"}
              rows={pageData.content}
            />
            {pageData.totalElements > 0 && (
              <Pagination
                onPageChange={(nextPage) => setPage(nextPage - 1)}
                page={page + 1}
                pageSize={pageData.size}
                totalItems={pageData.totalElements}
                itemLabel="users"
              />
            )}
          </>
        )}
      </Card>

      {dialog?.kind === "details" && (
        <UserDetailsDialog
          key={dialog.userId}
          onClose={() => setDialog(null)}
          userId={dialog.userId}
        />
      )}
      {(dialog?.kind === "create" || dialog?.kind === "edit") && (
        <AdminUserFormDialog
          key={dialog.kind === "edit" ? dialog.user.id : "create-user"}
          mode={dialog.kind}
          onClose={() => setDialog(null)}
          onSaved={() => {
            setPage(0);
            refreshUsers();
          }}
          user={dialog.user}
        />
      )}
      <ConfirmationDialog
        confirmText="Deactivate user"
        description={deactivatingUser
          ? `Deactivate ${deactivatingUser.name} (${deactivatingUser.email})? They will no longer be able to sign in.`
          : ""}
        destructive
        loading={Boolean(deactivatingUser && updatingStatusUserId === deactivatingUser.id)}
        onClose={() => {
          if (!updatingStatusUserId) setDeactivatingUser(null);
        }}
        onConfirm={deactivateUser}
        open={Boolean(deactivatingUser)}
        title="Deactivate this user?"
      />
    </div>
  );
}
