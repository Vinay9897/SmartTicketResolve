import { useEffect, useState } from "react";
import { Eye, UsersRound } from "lucide-react";
import toast from "react-hot-toast";
import { PriorityBadge, StatusBadge } from "../components/ui/Badge.jsx";
import Button from "../components/ui/Button.jsx";
import Card, { CardHeader } from "../components/ui/Card.jsx";
import DataTable from "../components/ui/DataTable.jsx";
import ErrorState from "../components/ui/ErrorState.jsx";
import { SelectInput } from "../components/ui/FormField.jsx";
import Modal from "../components/ui/Modal.jsx";
import PageHeading from "../components/ui/PageHeading.jsx";
import Pagination from "../components/ui/Pagination.jsx";
import Skeleton from "../components/ui/Skeleton.jsx";
import { getAdminTeams } from "../services/adminTeamService.js";
import {
  getAdminTicketById,
  getAdminTicketsPage,
  assignAdminTicket,
} from "../services/adminTicketService.js";
import { getAllActiveAdminSupportEngineers } from "../services/adminUserService.js";

const PAGE_SIZE = 20;

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
  if (error.response?.status === 401) return "Your session has expired. Sign in again to view administrator tickets.";
  if (error.response?.status === 403) return "Only administrators can access ticket management.";
  if (error.response?.status === 404) return "This ticket is no longer available.";
  if (error.response?.status === 409) {
    return "This ticket cannot be assigned in its current state, or the engineer is not a member of the selected team.";
  }
  if (error.isAxiosError && !error.response) {
    return "Could not connect to SmartResolve. Check your connection and try again.";
  }
  if (error.message) return error.message;
  return "Administrator ticket data could not be loaded. Please try again.";
}

function TicketListSkeleton() {
  return (
    <div aria-label="Loading administrator tickets" className="grid gap-4 p-5" role="status">
      {Array.from({ length: 6 }, (_, index) => (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4" key={index}>
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-full max-w-56" />
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-8 w-20" />
        </div>
      ))}
      <span className="sr-only">Loading ticket records</span>
    </div>
  );
}

