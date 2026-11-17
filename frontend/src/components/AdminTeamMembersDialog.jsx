import { useEffect, useMemo, useState } from "react";
import { Search, UserMinus, UserPlus } from "lucide-react";
import toast from "react-hot-toast";
import {
  assignAdminTeamMembers,
  getAdminTeamMembers,
  unassignAdminTeamMember,
} from "../services/adminTeamService.js";
import { getAllActiveAdminSupportEngineers } from "../services/adminUserService.js";
import Button from "./ui/Button.jsx";
import Card from "./ui/Card.jsx";
import ErrorState from "./ui/ErrorState.jsx";
import Modal from "./ui/Modal.jsx";
import Skeleton from "./ui/Skeleton.jsx";

const EMPTY_LIST = [];

function getErrorMessage(error) {
  const message = error.response?.data?.message;
  if (typeof message === "string" && message.trim()) return message;
  if (error.response?.status === 401) return "Your session has expired. Sign in again to manage team members.";
  if (error.response?.status === 403) return "Only administrators can manage support team members.";
  if (error.response?.status === 404) return "The team or selected engineer is no longer available.";
  if (error.response?.status === 409) {
    return "A selected engineer is inactive, is no longer a support engineer, or is already assigned to this team.";
  }
  if (error.isAxiosError && !error.response) {
    return "Could not connect to SmartResolve. Check your connection and try again.";
  }
  if (error.message) return error.message;
  return "Team membership could not be updated. Please try again.";
}

function MemberSearch({ id, label, value, onChange }) {
  return (
    <label className="relative block">
      <span className="sr-only">{label}</span>
      <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
      <input
        className="min-h-10 w-full rounded-lg border border-line bg-white pl-9 pr-3 text-sm text-ink placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100"
        id={id}
        onChange={(event) => onChange(event.target.value)}
        placeholder={label}
        type="search"
        value={value}
      />
    </label>
  );
}

function MemberListSkeleton() {
  return (
    <div aria-label="Loading team members" className="grid gap-3" role="status">
      {Array.from({ length: 3 }, (_, index) => (
        <Skeleton className="h-14 w-full" key={index} />
      ))}
      <span className="sr-only">Loading assigned and available engineers</span>
    </div>
  );
}

