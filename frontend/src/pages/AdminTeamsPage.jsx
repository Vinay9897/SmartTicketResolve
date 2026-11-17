import { useEffect, useState } from "react";
import { Eye, Pencil, Plus, ToggleLeft, ToggleRight, UsersRound } from "lucide-react";
import toast from "react-hot-toast";
import AdminTeamFormDialog from "../components/AdminTeamFormDialog.jsx";
import AdminTeamMembersDialog from "../components/AdminTeamMembersDialog.jsx";
import Badge from "../components/ui/Badge.jsx";
import Button from "../components/ui/Button.jsx";
import Card, { CardHeader } from "../components/ui/Card.jsx";
import ConfirmationDialog from "../components/ui/ConfirmationDialog.jsx";
import DataTable from "../components/ui/DataTable.jsx";
import ErrorState from "../components/ui/ErrorState.jsx";
import Modal from "../components/ui/Modal.jsx";
import PageHeading from "../components/ui/PageHeading.jsx";
import Skeleton from "../components/ui/Skeleton.jsx";
import {
  deactivateAdminTeam,
  getAdminTeamOverviews,
  updateAdminTeam,
} from "../services/adminTeamService.js";

function getErrorMessage(error) {
  const message = error.response?.data?.message;
  if (typeof message === "string" && message.trim()) return message;
  if (error.response?.status === 401) return "Your session has expired. Sign in again to manage support teams.";
  if (error.response?.status === 403) return "Only administrators can access support team management.";
  if (error.response?.status === 404) return "This support team is no longer available.";
  if (error.response?.status === 409) return "The support team update conflicts with an existing team.";
  if (error.isAxiosError && !error.response) {
    return "Could not connect to SmartResolve. Check your connection and try again.";
  }
  if (error.message) return error.message;
  return "Support team data could not be loaded. Please try again.";
}

function TeamListSkeleton() {
  return (
    <div aria-label="Loading support teams" className="grid gap-4 p-5" role="status">
      {Array.from({ length: 5 }, (_, index) => (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4" key={index}>
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-4 w-full max-w-56" />
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-8 w-24" />
        </div>
      ))}
      <span className="sr-only">Loading support team records</span>
    </div>
  );
}

function TeamDetailsDialog({ team, onClose }) {
  return (
    <Modal
      description="Team information returned by the administrator support team API."
      onClose={onClose}
      open
      title="Support team details"
    >
      <dl className="grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted">Name</dt>
          <dd className="mt-1 break-words text-sm text-slate-800">{team.name}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted">Status</dt>
          <dd className="mt-1">
            <Badge variant={team.active ? "success" : "neutral"}>
              {team.active ? "Active" : "Inactive"}
            </Badge>
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs font-medium uppercase tracking-wide text-muted">Description</dt>
          <dd className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
            {team.description || "No description provided."}
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs font-medium uppercase tracking-wide text-muted">Team ID</dt>
          <dd className="mt-1 break-all font-mono text-xs text-slate-600">{team.id}</dd>
        </div>
      </dl>
      <p className="mt-5 rounded-lg bg-slate-50 px-3 py-2 text-xs leading-5 text-muted">
        Assigned engineers: {team.memberCount}
      </p>
    </Modal>
  );
}