function TicketDetailsDialog({ ticketId, onClose }) {
  const [result, setResult] = useState({ status: "loading", ticket: null, error: "" });

  useEffect(() => {
    const controller = new AbortController();
    getAdminTicketById(ticketId, { signal: controller.signal })
      .then((ticket) => setResult({ status: "success", ticket, error: "" }))
      .catch((error) => {
        if (!controller.signal.aborted) {
          setResult({ status: "error", ticket: null, error: getErrorMessage(error) });
        }
      });
    return () => controller.abort();
  }, [ticketId]);

  return (
    <Modal
      description="Ticket details returned by the administrator ticket API."
      onClose={onClose}
      open
      title="Ticket details"
    >
      {result.status === "loading" ? (
        <div aria-label="Loading ticket details" className="grid gap-4" role="status">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <span className="sr-only">Loading ticket details</span>
        </div>
      ) : result.status === "error" ? (
        <ErrorState description={result.error} title="Ticket details are unavailable" />
      ) : (
        <div className="grid gap-5">
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={result.ticket.status} />
            <PriorityBadge priority={result.ticket.priority} />
          </div>
          <section>
            <h3 className="text-sm font-semibold text-ink">{result.ticket.title}</h3>
            <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
              {result.ticket.description}
            </p>
          </section>
          {result.ticket.issueSummary && (
            <section className="border-t border-line pt-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Issue summary</h3>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                {result.ticket.issueSummary}
              </p>
            </section>
          )}
          {result.ticket.resolutionNotes && (
            <section className="border-t border-line pt-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Resolution notes</h3>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                {result.ticket.resolutionNotes}
              </p>
            </section>
          )}
          <dl className="grid gap-3 border-t border-line pt-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted">Ticket ID</dt>
              <dd className="mt-1 break-all font-mono text-xs text-slate-600">{result.ticket.id}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted">Category</dt>
              <dd className="mt-1 text-sm text-slate-700">{result.ticket.categoryName || "Uncategorized"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted">Submitted by</dt>
              <dd className="mt-1 text-sm text-slate-700">{result.ticket.createdByName}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted">Assigned engineer</dt>
              <dd className="mt-1 text-sm text-slate-700">{result.ticket.assignedToName || "Unassigned"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted">Support team</dt>
              <dd className="mt-1 text-sm text-slate-700">{result.ticket.supportTeamName || "No team"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted">Created</dt>
              <dd className="mt-1 text-sm text-slate-700">{formatDate(result.ticket.createdAt)}</dd>
            </div>
          </dl>
        </div>
      )}
    </Modal>
  );
}

function TicketAssignmentDialog({ ticket, onClose, onAssigned }) {
  const [options, setOptions] = useState({ status: "loading", engineers: [], teams: [], error: "" });
  const [engineerId, setEngineerId] = useState(ticket.assignedToId || "");
  const [teamId, setTeamId] = useState(ticket.supportTeamId || "");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      getAllActiveAdminSupportEngineers({ signal: controller.signal }),
      getAdminTeams({ signal: controller.signal }),
    ])
      .then(([engineers, teams]) => {
        const activeTeams = teams.filter((team) => team.active);
        setOptions({ status: "success", engineers, teams: activeTeams, error: "" });
        setEngineerId((current) => engineers.some((engineer) => engineer.id === current) ? current : "");
        setTeamId((current) => activeTeams.some((team) => team.id === current) ? current : "");
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          setOptions({ status: "error", engineers: [], teams: [], error: getErrorMessage(error) });
        }
      });
    return () => controller.abort();
  }, []);

  async function submitAssignment(event) {
    event.preventDefault();
    setFormError("");
    if (!engineerId || !options.engineers.some((engineer) => engineer.id === engineerId)) {
      setFormError("Select an active support engineer.");
      return;
    }
    if (teamId && !options.teams.some((team) => team.id === teamId)) {
      setFormError("Select an active support team or clear the team selection.");
      return;
    }

    setIsSubmitting(true);
    try {
      await assignAdminTicket(ticket.id, {
        assignedToId: engineerId,
        supportTeamId: teamId || null,
      });
      toast.success("Ticket assignment updated.");
      onAssigned();
      onClose();
    } catch (error) {
      const message = getErrorMessage(error);
      setFormError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal
      description="Choose an active support engineer and, optionally, a team. The backend validates team membership."
      onClose={() => {
        if (!isSubmitting) onClose();
      }}
      open
      title="Assign ticket"
      footer={options.status === "success" && (
        <>
          <Button disabled={isSubmitting} onClick={onClose} type="button" variant="secondary">
            Cancel
          </Button>
          <Button
            disabled={isSubmitting || ticket.status === "CLOSED" || options.engineers.length === 0}
            form="admin-ticket-assignment-form"
            loading={isSubmitting}
            type="submit"
          >
            Save assignment
          </Button>
        </>
      )}
    >
      {options.status === "loading" ? (
        <div aria-label="Loading assignment options" className="grid gap-4" role="status">
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
          <span className="sr-only">Loading assignment options</span>
        </div>
      ) : options.status === "error" ? (
        <ErrorState description={options.error} title="Assignment options are unavailable" />
      ) : (
        <form className="grid gap-4" id="admin-ticket-assignment-form" onSubmit={submitAssignment}>
          {ticket.status === "CLOSED" && (
            <p className="text-sm text-muted" role="status">Closed tickets cannot be assigned.</p>
          )}
          {options.engineers.length === 0 && (
            <p className="text-sm text-muted" role="status">No active support engineers are available.</p>
          )}
          <SelectInput
            disabled={isSubmitting || ticket.status === "CLOSED"}
            id="admin-ticket-assigned-engineer"
            label="Support engineer"
            onChange={(event) => setEngineerId(event.target.value)}
            required
            value={engineerId}
          >
            <option value="">Select an engineer</option>
            {options.engineers.map((engineer) => (
              <option key={engineer.id} value={engineer.id}>{engineer.name}</option>
            ))}
          </SelectInput>
          <SelectInput
            disabled={isSubmitting || ticket.status === "CLOSED"}
            id="admin-ticket-support-team"
            label="Support team (optional)"
            onChange={(event) => setTeamId(event.target.value)}
            value={teamId}
          >
            <option value="">No team</option>
            {options.teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
          </SelectInput>
          <p className="text-xs leading-5 text-muted">
            Engineer-to-team membership is not exposed by the admin APIs. If the selection is not valid, the backend will reject it.
          </p>
          {formError && <p className="text-sm text-critical" role="alert">{formError}</p>}
        </form>
      )}
    </Modal>
  );
}

const columns = [
  {
    key: "id",
    header: "Ticket ID",
    className: "whitespace-nowrap",
    render: (ticket) => <span className="font-mono text-xs">{ticket.id.slice(0, 8)}</span>,
  },
  {
    key: "title",
    header: "Title",
    render: (ticket) => <span className="block min-w-40 truncate font-medium text-slate-800">{ticket.title}</span>,
  },
  {
    key: "createdByName",
    header: "Submitted by",
  },
  {
    key: "categoryName",
    header: "Category",
    render: (ticket) => ticket.categoryName || <span className="text-muted">Uncategorized</span>,
  },
  {
    key: "priority",
    header: "Priority",
    render: (ticket) => <PriorityBadge priority={ticket.priority} />,
  },
  {
    key: "status",
    header: "Status",
    render: (ticket) => <StatusBadge status={ticket.status} />,
  },
  {
    key: "assignedToName",
    header: "Assigned engineer",
    render: (ticket) => ticket.assignedToName || <span className="text-muted">Unassigned</span>,
  },
  {
    key: "createdAt",
    header: "Created",
    className: "whitespace-nowrap",
    render: (ticket) => formatDate(ticket.createdAt),
  },
];

export default function AdminTicketsPage() {
  const [page, setPage] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const requestKey = `${page}:${retryCount}`;
  const [result, setResult] = useState({ requestKey: "", status: "loading", data: null, error: "" });
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [assigningTicket, setAssigningTicket] = useState(null);
  const isLoading = result.requestKey !== requestKey;
  const requestStatus = isLoading ? "loading" : result.status;
  const pageData = requestStatus === "success" ? result.data : null;

  useEffect(() => {
    const controller = new AbortController();
    getAdminTicketsPage({
      page,
      size: PAGE_SIZE,
      sortBy: "createdAt",
      direction: "DESC",
      signal: controller.signal,
    })
      .then((data) => setResult({ requestKey, status: "success", data, error: "" }))
      .catch((error) => {
        if (!controller.signal.aborted) {
          setResult({ requestKey, status: "error", data: null, error: getErrorMessage(error) });
        }
      });
    return () => controller.abort();
  }, [page, requestKey]);

  function refreshTickets() {
    setRetryCount((count) => count + 1);
  }

  const ticketColumns = [
    ...columns,
    {
      key: "actions",
      header: "Actions",
      className: "whitespace-nowrap",
      render: (ticket) => (
        <div className="flex items-center gap-2">
          <Button
            aria-label={`View ticket ${ticket.id}`}
            className="size-10 shrink-0 px-0"
            onClick={() => setSelectedTicketId(ticket.id)}
            title="View ticket"
            type="button"
            variant="ghost"
          >
            <Eye aria-hidden="true" className="size-5 shrink-0" />
          </Button>
          <Button
            aria-label={`Assign ticket ${ticket.id}`}
            className="size-10 shrink-0 px-0"
            disabled={ticket.status === "CLOSED"}
            onClick={() => setAssigningTicket(ticket)}
            title="Assign ticket"
            type="button"
            variant="ghost"
          >
            <UsersRound aria-hidden="true" className="size-5 shrink-0" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="mx-auto grid max-w-[1480px] gap-6">
      <PageHeading
        description="Review organization-wide tickets and manage assignment using administrator APIs."
        eyebrow="Administration"
        title="Tickets"
      />

      <Card className="overflow-hidden">
        <CardHeader
          description="Tickets are sorted by creation date. The backend does not currently provide admin ticket search or filters."
          title="All tickets"
        />
        {requestStatus === "loading" ? (
          <TicketListSkeleton />
        ) : requestStatus === "error" ? (
          <ErrorState
            description={result.error}
            onRetry={refreshTickets}
            title="Tickets could not be loaded"
          />
        ) : (
          <>
            <DataTable
              columns={ticketColumns}
              emptyDescription="Tickets will appear here after employees submit support requests."
              emptyTitle="No tickets found"
              rows={pageData.content}
            />
            {pageData.totalElements > 0 && (
              <Pagination
                itemLabel="tickets"
                onPageChange={(nextPage) => setPage(nextPage - 1)}
                page={page + 1}
                pageSize={pageData.size}
                totalItems={pageData.totalElements}
              />
            )}
          </>
        )}
      </Card>

      {selectedTicketId && (
        <TicketDetailsDialog
          key={selectedTicketId}
          onClose={() => setSelectedTicketId(null)}
          ticketId={selectedTicketId}
        />
      )}
      {assigningTicket && (
        <TicketAssignmentDialog
          key={`${assigningTicket.id}:${assigningTicket.updatedAt}`}
          onAssigned={() => {
            setAssigningTicket(null);
            refreshTickets();
          }}
          onClose={() => setAssigningTicket(null)}
          ticket={assigningTicket}
        />
      )}
    </div>
  );
}
