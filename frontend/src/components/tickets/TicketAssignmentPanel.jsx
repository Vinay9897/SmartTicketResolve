import { useEffect, useState } from "react";
import { UserRound, UsersRound } from "lucide-react";
import toast from "react-hot-toast";
import Button from "../ui/Button.jsx";
import Card, { CardHeader } from "../ui/Card.jsx";
import ErrorState from "../ui/ErrorState.jsx";
import { SelectInput } from "../ui/FormField.jsx";
import {
  assignSupportTicket,
  getAssignableSupportEngineers,
  getAssignableSupportTeams,
} from "../../services/ticketService.js";

function getErrorMessage(error) {
  const message = error.response?.data?.message;
  if (typeof message === "string" && message.trim()) return message;
  if (error.response?.status === 401) return "Your session has expired. Sign in again to assign this ticket.";
  if (error.response?.status === 403) return "Your account is not permitted to assign this ticket.";
  if (error.response?.status === 404) return "The ticket or selected assignment option is no longer available.";
  if (error.response?.status === 409) {
    return "This ticket cannot be assigned in its current state, or the engineer is not a member of the selected team.";
  }
  if (error.isAxiosError && !error.response) {
    return "Could not connect to SmartResolve. Check your connection and try again.";
  }
  if (!error.isAxiosError && error.message) return error.message;
  return "The assignment could not be updated. Please try again.";
}

export default function TicketAssignmentPanel({ ticket, onAssigned }) {
  const [teamId, setTeamId] = useState(ticket.supportTeamId || "");
  const [engineerId, setEngineerId] = useState(ticket.assignedToId || "");
  const [retryCount, setRetryCount] = useState(0);
  const [teamsResult, setTeamsResult] = useState({ key: "", status: "loading", teams: [], error: "" });
  const [engineersResult, setEngineersResult] = useState({
    key: "",
    status: "loading",
    engineers: [],
    error: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const teamsKey = `${ticket.id}:${retryCount}`;
  const engineersKey = `${ticket.id}:${teamId}:${retryCount}`;
  const teamsLoading = teamsResult.key !== teamsKey || teamsResult.status === "loading";
  const engineersLoading = engineersResult.key !== engineersKey || engineersResult.status === "loading";

  useEffect(() => {
    const controller = new AbortController();
    getAssignableSupportTeams({ signal: controller.signal })
      .then((teams) => {
        setTeamsResult({ key: teamsKey, status: "success", teams, error: "" });
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          setTeamsResult({ key: teamsKey, status: "error", teams: [], error: getErrorMessage(error) });
        }
      });
    return () => controller.abort();
  }, [teamsKey]);

  useEffect(() => {
    const controller = new AbortController();
    getAssignableSupportEngineers({ teamId: teamId || undefined, signal: controller.signal })
      .then((engineers) => {
        setEngineersResult({ key: engineersKey, status: "success", engineers, error: "" });
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          setEngineersResult({
            key: engineersKey,
            status: "error",
            engineers: [],
            error: getErrorMessage(error),
          });
        }
      });
    return () => controller.abort();
  }, [engineersKey, teamId]);

  const teams = teamsResult.key === teamsKey ? teamsResult.teams : [];
  const engineers = engineersResult.key === engineersKey ? engineersResult.engineers : [];
  const teamsError = teamsResult.key === teamsKey && teamsResult.status === "error";
  const engineersError = engineersResult.key === engineersKey && engineersResult.status === "error";
  const isClosed = ticket.status === "CLOSED";
  const teamIsAvailable = !teamId || teams.some((team) => team.id === teamId);
  const engineerIsAvailable = engineers.some((engineer) => engineer.id === engineerId);

  function retryOptions() {
    setRetryCount((count) => count + 1);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");
    if (isClosed) {
      setFormError("Closed tickets cannot be assigned.");
      return;
    }
    if (!engineerId || !engineerIsAvailable) {
      setFormError("Select an active support engineer who is eligible for the selected team.");
      return;
    }
    if (!teamIsAvailable) {
      setFormError("Select an active support team or clear the team selection.");
      return;
    }
    if (teamsLoading || engineersLoading || teamsResult.status !== "success" || engineersResult.status !== "success") {
      setFormError("Wait for the assignment options to finish loading.");
      return;
    }

    setSubmitting(true);
    try {
      await assignSupportTicket(ticket.id, {
        assignedToId: engineerId,
        supportTeamId: teamId || null,
      });
      toast.success("Ticket assignment updated.");
      onAssigned();
    } catch (error) {
      setFormError(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader
        description="Choose an active team and an eligible support engineer. The server validates assignment permissions and team membership."
        title="Assignment"
      />
      {teamsError || engineersError ? (
        <ErrorState
          className="min-h-40"
          description={teamsError ? teamsResult.error : engineersResult.error}
          onRetry={retryOptions}
          title="Assignment options are unavailable"
        />
      ) : (
        <form className="grid gap-4 px-5 pb-5 sm:px-6 sm:pb-6" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectInput
              disabled={isClosed || teamsLoading || submitting}
              id="ticket-assignment-team"
              label="Support team"
              onChange={(event) => {
                setTeamId(event.target.value);
                setEngineerId("");
                setFormError("");
              }}
              value={teamId}
            >
              <option value="">{teamsLoading ? "Loading teams..." : "No team"}</option>
              {teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
            </SelectInput>
            <SelectInput
              disabled={isClosed || teamsLoading || engineersLoading || submitting}
              id="ticket-assignment-engineer"
              label="Support engineer"
              onChange={(event) => {
                setEngineerId(event.target.value);
                setFormError("");
              }}
              required
              value={engineerId}
            >
              <option value="">{engineersLoading ? "Loading engineers..." : "Select an engineer"}</option>
              {engineers.map((engineer) => (
                <option key={engineer.id} value={engineer.id}>{engineer.name}</option>
              ))}
            </SelectInput>
          </div>
          {isClosed && (
            <p className="text-sm text-muted" role="status">
              Closed tickets cannot be assigned.
            </p>
          )}
          {engineersResult.key === engineersKey
            && engineersResult.status === "success"
            && engineers.length === 0
            && !isClosed && (
            <p className="text-sm text-muted" role="status">
              {teamId ? "No active engineers are available for this team." : "No active support engineers are available."}
            </p>
            )}
          {formError && <p className="text-sm text-critical" role="alert">{formError}</p>}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
            <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted">
              <span className="inline-flex items-center gap-1.5">
                <UserRound aria-hidden="true" className="size-3.5" />
                Current: {ticket.assignedToName || "Unassigned"}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <UsersRound aria-hidden="true" className="size-3.5" />
                {ticket.supportTeamName || "No team"}
              </span>
            </div>
            <Button
              disabled={isClosed || teamsLoading || engineersLoading || !engineers.length}
              loading={submitting}
              type="submit"
            >
              Save assignment
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
}
