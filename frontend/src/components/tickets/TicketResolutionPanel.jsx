import { useEffect, useMemo, useState } from "react";
import { Activity, CheckCircle2, MessageSquareText, Send, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import Badge from "../ui/Badge.jsx";
import Button from "../ui/Button.jsx";
import Card, { CardHeader } from "../ui/Card.jsx";
import ConfirmationDialog from "../ui/ConfirmationDialog.jsx";
import EmptyState from "../ui/EmptyState.jsx";
import ErrorState from "../ui/ErrorState.jsx";
import { TextArea } from "../ui/FormField.jsx";
import Skeleton from "../ui/Skeleton.jsx";
import {
  addSupportTroubleshootingNote,
  changeSupportTicketStatus,
  getAllSupportTicketStatusHistory,
  getAllTicketComments,
  resolveSupportTicket,
} from "../../services/ticketService.js";

function getErrorMessage(error) {
  const message = error.response?.data?.message;
  if (typeof message === "string" && message.trim()) return message;
  if (error.response?.status === 401) return "Your session has expired. Sign in again to continue.";
  if (error.response?.status === 403) return "You do not have permission to update or view activity for this ticket.";
  if (error.response?.status === 404) return "This ticket is no longer available.";
  if (error.response?.status === 409) return "The ticket cannot be updated in its current state.";
  if (error.isAxiosError && !error.response) {
    return "Could not connect to SmartResolve. Check your connection and try again.";
  }
  if (!error.isAxiosError && error.message) return error.message;
  return "The ticket update could not be completed. Please try again.";
}

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function humanizeStatus(status) {
  return String(status || "").toLowerCase().replaceAll("_", " ");
}

function getAvailableTransitions(status) {
  switch (status) {
    case "OPEN":
      return [
        { status: "IN_PROGRESS", label: "Start work" },
        { status: "WAITING_FOR_EMPLOYEE", label: "Request employee update" },
      ];
    case "IN_PROGRESS":
      return [{ status: "WAITING_FOR_EMPLOYEE", label: "Request employee update" }];
    case "WAITING_FOR_EMPLOYEE":
      return [{ status: "IN_PROGRESS", label: "Resume work" }];
    case "RESOLVED":
      return [{ status: "CLOSED", label: "Close ticket" }];
    default:
      return [];
  }
}

function buildActivity(comments, statusHistory) {
  return [
    ...comments.map((comment) => ({
      id: `comment-${comment.id}`,
      kind: "comment",
      at: comment.createdAt,
      actor: comment.userName,
      title: comment.visibility === "INTERNAL" ? "Internal troubleshooting note" : "Ticket comment",
      description: comment.comment,
      internal: comment.visibility === "INTERNAL",
    })),
    ...statusHistory.map((entry) => ({
      id: `status-${entry.id}`,
      kind: "status",
      at: entry.changedAt,
      actor: entry.changedByName || "Support",
      title: entry.fromStatus
        ? `Status changed: ${humanizeStatus(entry.fromStatus)} → ${humanizeStatus(entry.toStatus)}`
        : `Ticket created: ${humanizeStatus(entry.toStatus)}`,
      description: entry.note,
      internal: false,
    })),
  ].sort((left, right) => Date.parse(right.at) - Date.parse(left.at));
}

function ActivityTimeline({ ticketId, reloadKey }) {
  const [retryCount, setRetryCount] = useState(0);
  const requestKey = `${ticketId}:${reloadKey}:${retryCount}`;
  const [result, setResult] = useState({ requestKey: "", status: "loading", items: [], error: "" });
  const isLoading = result.requestKey !== requestKey;
  const status = isLoading ? "loading" : result.status;
  const activity = isLoading ? [] : result.items;

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      getAllTicketComments(ticketId, { signal: controller.signal }),
      getAllSupportTicketStatusHistory(ticketId, { signal: controller.signal }),
    ])
      .then(([comments, history]) => {
        setResult({
          requestKey,
          status: "success",
          items: buildActivity(comments, history),
          error: "",
        });
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          setResult({ requestKey, status: "error", items: [], error: getErrorMessage(error) });
        }
      });
    return () => controller.abort();
  }, [requestKey, ticketId]);

  return (
    <Card>
      <CardHeader
        description="Status changes, employee comments, and internal troubleshooting notes."
        title={(
          <span className="inline-flex items-center gap-2">
            <Activity aria-hidden="true" className="size-4 text-slate-500" />
            Ticket activity
          </span>
        )}
      />
      <div className="px-5 pb-5 sm:px-6">
        {status === "loading" && (
          <div aria-label="Loading ticket activity" className="grid gap-4 py-2" role="status">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <span className="sr-only">Loading ticket activity</span>
          </div>
        )}
        {status === "error" && (
          <ErrorState
            className="min-h-36"
            description={result.error}
            onRetry={() => setRetryCount((count) => count + 1)}
            title="Ticket activity is unavailable"
          />
        )}
        {status === "success" && (activity.length ? (
          <ol aria-label="Ticket activity" className="grid gap-3">
            {activity.map((item) => {
              const Icon = item.kind === "status" ? CheckCircle2 : MessageSquareText;
              return (
                <li className="flex gap-3 rounded-lg border border-line bg-slate-50/60 p-3.5" key={item.id}>
                  <span className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-full ${
                    item.internal ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"
                  }`}>
                    <Icon aria-hidden="true" className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-slate-800">{item.title}</p>
                        {item.internal && <Badge variant="warning">Internal</Badge>}
                      </div>
                      <time className="text-xs text-muted" dateTime={item.at}>{formatDate(item.at)}</time>
                    </div>
                    <p className="mt-1 text-xs text-muted">{item.actor}</p>
                    {item.description && (
                      <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
                        {item.description}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        ) : (
          <EmptyState
            className="min-h-36"
            icon={Activity}
            title="No activity yet"
            description="Ticket status changes and comments will appear here."
          />
        ))}
      </div>
    </Card>
  );
}

export default function TicketResolutionPanel({ ticket, onTicketUpdated }) {
  const [statusNote, setStatusNote] = useState("");
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [troubleshootingNote, setTroubleshootingNote] = useState("");
  const [noteError, setNoteError] = useState("");
  const [resolutionError, setResolutionError] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [isApplyingAction, setIsApplyingAction] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [activityReload, setActivityReload] = useState(0);

  const transitions = useMemo(() => getAvailableTransitions(ticket.status), [ticket.status]);
  const isClosed = ticket.status === "CLOSED";
  const canResolve = ["OPEN", "IN_PROGRESS", "WAITING_FOR_EMPLOYEE"].includes(ticket.status);
  const needsResolutionNotes = ticket.status === "RESOLVED" && !ticket.resolutionNotes?.trim();

  async function submitTroubleshootingNote(event) {
    event.preventDefault();
    const note = troubleshootingNote.trim();
    if (!note) {
      setNoteError("Enter a troubleshooting note before saving.");
      return;
    }
    if (note.length > 10000) {
      setNoteError("Troubleshooting notes must be 10,000 characters or fewer.");
      return;
    }

    setIsSavingNote(true);
    setNoteError("");
    try {
      await addSupportTroubleshootingNote(ticket.id, note);
      setTroubleshootingNote("");
      setActivityReload((count) => count + 1);
      toast.success("Internal troubleshooting note added.");
      onTicketUpdated();
    } catch (error) {
      const message = getErrorMessage(error);
      setNoteError(message);
      toast.error(message);
    } finally {
      setIsSavingNote(false);
    }
  }

  function requestStatusChange(nextStatus, label) {
    setPendingAction({
      kind: nextStatus === "CLOSED" ? "close" : "status",
      status: nextStatus,
      title: nextStatus === "CLOSED" ? "Close this ticket?" : `${label}?`,
      description: nextStatus === "CLOSED"
        ? "This resolved ticket will be closed. Closed tickets cannot be updated."
        : `Change this ticket from ${humanizeStatus(ticket.status)} to ${humanizeStatus(nextStatus)}?`,
    });
  }

  function requestResolution() {
    const notes = resolutionNotes.trim();
    if (!notes) {
      setResolutionError("Resolution notes are required before resolving this ticket.");
      return;
    }
    if (notes.length > 20000) {
      setResolutionError("Resolution notes must be 20,000 characters or fewer.");
      return;
    }
    setResolutionError("");
    setPendingAction({
      kind: "resolve",
      title: "Resolve this ticket?",
      description: "The resolution notes will be saved and the ticket status will become Resolved.",
    });
  }

  async function confirmAction() {
    if (!pendingAction) return;
    setIsApplyingAction(true);
    try {
      if (pendingAction.kind === "resolve") {
        await resolveSupportTicket(ticket.id, { resolutionNotes: resolutionNotes.trim() });
        setResolutionNotes("");
        toast.success("Ticket resolved.");
      } else {
        await changeSupportTicketStatus(ticket.id, {
          status: pendingAction.status,
          note: pendingAction.kind === "close" ? "Ticket closed after resolution" : statusNote.trim() || null,
        });
        setStatusNote("");
        toast.success(pendingAction.kind === "close"
          ? "Ticket closed."
          : `Ticket status changed to ${humanizeStatus(pendingAction.status)}.`);
      }
      setPendingAction(null);
      setActivityReload((count) => count + 1);
      onTicketUpdated();
    } catch (error) {
      const message = getErrorMessage(error);
      if (pendingAction.kind === "resolve") setResolutionError(message);
      else setNoteError(message);
      toast.error(message);
    } finally {
      setIsApplyingAction(false);
    }
  }

  return (
    <>
      <Card>
        <CardHeader
          description="Update status using supported transitions, record internal troubleshooting, and resolve or close the ticket."
          title="Resolution and status"
          action={<Badge variant={isClosed ? "neutral" : "info"}>{humanizeStatus(ticket.status)}</Badge>}
        />
        <div className="grid gap-5 px-5 pb-5 sm:px-6 sm:pb-6">
          {!isClosed && transitions.length > 0 && (
            <section className="grid gap-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Available status actions</h3>
              <TextArea
                id={`ticket-status-note-${ticket.id}`}
                label="Status activity note (optional)"
                maxLength={1000}
                onChange={(event) => setStatusNote(event.target.value)}
                rows={2}
                value={statusNote}
              />
              <div className="flex flex-wrap gap-2">
                {transitions.map((transition) => (
                  <Button
                    disabled={isApplyingAction || (transition.status === "CLOSED" && needsResolutionNotes)}
                    key={transition.status}
                    onClick={() => requestStatusChange(transition.status, transition.label)}
                    type="button"
                    variant="secondary"
                  >
                    {transition.label}
                  </Button>
                ))}
              </div>
            </section>
          )}

          {canResolve && (
            <section className="grid gap-3 border-t border-line pt-5">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Resolve ticket</h3>
              <TextArea
                disabled={isApplyingAction}
                error={resolutionError}
                id={`ticket-resolution-notes-${ticket.id}`}
                label="Resolution notes"
                maxLength={20000}
                onChange={(event) => {
                  setResolutionNotes(event.target.value);
                  if (resolutionError) setResolutionError("");
                }}
                placeholder="Describe the troubleshooting performed and the resolution..."
                required
                rows={4}
                value={resolutionNotes}
              />
              <div>
                <Button disabled={isClosed || isApplyingAction} onClick={requestResolution} type="button">
                  <CheckCircle2 aria-hidden="true" className="size-4" />
                  Resolve ticket
                </Button>
              </div>
            </section>
          )}

          {ticket.status === "RESOLVED" && (
            <div className="border-t border-line pt-5">
              {needsResolutionNotes ? (
                <p className="text-sm text-warning" role="alert">
                  This resolved ticket has no resolution notes, so the backend will not allow it to be closed.
                </p>
              ) : (
                <p className="text-sm text-muted">
                  The ticket is resolved. Close it when no further support work is needed.
                </p>
              )}
            </div>
          )}

          {isClosed && (
            <p className="text-sm text-muted" role="status">
              This ticket is closed. The backend does not allow further updates.
            </p>
          )}

          {!isClosed && (
            <form className="grid gap-3 border-t border-line pt-5" onSubmit={submitTroubleshootingNote}>
              <TextArea
                disabled={isSavingNote}
                error={noteError}
                id={`ticket-troubleshooting-note-${ticket.id}`}
                label="Add internal troubleshooting note"
                maxLength={10000}
                onChange={(event) => {
                  setTroubleshootingNote(event.target.value);
                  if (noteError) setNoteError("");
                }}
                placeholder="Record investigation steps for the support team..."
                rows={3}
                value={troubleshootingNote}
              />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="inline-flex items-center gap-1.5 text-xs text-muted">
                  <ShieldCheck aria-hidden="true" className="size-3.5" />
                  Internal note; not visible to the employee.
                </p>
                <Button loading={isSavingNote} type="submit" variant="secondary">
                  <Send aria-hidden="true" className="size-4" />
                  Add note
                </Button>
              </div>
            </form>
          )}
        </div>
      </Card>

      <ActivityTimeline
        key={ticket.id}
        reloadKey={activityReload}
        ticketId={ticket.id}
      />

      <ConfirmationDialog
        confirmText={pendingAction?.kind === "resolve"
          ? "Resolve ticket"
          : pendingAction?.kind === "close"
            ? "Close ticket"
            : "Confirm status"}
        description={pendingAction?.description}
        loading={isApplyingAction}
        onClose={() => {
          if (!isApplyingAction) setPendingAction(null);
        }}
        onConfirm={confirmAction}
        open={Boolean(pendingAction)}
        title={pendingAction?.title}
      />
    </>
  );
}
