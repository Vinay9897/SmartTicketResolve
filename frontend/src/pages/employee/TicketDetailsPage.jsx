import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  CircleAlert,
  MessageSquareText,
  Send,
  Sparkles,
  UserRound,
  UsersRound,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import AiRecommendationCard from "../../components/ui/AiRecommendationCard.jsx";
import { PriorityBadge, StatusBadge } from "../../components/ui/Badge.jsx";
import Button from "../../components/ui/Button.jsx";
import Card, { CardHeader } from "../../components/ui/Card.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import ErrorState from "../../components/ui/ErrorState.jsx";
import { TextArea } from "../../components/ui/FormField.jsx";
import PageHeading from "../../components/ui/PageHeading.jsx";
import Skeleton from "../../components/ui/Skeleton.jsx";
import {
  addTicketComment,
  getAllTicketComments,
  getTicketAiAnalysis,
  getTicketById,
  generateTicketAiAnalysis,
} from "../../services/ticketService.js";

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
  if (error.response?.status === 404) return "This ticket could not be found or is not available to your account.";
  if (error.isAxiosError && !error.response) {
    return "Could not connect to SmartResolve. Check your connection and try again.";
  }
  if (!error.isAxiosError && error.message) return error.message;
  return "Ticket details could not be loaded. Please try again.";
}

function getCommentErrorMessage(error) {
  const message = error.response?.data?.message;
  if (typeof message === "string" && message.trim()) return message;
  if (error.response?.status === 401) return "Your session has expired. Sign in again to comment.";
  if (error.response?.status === 403) return "You do not have permission to comment on this ticket.";
  if (error.isAxiosError && !error.response) {
    return "Could not connect to SmartResolve. Check your connection and try again.";
  }
  if (!error.isAxiosError && error.message) return error.message;
  return "Your comment could not be added. Please try again.";
}

function CommentHistory({ ticketId, ticketStatus }) {
  const [reloadCount, setReloadCount] = useState(0);
  const requestKey = `${ticketId}:${reloadCount}`;
  const [request, setRequest] = useState({ requestKey: "", status: "loading", comments: [] });
  const isLoading = request.requestKey !== requestKey;
  const status = isLoading ? "loading" : request.status;
  const comments = isLoading ? [] : request.comments;
  const [draft, setDraft] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isClosed = ticketStatus === "CLOSED";

  useEffect(() => {
    const controller = new AbortController();
    getAllTicketComments(ticketId, { signal: controller.signal })
      .then((result) => {
        setRequest({ requestKey, status: "success", comments: result });
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          setRequest({
            requestKey,
            status: "error",
            comments: [],
            error: getErrorMessage(error),
          });
        }
      });

    return () => controller.abort();
  }, [requestKey, ticketId]);

  async function submitComment(event) {
    event.preventDefault();
    const comment = draft.trim();
    if (!comment) {
      setFormError("Enter a comment before submitting.");
      return;
    }
    if (comment.length > 10000) {
      setFormError("Comments must be 10,000 characters or fewer.");
      return;
    }

    setFormError("");
    setIsSubmitting(true);
    try {
      await addTicketComment(ticketId, comment);
      setDraft("");
      toast.success("Your comment was added.");
      setReloadCount((count) => count + 1);
    } catch (error) {
      setFormError(getCommentErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader
        description="Public comments from you and your support team."
        title={(
          <span className="inline-flex items-center gap-2">
            <MessageSquareText aria-hidden="true" className="size-4 text-slate-500" />
            Support responses and comments
          </span>
        )}
      />

      <div aria-live="polite" className="px-5 pb-5 sm:px-6">
        {status === "loading" && (
          <div aria-label="Loading comments" className="grid gap-4 py-2" role="status">
            {Array.from({ length: 2 }, (_, index) => (
              <div className="grid gap-2" key={index}>
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-12 w-full" />
              </div>
            ))}
            <span className="sr-only">Loading ticket comments</span>
          </div>
        )}
        {status === "error" && (
          <ErrorState
            className="py-6"
            description={request.error}
            onRetry={() => setReloadCount((count) => count + 1)}
            title="Comments are unavailable"
          />
        )}
        {status === "success" && (comments.length ? (
          <ol aria-label="Ticket comment history" className="grid gap-4">
            {comments.map((comment) => (
              <li className="rounded-lg border border-line bg-slate-50/70 p-4" key={comment.id}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-800">{comment.userName}</p>
                  <time className="text-xs text-muted" dateTime={comment.createdAt}>
                    {formatDate(comment.createdAt)}
                  </time>
                </div>
                <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
                  {comment.comment}
                </p>
              </li>
            ))}
          </ol>
        ) : (
          <EmptyState
            className="min-h-36"
            icon={MessageSquareText}
            title="No comments yet"
            description="Support replies and your comments will appear here."
          />
        ))}
      </div>

      <form className="grid gap-3 border-t border-line px-5 py-5 sm:px-6" noValidate onSubmit={submitComment}>
        <TextArea
          disabled={isClosed || isSubmitting}
          error={formError}
          id="ticket-comment"
          label="Add a comment"
          maxLength={10000}
          placeholder={isClosed ? "Closed tickets cannot be commented on." : "Share an update or reply to support..."}
          rows={3}
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value);
            if (formError) setFormError("");
          }}
        />
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted">
            Comments are visible to the support team. Do not include passwords or sensitive credentials.
          </p>
          <Button
            className="shrink-0"
            disabled={isClosed}
            loading={isSubmitting}
            type="submit"
          >
            <Send aria-hidden="true" className="size-4" />
            {isSubmitting ? "Sending..." : "Send comment"}
          </Button>
        </div>
        {isClosed && (
          <p className="text-xs text-muted" role="status">
            This ticket is closed and no longer accepts comments.
          </p>
        )}
      </form>
    </Card>
  );
}

