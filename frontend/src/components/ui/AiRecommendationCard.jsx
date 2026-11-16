import { Bot, Check, PencilLine, Sparkles } from "lucide-react";
import Badge from "./Badge.jsx";
import Button from "./Button.jsx";
import Card, { CardHeader } from "./Card.jsx";
import EmptyState from "./EmptyState.jsx";

export default function AiRecommendationCard({
  analysis,
  onReview,
  onEdit,
  editable = false,
}) {
  if (!analysis) {
    return (
      <Card className="overflow-hidden border-purple-200">
        <div className="flex items-center gap-2 border-b border-purple-100 bg-ai-soft px-5 py-4">
          <Sparkles aria-hidden="true" className="size-4 text-ai" />
          <h2 className="text-sm font-semibold text-ai">AI recommendation</h2>
          <Badge variant="ai">Advisory</Badge>
        </div>
        <EmptyState
          icon={Bot}
          title="AI recommendations appear here"
          description="An analysis is shown after it has been requested for an accessible ticket."
        />
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-purple-200">
      <CardHeader
        className="border-b border-purple-100 bg-ai-soft"
        title={
          <span className="inline-flex items-center gap-2">
            <Sparkles aria-hidden="true" className="size-4 text-ai" />
            AI recommendation
          </span>
        }
        description="Suggestions are advisory and do not change ticket fields until reviewed."
        action={<Badge variant="ai">{analysis.status ?? "Advisory"}</Badge>}
      />
      <div className="grid gap-5 p-5">
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Issue summary</h3>
          <p className="mt-1.5 text-sm leading-6 text-slate-700">{analysis.issueSummary}</p>
        </section>
        <div className="grid gap-4 sm:grid-cols-2">
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Suggested category</h3>
            <p className="mt-1.5 text-sm font-medium text-ink">{analysis.suggestedCategoryName || "—"}</p>
          </section>
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Recommended priority</h3>
            <p className="mt-1.5 text-sm font-medium text-ink">{analysis.suggestedPriority || "—"}</p>
          </section>
        </div>
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Troubleshooting steps</h3>
          <ol className="mt-2 list-inside list-decimal space-y-1.5 text-sm leading-6 text-slate-700">
            {(analysis.troubleshootingSteps ?? []).map((step, index) => (
              <li key={`${index}-${step}`}>{step}</li>
            ))}
          </ol>
        </section>
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Suggested response</h3>
          <p className="mt-1.5 rounded-lg border border-purple-100 bg-purple-50/50 p-3 text-sm leading-6 text-slate-700">
            {analysis.suggestedResponse || "—"}
          </p>
        </section>
        {editable && (
          <div className="flex flex-wrap justify-end gap-2 border-t border-line pt-4">
            <Button onClick={onEdit} variant="secondary">
              <PencilLine aria-hidden="true" className="size-4" />
              Edit recommendations
            </Button>
            <Button onClick={onReview}>
              <Check aria-hidden="true" className="size-4" />
              Mark reviewed
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