export default function AdminTeamMembersDialog({ team, onClose, onMembershipChanged }) {
  const [retryCount, setRetryCount] = useState(0);
  const [result, setResult] = useState({
    requestId: -1,
    status: "loading",
    members: [],
    engineers: [],
    error: "",
  });
  const [assignedSearch, setAssignedSearch] = useState("");
  const [availableSearch, setAvailableSearch] = useState("");
  const [selectedEngineerIds, setSelectedEngineerIds] = useState([]);
  const [isAssigning, setIsAssigning] = useState(false);
  const [unassigningEngineerId, setUnassigningEngineerId] = useState(null);

  const isLoading = result.requestId !== retryCount;
  const status = isLoading ? "loading" : result.status;
  const members = status === "success" ? result.members : EMPTY_LIST;
  const engineers = status === "success" ? result.engineers : EMPTY_LIST;
  const assignedIds = useMemo(() => new Set(members.map((member) => member.id)), [members]);
  const availableEngineers = useMemo(
    () => engineers.filter((engineer) => !assignedIds.has(engineer.id)),
    [assignedIds, engineers],
  );
  const filteredMembers = useMemo(() => {
    const query = assignedSearch.trim().toLocaleLowerCase();
    return members.filter((member) => (
      !query
      || member.name.toLocaleLowerCase().includes(query)
      || member.email.toLocaleLowerCase().includes(query)
    ));
  }, [assignedSearch, members]);
  const filteredAvailableEngineers = useMemo(() => {
    const query = availableSearch.trim().toLocaleLowerCase();
    return availableEngineers.filter((engineer) => (
      !query
      || engineer.name.toLocaleLowerCase().includes(query)
      || engineer.email.toLocaleLowerCase().includes(query)
    ));
  }, [availableEngineers, availableSearch]);

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      getAdminTeamMembers(team.id, { signal: controller.signal }),
      getAllActiveAdminSupportEngineers({ signal: controller.signal }),
    ])
      .then(([assignedMembers, availableCandidates]) => {
        setResult({
          requestId: retryCount,
          status: "success",
          members: assignedMembers,
          engineers: availableCandidates,
          error: "",
        });
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          setResult({
            requestId: retryCount,
            status: "error",
            members: [],
            engineers: [],
            error: getErrorMessage(error),
          });
        }
      });
    return () => controller.abort();
  }, [retryCount, team.id]);

  function refreshMembers() {
    setRetryCount((count) => count + 1);
  }

  function toggleEngineer(engineerId) {
    setSelectedEngineerIds((current) => (
      current.includes(engineerId)
        ? current.filter((id) => id !== engineerId)
        : [...current, engineerId]
    ));
  }

  async function assignSelectedEngineers() {
    if (!selectedEngineerIds.length || isAssigning) return;
    setIsAssigning(true);
    try {
      const updatedMembers = await assignAdminTeamMembers(team.id, selectedEngineerIds);
      setSelectedEngineerIds([]);
      setResult((current) => ({
        ...current,
        members: updatedMembers,
      }));
      toast.success(selectedEngineerIds.length === 1
        ? "Support engineer assigned to the team."
        : `${selectedEngineerIds.length} support engineers assigned to the team.`);
      onMembershipChanged();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsAssigning(false);
    }
  }

  async function unassignEngineer(member) {
    setUnassigningEngineerId(member.id);
    try {
      await unassignAdminTeamMember(team.id, member.id);
      setResult((current) => ({
        ...current,
        members: current.members.filter((item) => item.id !== member.id),
      }));
      toast.success(`${member.name} was unassigned from the team. Their account was not deleted.`);
      onMembershipChanged();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setUnassigningEngineerId(null);
    }
  }

  return (
    <Modal
      description={`Manage support engineer membership for ${team.name}. Unassigning a member does not delete their account.`}
      onClose={onClose}
      open
      title={`Team members · ${team.name}`}
      footer={status === "success" && (
        <>
          <span className="mr-auto self-center text-xs text-muted">
            {selectedEngineerIds.length} selected
          </span>
          <Button
            disabled={team.active === false || isAssigning || selectedEngineerIds.length === 0}
            loading={isAssigning}
            onClick={assignSelectedEngineers}
            type="button"
          >
            <UserPlus aria-hidden="true" className="size-4" />
            Assign selected
          </Button>
        </>
      )}
    >
      {status === "loading" ? (
        <MemberListSkeleton />
      ) : status === "error" ? (
        <ErrorState
          description={result.error}
          onRetry={refreshMembers}
          title="Team members could not be loaded"
        />
      ) : (
        <div className="grid gap-5">
          {!team.active && (
            <p className="rounded-lg border border-warning/20 bg-warning-soft px-3 py-2 text-sm text-warning" role="status">
              This team is inactive. You can review or unassign members, but cannot add new ones.
            </p>
          )}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="min-w-0 overflow-hidden">
              <div className="border-b border-line px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-ink">Assigned engineers</h3>
                  <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">
                    {members.length}
                  </span>
                </div>
                <MemberSearch
                  id="assigned-engineer-search"
                  label="Search assigned engineers"
                  onChange={setAssignedSearch}
                  value={assignedSearch}
                />
              </div>
              <ul aria-label="Assigned support engineers" className="max-h-80 divide-y divide-line overflow-y-auto">
                {filteredMembers.map((member) => (
                  <li className="flex items-center justify-between gap-3 px-4 py-3" key={member.id}>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800">{member.name}</p>
                      <p className="truncate text-xs text-muted">{member.email}</p>
                      {!member.active && <p className="text-xs text-warning">Account inactive</p>}
                    </div>
                    <Button
                      aria-label={`Unassign ${member.name} from ${team.name}`}
                      className="min-h-9 shrink-0 gap-1 px-2 text-critical"
                      disabled={Boolean(unassigningEngineerId)}
                      loading={unassigningEngineerId === member.id}
                      onClick={() => unassignEngineer(member)}
                      title="Unassign from team"
                      type="button"
                      variant="ghost"
                    >
                      <UserMinus aria-hidden="true" className="size-4" />
                      <span>Unassign</span>
                    </Button>
                  </li>
                ))}
                {filteredMembers.length === 0 && (
                  <li className="px-4 py-8 text-center text-sm text-muted">
                    {members.length ? "No assigned engineers match your search." : "No engineers are assigned to this team."}
                  </li>
                )}
              </ul>
            </Card>

            <Card className="min-w-0 overflow-hidden">
              <div className="border-b border-line px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-ink">Available engineers</h3>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                    {availableEngineers.length}
                  </span>
                </div>
                <MemberSearch
                  id="available-engineer-search"
                  label="Search available engineers"
                  onChange={setAvailableSearch}
                  value={availableSearch}
                />
              </div>
              <ul aria-label="Available support engineers" className="max-h-80 divide-y divide-line overflow-y-auto">
                {filteredAvailableEngineers.map((engineer) => (
                  <li className="flex items-center gap-3 px-4 py-3" key={engineer.id}>
                    <input
                      aria-label={`Select ${engineer.name}`}
                      checked={selectedEngineerIds.includes(engineer.id)}
                      className="size-4 shrink-0 accent-brand-600"
                      disabled={team.active === false || isAssigning}
                      onChange={() => toggleEngineer(engineer.id)}
                      type="checkbox"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800">{engineer.name}</p>
                      <p className="truncate text-xs text-muted">{engineer.email}</p>
                    </div>
                  </li>
                ))}
                {filteredAvailableEngineers.length === 0 && (
                  <li className="px-4 py-8 text-center text-sm text-muted">
                    {availableEngineers.length ? "No available engineers match your search." : "All active support engineers are assigned."}
                  </li>
                )}
              </ul>
            </Card>
          </div>
        </div>
      )}
    </Modal>
  );
}