function TicketDetailsSkeleton() {
  return (
    <div aria-label="Loading ticket details" className="grid gap-6" role="status">
      <div>
        <Skeleton className="h-7 w-48" />
        <Skeleton className="mt-3 h-4 w-72 max-w-full" />
      </div>
      <Card className="grid gap-5 p-5 sm:p-6">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-2/3" />
      </Card>
      <Card className="grid min-h-52 gap-5 p-5">
        <Skeleton className="h-5 w-44" />
        <Skeleton className="h-4 w-64" />
        <Skeleton className="h-4 w-full" />
      </Card>
      <span className="sr-only">Loading ticket details</span>
    </div>
  );
}

function TicketMetadata({ ticket }) {
  const metadata = [
    { label: "Submitted by", value: ticket.createdByName, icon: UserRound },
    { label: "Assigned to", value: ticket.assignedToName || "Not assigned yet", icon: UserRound },
    { label: "Support team", value: ticket.supportTeamName || "Not assigned yet", icon: UsersRound },
    { label: "Submitted", value: formatDate(ticket.createdAt), icon: CalendarDays },
    { label: "Last updated", value: formatDate(ticket.updatedAt), icon: CalendarDays },
  ];

  return (
    <div className="grid gap-4 border-t border-line pt-5 sm:grid-cols-2">
      {metadata.map(({ label, value, icon: Icon }) => (
        <div className="flex items-start gap-2.5" key={label}>
          <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-slate-400" />
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted">{label}</p>
            <p className="mt-1 break-words text-sm text-slate-700">{value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function AiAnalysisPanel({ ticketId }) {
  const [retryCount, setRetryCount] = useState(0);
  const requestKey = `${ticketId}:${retryCount}`;
  const [result, setResult] = useState({ requestKey: "", status: "loading", analysis: null });
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState("");
  const isLoading = result.requestKey !== requestKey;
  const status = isLoading ? "loading" : result.status;
  const analysis = isLoading ? null : result.analysis;
  const error = status === "error" ? result.error : "";

  useEffect(() => {
    const controller = new AbortController();
    getTicketAiAnalysis(ticketId, { signal: controller.signal })
      .then((response) => {
        setResult({
          requestKey,
          status: response.status === "PENDING" ? "pending" : "success",
          analysis: response,
        });
      })
      .catch((requestError) => {
        if (controller.signal.aborted) return;
        if (requestError.response?.status === 404) {
          const message = requestError.response.data?.message;
          setResult({
            requestKey,
            status: "missing",
            analysis: null,
            message: typeof message === "string" ? message : "",
          });
          return;
        }
        setResult({
          requestKey,
          status: "error",
          analysis: null,
          error: getErrorMessage(requestError),
        });
      });

    return () => controller.abort();
  }, [requestKey, ticketId]);

  async function generateAnalysis() {
    setIsGenerating(true);
    setGenerationError("");
    try {
      const analysisResponse = await generateTicketAiAnalysis(ticketId);
      setResult({
        requestKey,
        status: analysisResponse.status === "PENDING" ? "pending" : "success",
        analysis: analysisResponse,
      });
      if (analysisResponse.status === "FAILED") {
        toast.error("AI analysis could not be completed. See the provider message below.");
      } else {
        toast.success("AI analysis is ready.");
      }
    } catch (requestError) {
      const message = getErrorMessage(requestError);
      setGenerationError(message);
      toast.error(message);
    } finally {
      setIsGenerating(false);
    }
  }

  if (status === "loading") {
    return (
      <Card aria-label="Loading AI recommendation" className="grid gap-4 border-purple-200 p-5" role="status">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-56" />
        <Skeleton className="h-4 w-full" />
        <span className="sr-only">Loading AI recommendation</span>
      </Card>
    );
  }

  if (status === "error") {
    return (
      <ErrorState
        description={error}
        onRetry={() => setRetryCount((count) => count + 1)}
        title="AI recommendations are unavailable"
      />
    );
  }

  if (status === "missing") {
    return (
      <Card className="border-purple-200">
        <CardHeader
          description={result.message}
          title="AI recommendation"
        />
        <div className="grid justify-items-center gap-2 px-5 pb-5">
          <Button loading={isGenerating} onClick={generateAnalysis} type="button">
            <Sparkles aria-hidden="true" className="size-4" />
            Generate analysis
          </Button>
          {generationError && <p className="text-sm text-critical" role="alert">{generationError}</p>}
        </div>
      </Card>
    );
  }

  if (status === "pending") {
    return (
      <Card className="border-purple-200">
        <CardHeader
          description="Your ticket is saved. The recommendation is still being prepared."
          title="AI recommendation"
        />
        <div className="flex flex-col items-start gap-3 px-5 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <p aria-live="polite" className="text-sm text-muted" role="status">
            Analysis is in progress.
          </p>
          <button
            className="inline-flex min-h-9 items-center rounded-lg border border-line px-3 text-xs font-medium text-slate-700 hover:bg-slate-50"
            onClick={() => setRetryCount((count) => count + 1)}
            type="button"
          >
            Check again
          </button>
        </div>
      </Card>
    );
  }

  if (analysis?.status === "FAILED") {
    return (
      <Card className="border-purple-200">
        <CardHeader
          description="AI suggestions are advisory and do not affect your ticket status."
          title="AI recommendation"
        />
        <EmptyState
          className="min-h-36"
          icon={CircleAlert}
          title="Analysis could not be completed"
          description={analysis.failureMessage
            || "Your ticket was created successfully. The AI provider was unavailable, but support can still review your request."}
          action={(
            <div className="grid justify-items-center gap-2">
              <Button loading={isGenerating} onClick={generateAnalysis} type="button" variant="secondary">
                <Sparkles aria-hidden="true" className="size-4" />
                Try analysis again
              </Button>
              {generationError && <p className="text-sm text-critical" role="alert">{generationError}</p>}
            </div>
          )}
        />
      </Card>
    );
  }

  return <AiRecommendationCard analysis={analysis} />;
}

export default function TicketDetailsPage() {
  const { ticketId } = useParams();
  const [retryCount, setRetryCount] = useState(0);
  const requestKey = `${ticketId}:${retryCount}`;
  const [result, setResult] = useState({ requestKey: "", status: "loading", ticket: null });
  const isLoading = result.requestKey !== requestKey;
  const status = isLoading ? "loading" : result.status;
  const ticket = isLoading ? null : result.ticket;
  const error = status === "error" ? result.error : "";

  const details = useMemo(() => (ticket ? [
    { label: "Status", value: <StatusBadge status={ticket.status} /> },
    { label: "Priority", value: <PriorityBadge priority={ticket.priority} /> },
    { label: "Category", value: ticket.categoryName || "Not categorized yet" },
  ] : []), [ticket]);

  useEffect(() => {
    const controller = new AbortController();
    getTicketById(ticketId, { signal: controller.signal })
      .then((response) => {
        setResult({ requestKey, status: "success", ticket: response });
      })
      .catch((requestError) => {
        if (!controller.signal.aborted) {
          setResult({
            requestKey,
            status: "error",
            ticket: null,
            error: getErrorMessage(requestError),
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
          description={error}
          onRetry={() => setRetryCount((count) => count + 1)}
          title="Ticket details are unavailable"
        />
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-4xl gap-6">
      <PageHeading
        actions={(
          <Link
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-line bg-white px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            to="/employee/tickets"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            My tickets
          </Link>
        )}
        description={`Ticket ID: ${ticket.id}`}
        eyebrow="Support request"
        title={ticket.title}
      />

      <Card>
        <CardHeader
          description="Your submitted request and its current support details."
          title="Ticket details"
        />
        <div className="grid gap-5 px-5 pb-5 sm:px-6 sm:pb-6">
          <div className="flex flex-wrap gap-2">
            {details.map(({ label, value }) => (
              <div className="flex items-center gap-2" key={label}>
                <span className="text-xs font-medium text-muted">{label}</span>
                {typeof value === "string" ? (
                  <span className="text-sm font-medium text-slate-700">{value}</span>
                ) : value}
              </div>
            ))}
          </div>
          <section aria-labelledby="ticket-description-heading" className="border-t border-line pt-5">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted" id="ticket-description-heading">
              Problem description
            </h2>
            <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">
              {ticket.description}
            </p>
          </section>
          {ticket.issueSummary && (
            <section aria-labelledby="ticket-summary-heading" className="border-t border-line pt-5">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-muted" id="ticket-summary-heading">
                Issue summary
              </h2>
              <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
                {ticket.issueSummary}
              </p>
            </section>
          )}
          <TicketMetadata ticket={ticket} />
        </div>
      </Card>

      <CommentHistory ticketId={ticket.id} ticketStatus={ticket.status} />
      <AiAnalysisPanel ticketId={ticket.id} />
    </div>
  );
}
