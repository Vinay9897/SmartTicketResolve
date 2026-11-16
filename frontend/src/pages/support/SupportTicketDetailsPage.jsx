import { useEffect, useState } from "react";
import { ArrowLeft, CalendarDays, UsersRound, UserRound } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { PriorityBadge, StatusBadge } from "../../components/ui/Badge.jsx";
import Card, { CardHeader } from "../../components/ui/Card.jsx";
import ErrorState from "../../components/ui/ErrorState.jsx";
import PageHeading from "../../components/ui/PageHeading.jsx";
import Skeleton from "../../components/ui/Skeleton.jsx";
import SupportAiAnalysisPanel from "../../components/tickets/SupportAiAnalysisPanel.jsx";
import TicketAssignmentPanel from "../../components/tickets/TicketAssignmentPanel.jsx";
import TicketResolutionPanel from "../../components/tickets/TicketResolutionPanel.jsx";
import { getSupportTicketById } from "../../services/ticketService.js";

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function getErrorMessage(error) {
  const message = error.response?.data?.message;
  if (typeof message === "string" && message.trim()) return message;
  if (error.response?.status === 401) return "Your session has expired. Sign in again to view this ticket.";
  if (error.response?.status === 403) return "Your account cannot access this ticket.";
  if (error.response?.status === 404) return "This ticket is not available in your support queue.";
  if (error.isAxiosError && !error.response) {
    return "Could not connect to SmartResolve. Check your connection and try again.";
  }
  if (!error.isAxiosError && error.message) return error.message;
  return "Ticket details could not be loaded. Please try again.";
}

function TicketDetailsSkeleton() {
  return (
    <div aria-label="Loading support ticket" className="grid gap-6" role="status">
      <div>
        <Skeleton className="h-7 w-52" />
        <Skeleton className="mt-3 h-4 w-72 max-w-full" />
      </div>
      <Card className="grid gap-5 p-5 sm:p-6">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </Card>
      <span className="sr-only">Loading support ticket details</span>
    </div>
  );
}

function TicketMetadata({ ticket }) {
  const items = [
    { label: "Submitted by", value: ticket.createdByName, icon: UserRound },
    { label: "Assigned engineer", value: ticket.assignedToName || "Unassigned", icon: UserRound },
    { label: "Support team", value: ticket.supportTeamName || "Not assigned", icon: UsersRound },
    { label: "Created", value: formatDate(ticket.createdAt), icon: CalendarDays },
    { label: "Last updated", value: formatDate(ticket.updatedAt), icon: CalendarDays },
  ];

  return (
    <dl className="grid gap-4 border-t border-line pt-5 sm:grid-cols-2">
      {items.map(({ label, value, icon: Icon }) => (
        <div className="flex items-start gap-2.5" key={label}>
          <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-slate-400" />
          <div className="min-w-0">
            <dt className="text-[11px] font-medium uppercase tracking-wide text-muted">{label}</dt>
            <dd className="mt-1 break-words text-sm text-slate-700">{value}</dd>
          </div>
        </div>
      ))}
    </dl>
  );
}

export default function SupportTicketDetailsPage() {
  const { ticketId } = useParams();
  const [retryCount, setRetryCount] = useState(0);
  const requestKey = `${ticketId}:${retryCount}`;
  const [result, setResult] = useState({ requestKey: "", status: "loading", ticket: null, error: "" });
  const isLoading = result.requestKey !== requestKey;
  const status = isLoading ? "loading" : result.status;

  useEffect(() => {
    const controller = new AbortController();
    getSupportTicketById(ticketId, { signal: controller.signal })
      .then((ticket) => {
        setResult({ requestKey, status: "success", ticket, error: "" });
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          setResult({
            requestKey,
            status: "error",
            ticket: null,
            error: getErrorMessage(error),
          });
        }
      });

    return () => controller.abort();
  }, [requestKey, ticketId]);

  if (status === "loading") return <TicketDetailsSkeleton />;
  if (status === "error") {
    return (
      <div className="mx-auto max-w-3xl">
        <ErrorState
          description={result.error}
          onRetry={() => setRetryCount((count) => count + 1)}
          title="Ticket details are unavailable"
        />
      </div>
    );
  }

  const { ticket } = result;
  return (
    <div className="mx-auto grid max-w-4xl gap-6">
      <PageHeading
        actions={(
          <Link
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-line bg-white px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            to="/support/tickets"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            Ticket queue
          </Link>
        )}
        description={`Ticket ID: ${ticket.id}`}
        eyebrow="Support ticket"
        title={ticket.title}
      />

      <Card>
        <CardHeader
          description="Ticket information for tickets accessible through your support queue."
          title="Ticket details"
        />
        <div className="grid gap-5 px-5 pb-5 sm:px-6 sm:pb-6">
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted">Status</span>
              <StatusBadge status={ticket.status} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted">Priority</span>
              <PriorityBadge priority={ticket.priority} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted">Category</span>
              <span className="text-sm font-medium text-slate-700">{ticket.categoryName || "Uncategorized"}</span>
            </div>
          </div>

          <section aria-labelledby="support-ticket-description" className="border-t border-line pt-5">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted" id="support-ticket-description">
              Description
            </h2>
            <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">
              {ticket.description}
            </p>
          </section>

          {ticket.issueSummary && (
            <section aria-labelledby="support-ticket-summary" className="border-t border-line pt-5">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted" id="support-ticket-summary">
                Issue summary
              </h2>
              <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
                {ticket.issueSummary}
              </p>
            </section>
          )}

          {ticket.resolutionNotes && (
            <section aria-labelledby="support-ticket-resolution" className="border-t border-line pt-5">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted" id="support-ticket-resolution">
                Resolution notes
              </h2>
              <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
                {ticket.resolutionNotes}
              </p>
            </section>
          )}

          <TicketMetadata ticket={ticket} />
        </div>
      </Card>
      <TicketResolutionPanel
        key={`${ticket.id}:${ticket.updatedAt}`}
        onTicketUpdated={() => setRetryCount((count) => count + 1)}
        ticket={ticket}
      />
      <SupportAiAnalysisPanel key={ticket.id} ticketId={ticket.id} />
      <TicketAssignmentPanel
        key={`${ticket.id}:${ticket.updatedAt}`}
        onAssigned={() => setRetryCount((count) => count + 1)}
        ticket={ticket}
      />
    </div>
  );
}
