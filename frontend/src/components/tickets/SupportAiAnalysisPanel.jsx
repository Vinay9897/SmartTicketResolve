import { useEffect, useState } from "react";
import {
  AlertCircle,
  Check,
  Circle,
  ListChecks,
  PencilLine,
  Sparkles,
} from "lucide-react";
import toast from "react-hot-toast";
import Badge, { PriorityBadge } from "../ui/Badge.jsx";
import Button from "../ui/Button.jsx";
import Card, { CardHeader } from "../ui/Card.jsx";
import EmptyState from "../ui/EmptyState.jsx";
import ErrorState from "../ui/ErrorState.jsx";
import { SelectInput, TextArea } from "../ui/FormField.jsx";
import Skeleton from "../ui/Skeleton.jsx";
import {
  getTicketAiAnalysis,
  reviewSupportTicketAiAnalysis,
} from "../../services/ticketService.js";

const priorityOptions = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "CRITICAL", label: "Critical" },
];

function getErrorMessage(error) {
  const message = error.response?.data?.message;
  if (typeof message === "string" && message.trim()) return message;
  if (error.response?.status === 401) return "Your session has expired. Sign in again to continue.";
  if (error.response?.status === 403) return "You do not have permission to access or review this analysis.";
  if (error.response?.status === 404) return "This ticket or its analysis is no longer available.";
  if (error.response?.status === 409) return "The analysis cannot be processed in its current state.";
  if (error.isAxiosError && !error.response) {
    return "Could not connect to SmartResolve. Check your connection and try again.";
  }
  if (!error.isAxiosError && error.message) return error.message;
  return "The AI recommendation could not be loaded. Please try again.";
}

function formatReviewedAt(value) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function toDraft(analysis) {
  return {
    issueSummary: analysis.issueSummary || "",
    suggestedPriority: analysis.suggestedPriority || "",
    troubleshootingSteps: (analysis.troubleshootingSteps || []).join("\n"),
    suggestedResponse: analysis.suggestedResponse || "",
  };
}

function AnalysisSkeleton() {
  return (
    <Card aria-label="Loading AI analysis" className="grid gap-4 border-purple-200 p-5" role="status">
      <Skeleton className="h-5 w-44" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-20 w-full" />
      <span className="sr-only">Loading AI recommendations</span>
    </Card>
  );
}