export default function AdminTeamsPage() {
  const [retryCount, setRetryCount] = useState(0);
  const [result, setResult] = useState({ requestId: -1, status: "loading", teams: [], error: "" });
  const [dialog, setDialog] = useState(null);
  const [managingTeam, setManagingTeam] = useState(null);
  const [deactivatingTeam, setDeactivatingTeam] = useState(null);
  const [changingTeamId, setChangingTeamId] = useState(null);

  const isLoading = result.requestId !== retryCount;
  const teams = !isLoading && result.status === "success" ? result.teams : [];
  const error = !isLoading && result.status === "error" ? result.error : "";

  useEffect(() => {
    const controller = new AbortController();
    getAdminTeamOverviews({ signal: controller.signal })
      .then((items) => {
        setResult({ requestId: retryCount, status: "success", teams: items, error: "" });
      })
      .catch((requestError) => {
        if (!controller.signal.aborted) {
          setResult({
            requestId: retryCount,
            status: "error",
            teams: [],
            error: getErrorMessage(requestError),
          });
        }
      });
    return () => controller.abort();
  }, [retryCount]);

  function refreshTeams() {
    setRetryCount((count) => count + 1);
  }

  async function reactivateTeam(team) {
    setChangingTeamId(team.id);
    try {
      await updateAdminTeam(team.id, {
        name: team.name,
        description: team.description,
        active: true,
      });
      toast.success("Support team activated.");
      refreshTeams();
    } catch (requestError) {
      toast.error(getErrorMessage(requestError));
    } finally {
      setChangingTeamId(null);
    }
  }

  async function deactivateTeam() {
    if (!deactivatingTeam) return;
    setChangingTeamId(deactivatingTeam.id);
    try {
      await deactivateAdminTeam(deactivatingTeam.id);
      toast.success("Support team deactivated.");
      setDeactivatingTeam(null);
      refreshTeams();
    } catch (requestError) {
      toast.error(getErrorMessage(requestError));
    } finally {
      setChangingTeamId(null);
    }
  }

  const columns = [
    {
      key: "name",
      header: "Support team",
      render: (team) => <span className="font-medium text-slate-800">{team.name}</span>,
    },
    {
      key: "description",
      header: "Description",
      render: (team) => (
        <span className="block max-w-xl truncate text-slate-600">
          {team.description || "—"}
        </span>
      ),
    },
    {
      key: "memberCount",
      header: "Members",
      className: "whitespace-nowrap",
      render: (team) => (
        <span className="inline-flex items-center gap-1.5 text-sm text-slate-700">
          <UsersRound aria-hidden="true" className="size-4 text-slate-400" />
          {team.memberCount}
        </span>
      ),
    },
    {
      key: "active",
      header: "Status",
      render: (team) => (
        <Badge variant={team.active ? "success" : "neutral"}>
          {team.active ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      className: "whitespace-nowrap",
      render: (team) => (
        <div className="flex items-center gap-2">
          <Button
            aria-label={`Manage members of ${team.name}`}
            className="size-10 shrink-0 px-0"
            onClick={() => setManagingTeam(team)}
            title="Manage team members"
            type="button"
            variant="ghost"
          >
            <UsersRound aria-hidden="true" className="size-5 shrink-0" />
          </Button>
          <Button
            aria-label={`View ${team.name} details`}
            className="size-10 shrink-0 px-0"
            onClick={() => setDialog({ kind: "details", team })}
            title="View details"
            type="button"
            variant="ghost"
          >
            <Eye aria-hidden="true" className="size-5 shrink-0" />
          </Button>
          <Button
            aria-label={`Edit ${team.name}`}
            className="size-10 shrink-0 px-0"
            onClick={() => setDialog({ kind: "edit", team })}
            title="Edit team"
            type="button"
            variant="ghost"
          >
            <Pencil aria-hidden="true" className="size-5 shrink-0" />
          </Button>
          {team.active ? (
            <Button
              aria-label={`Deactivate ${team.name}`}
              className="size-10 shrink-0 px-0 text-critical"
              disabled={Boolean(changingTeamId)}
              onClick={() => setDeactivatingTeam(team)}
              title="Deactivate team"
              type="button"
              variant="ghost"
            >
              <ToggleLeft aria-hidden="true" className="size-5 shrink-0" />
            </Button>
          ) : (
            <Button
              aria-label={`Activate ${team.name}`}
              className="size-10 shrink-0 px-0 text-success"
              disabled={Boolean(changingTeamId)}
              onClick={() => reactivateTeam(team)}
              title="Activate team"
              type="button"
              variant="ghost"
            >
              <ToggleRight aria-hidden="true" className="size-5 shrink-0" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="mx-auto grid max-w-[1480px] gap-6">
        <PageHeading
          description="Create and maintain the teams that handle support tickets."
          eyebrow="Administration"
          title="Support teams"
        />
        <Card className="overflow-hidden">
          <CardHeader title="Support teams" />
          <TeamListSkeleton />
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl">
        <PageHeading
          description="Create and maintain the teams that handle support tickets."
          eyebrow="Administration"
          title="Support teams"
        />
        <ErrorState
          className="mt-6"
          description={error}
          onRetry={refreshTeams}
          title="Support teams could not be loaded"
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
            Create team
          </Button>
        )}
        description="Create and maintain the teams that handle support tickets."
        eyebrow="Administration"
        title="Support teams"
      />

      <Card className="overflow-hidden">
        <CardHeader
          description="Inactive teams remain associated with historical tickets and can be reactivated."
          title="Support teams"
        />
        <DataTable
          columns={columns}
          emptyDescription="Create a support team to organize ticket assignment and reporting."
          emptyTitle="No support teams yet"
          rows={teams}
        />
      </Card>

      {dialog?.kind === "details" && (
        <TeamDetailsDialog team={dialog.team} onClose={() => setDialog(null)} />
      )}
      {managingTeam && (
        <AdminTeamMembersDialog
          key={managingTeam.id}
          onClose={() => setManagingTeam(null)}
          onMembershipChanged={refreshTeams}
          team={managingTeam}
        />
      )}
      {(dialog?.kind === "create" || dialog?.kind === "edit") && (
        <AdminTeamFormDialog
          key={dialog.kind === "edit" ? dialog.team.id : "create-team"}
          mode={dialog.kind}
          onClose={() => setDialog(null)}
          onSaved={refreshTeams}
          team={dialog.team}
          teams={teams}
        />
      )}
      <ConfirmationDialog
        confirmText="Deactivate team"
        description={deactivatingTeam
          ? `Deactivate "${deactivatingTeam.name}"? It will remain associated with historical tickets but won't be available for new assignments.`
          : ""}
        destructive
        loading={Boolean(deactivatingTeam && changingTeamId === deactivatingTeam.id)}
        onClose={() => {
          if (!changingTeamId) setDeactivatingTeam(null);
        }}
        onConfirm={deactivateTeam}
        open={Boolean(deactivatingTeam)}
        title="Deactivate this support team?"
      />
    </div>
  );
}