export default function SupportAiAnalysisPanel({ ticketId }) {
  const [reloadCount, setReloadCount] = useState(0);
  const requestKey = `${ticketId}:${reloadCount}`;
  const [analysisResult, setAnalysisResult] = useState({
    requestKey: "",
    status: "loading",
    analysis: null,
    error: "",
  });
  const isLoading = analysisResult.requestKey !== requestKey;
  const loadStatus = isLoading ? "loading" : analysisResult.status;
  const analysis = isLoading ? null : analysisResult.analysis;
  const loadError = loadStatus === "error" ? analysisResult.error : "";
  const [actionError, setActionError] = useState("");
  const [isReviewing, setIsReviewing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    getTicketAiAnalysis(ticketId, { signal: controller.signal })
      .then((response) => {
        setAnalysisResult({ requestKey, status: "success", analysis: response, error: "" });
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        if (error.response?.status === 404) {
          setAnalysisResult({ requestKey, status: "missing", analysis: null, error: "" });
          return;
        }
        setAnalysisResult({
          requestKey,
          status: "error",
          analysis: null,
          error: getErrorMessage(error),
        });
      });

    return () => controller.abort();
  }, [requestKey, ticketId]);

  async function submitReview(values) {
    setActionError("");
    if (!analysis?.suggestedCategoryId) {
      setActionError("This analysis has no active category to submit for review.");
      return;
    }
    const troubleshootingSteps = values.troubleshootingSteps
      .split(/\r?\n/)
      .map((step) => step.trim())
      .filter(Boolean);
    if (!values.issueSummary.trim() || !values.suggestedResponse.trim()) {
      setActionError("Issue summary and suggested response are required.");
      return;
    }
    if (values.issueSummary.trim().length > 1000 || values.suggestedResponse.trim().length > 2000) {
      setActionError("Issue summary must be 1,000 characters or fewer and suggested response 2,000 or fewer.");
      return;
    }
    if (troubleshootingSteps.length === 0 || troubleshootingSteps.length > 8) {
      setActionError("Enter between 1 and 8 troubleshooting steps, one per line.");
      return;
    }
    if (troubleshootingSteps.some((step) => step.length > 1000)) {
      setActionError("Each troubleshooting step must be 1,000 characters or fewer.");
      return;
    }
    if (!values.suggestedPriority) {
      setActionError("Select a recommended priority.");
      return;
    }

    setIsReviewing(true);
    try {
      const reviewed = await reviewSupportTicketAiAnalysis(ticketId, {
        issueSummary: values.issueSummary.trim(),
        suggestedCategoryId: analysis.suggestedCategoryId,
        suggestedPriority: values.suggestedPriority,
        troubleshootingSteps,
        suggestedResponse: values.suggestedResponse.trim(),
      });
      setAnalysisResult({ requestKey, status: "success", analysis: reviewed, error: "" });
      setDraft(null);
      setIsEditing(false);
      toast.success("AI recommendations reviewed.");
    } catch (error) {
      const message = getErrorMessage(error);
      setActionError(message);
      toast.error(message);
    } finally {
      setIsReviewing(false);
    }
  }

  function saveReview(event) {
    event.preventDefault();
    return submitReview(draft);
  }

  function beginEdit() {
    setDraft(toDraft(analysis));
    setActionError("");
    setIsEditing(true);
  }

  async function markReviewed() {
    await submitReview(toDraft(analysis));
  }

  if (loadStatus === "loading") return <AnalysisSkeleton />;

  if (loadStatus === "error") {
    return (
      <ErrorState
        description={loadError}
        onRetry={() => setReloadCount((count) => count + 1)}
        title="AI recommendations are unavailable"
      />
    );
  }

  if (loadStatus === "missing") {
    return (
      <Card className="overflow-hidden border-purple-200">
        <CardHeader
          description="AI recommendations are advisory. Support engineers can update them after they are generated."
          title={(
            <span className="inline-flex items-center gap-2">
              <Sparkles aria-hidden="true" className="size-4 text-ai" />
              AI Assistant
            </span>
          )}
          action={<Badge variant="ai">Recommendations</Badge>}
        />
        <EmptyState
          className="min-h-36"
          icon={AlertCircle}
          title="No AI analysis available"
          description="There are no recommendations to update yet. The employee or automatic ticket workflow must generate an analysis first."
        />
      </Card>
    );
  }

  if (analysis?.status === "PENDING") {
    return (
      <Card className="border-purple-200">
        <CardHeader
          description="AI analysis is being prepared. This does not change ticket status or assignment."
          title="AI Assistant"
          action={<Badge variant="ai">In progress</Badge>}
        />
        <div className="flex flex-col gap-3 px-5 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <p aria-live="polite" className="text-sm text-muted" role="status">
            Waiting for the analysis result.
          </p>
          <Button
            onClick={() => setReloadCount((count) => count + 1)}
            type="button"
            variant="secondary"
          >
            Check again
          </Button>
        </div>
      </Card>
    );
  }

  if (analysis?.status === "FAILED") {
    return (
      <Card className="overflow-hidden border-amber-200">
        <CardHeader
          description="The analysis did not produce recommendations. Ticket status and assignment are unchanged."
          title={(
            <span className="inline-flex items-center gap-2">
              <Sparkles aria-hidden="true" className="size-4 text-ai" />
              AI Assistant
            </span>
          )}
          action={<Badge variant="warning">Analysis failed</Badge>}
        />
        <div className="grid gap-4 px-5 pb-5">
          <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-warning" />
            <div>
              <h3 className="text-sm font-semibold text-slate-800">AI provider message</h3>
              <p className="mt-1 text-sm leading-6 text-slate-700">
                {analysis.failureMessage || "The provider did not return a specific failure message for this analysis."}
              </p>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  const canReview = Boolean(analysis?.suggestedCategoryId);
  const reviewed = analysis?.status === "REVIEWED";

  return (
    <Card className="overflow-hidden border-purple-200">
      <CardHeader
        className="border-b border-purple-100 bg-ai-soft"
        title={(
          <span className="inline-flex items-center gap-2">
            <Sparkles aria-hidden="true" className="size-4 text-ai" />
            AI Assistant
          </span>
        )}
        description="AI-generated recommendations are advisory. They never automatically change ticket status or assignment."
        action={<Badge variant="ai">{reviewed ? "Reviewed" : "AI recommendations"}</Badge>}
      />
      <form className="grid gap-5 p-5" onSubmit={saveReview}>
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Issue summary</h3>
          {isEditing ? (
            <TextArea
              id={`ai-summary-${ticketId}`}
              label="Issue summary"
              className="mt-2"
              maxLength={1000}
              onChange={(event) => setDraft({ ...draft, issueSummary: event.target.value })}
              required
              value={draft.issueSummary}
            />
          ) : (
            <p className="mt-1.5 whitespace-pre-wrap text-sm leading-6 text-slate-700">
              {analysis.issueSummary || "No summary was provided."}
            </p>
          )}
        </section>

        <div className="grid gap-4 sm:grid-cols-2">
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Suggested category</h3>
            <div className="mt-2">
              <Badge variant="ai">{analysis.suggestedCategoryName || "No category suggestion"}</Badge>
            </div>
          </section>
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Recommended priority</h3>
            {isEditing ? (
              <SelectInput
                className="mt-2"
                id={`ai-priority-${ticketId}`}
                label="Recommended priority"
                onChange={(event) => setDraft({ ...draft, suggestedPriority: event.target.value })}
                value={draft.suggestedPriority}
              >
                <option value="">Select priority</option>
                {priorityOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </SelectInput>
            ) : (
              <div className="mt-2">
                {analysis.suggestedPriority
                  ? <PriorityBadge priority={analysis.suggestedPriority} />
                  : <span className="text-sm text-muted">No priority suggestion</span>}
              </div>
            )}
          </section>
        </div>

        <section>
          <h3 className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted">
            <ListChecks aria-hidden="true" className="size-4" />
            Troubleshooting checklist
          </h3>
          {isEditing ? (
            <TextArea
              id={`ai-steps-${ticketId}`}
              label="Troubleshooting steps"
              className="mt-2"
              hint="Enter one step per line, up to 8 steps."
              maxLength={8000}
              onChange={(event) => setDraft({ ...draft, troubleshootingSteps: event.target.value })}
              required
              value={draft.troubleshootingSteps}
            />
          ) : (
            <ul className="mt-2 grid gap-2">
              {(analysis.troubleshootingSteps || []).map((step, index) => (
                <li className="flex items-start gap-2.5 text-sm leading-6 text-slate-700" key={`${index}-${step}`}>
                  <Circle aria-hidden="true" className="mt-1 size-4 shrink-0 text-ai" />
                  <span>{step}</span>
                </li>
              ))}
              {!analysis.troubleshootingSteps?.length && (
                <li className="text-sm text-muted">No troubleshooting steps were provided.</li>
              )}
            </ul>
          )}
        </section>

        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Suggested response</h3>
          {isEditing ? (
            <TextArea
              id={`ai-response-${ticketId}`}
              label="Suggested response"
              className="mt-2"
              maxLength={2000}
              onChange={(event) => setDraft({ ...draft, suggestedResponse: event.target.value })}
              required
              value={draft.suggestedResponse}
            />
          ) : (
            <p className="mt-2 whitespace-pre-wrap rounded-lg border border-purple-100 bg-purple-50/50 p-3 text-sm leading-6 text-slate-700">
              {analysis.suggestedResponse || "No suggested response was provided."}
            </p>
          )}
        </section>

        {reviewed && analysis.reviewedAt && (
          <p className="text-xs text-muted">
            Reviewed {formatReviewedAt(analysis.reviewedAt)}
          </p>
        )}
        {!canReview && (
          <p className="text-sm text-warning" role="status">
            This analysis has no active category ID, so the backend cannot accept a review yet.
          </p>
        )}
        {actionError && <p className="text-sm text-critical" role="alert">{actionError}</p>}

        <div className="flex flex-wrap justify-end gap-2 border-t border-line pt-4">
          {isEditing ? (
            <>
              <Button
                disabled={isReviewing}
                onClick={() => {
                  setIsEditing(false);
                  setDraft(null);
                  setActionError("");
                }}
                type="button"
                variant="secondary"
              >
                Cancel
              </Button>
              <Button disabled={!canReview} loading={isReviewing} type="submit">
                <Check aria-hidden="true" className="size-4" />
                Save review
              </Button>
            </>
          ) : (
            <>
              <Button
                disabled={!canReview || isReviewing}
                onClick={beginEdit}
                type="button"
                variant="secondary"
              >
                <PencilLine aria-hidden="true" className="size-4" />
                Edit suggestions
              </Button>
              <Button
                disabled={!canReview}
                loading={isReviewing}
                onClick={markReviewed}
                type="button"
              >
                <Check aria-hidden="true" className="size-4" />
                {reviewed ? "Save review" : "Mark reviewed"}
              </Button>
            </>
          )}
        </div>
      </form>
    </Card>
  );
}
