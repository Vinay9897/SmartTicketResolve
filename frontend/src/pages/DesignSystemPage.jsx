import { lazy, Suspense, useState } from "react";
import { toast } from "react-hot-toast";
import {
  Check,
  CircleAlert,
  Clock3,
  FileText,
  Sparkles,
  TicketCheck,
  UsersRound,
} from "lucide-react";
import { useOutletContext } from "react-router-dom";
import AiRecommendationCard from "../components/ui/AiRecommendationCard.jsx";
import Badge, { PriorityBadge, StatusBadge } from "../components/ui/Badge.jsx";
import Button from "../components/ui/Button.jsx";
import Card, { CardHeader } from "../components/ui/Card.jsx";
import ConfirmationDialog from "../components/ui/ConfirmationDialog.jsx";
import DataTable from "../components/ui/DataTable.jsx";
import ErrorState from "../components/ui/ErrorState.jsx";
import FilterDropdown from "../components/ui/FilterDropdown.jsx";
import { SelectInput, TextArea, TextInput } from "../components/ui/FormField.jsx";
import MetricCard from "../components/ui/MetricCard.jsx";
import Pagination from "../components/ui/Pagination.jsx";
import SearchInput from "../components/ui/SearchInput.jsx";
import Skeleton, { TableSkeleton } from "../components/ui/Skeleton.jsx";
import Spinner from "../components/ui/Spinner.jsx";

const ChartsPreview = lazy(() => import("../components/ui/ChartsPreview.jsx"));

const sampleTickets = [
  { id: "SR-2481", title: "Payroll dashboard access issue", status: "IN_PROGRESS", priority: "HIGH", updated: "8 min ago" },
  { id: "SR-2479", title: "VPN disconnects during meetings", status: "OPEN", priority: "MEDIUM", updated: "24 min ago" },
  { id: "SR-2472", title: "Finance folder access request", status: "WAITING_FOR_EMPLOYEE", priority: "LOW", updated: "1 hour ago" },
  { id: "SR-2468", title: "Laptop battery drains quickly", status: "RESOLVED", priority: "LOW", updated: "Yesterday" },
  { id: "SR-2461", title: "Email sync stopped on mobile", status: "OPEN", priority: "HIGH", updated: "Yesterday" },
];

const sampleTicketColumns = [
  {
    key: "ticket",
    header: "Ticket",
    render: (ticket) => (
      <div className="min-w-52">
        <p className="font-medium text-ink">{ticket.title}</p>
        <p className="mt-1 text-xs text-muted">{ticket.id}</p>
      </div>
    ),
  },
  { key: "status", header: "Status", render: (ticket) => <StatusBadge status={ticket.status} /> },
  { key: "priority", header: "Priority", render: (ticket) => <PriorityBadge priority={ticket.priority} /> },
  { key: "updated", header: "Last updated", className: "whitespace-nowrap" },
];

const statusFilterOptions = [
  { value: "ALL", label: "All statuses" },
  { value: "OPEN", label: "Open" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "WAITING_FOR_EMPLOYEE", label: "Waiting for employee" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "CLOSED", label: "Closed" },
];

const priorityFilterOptions = [
  { value: "ALL", label: "All priorities" },
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "CRITICAL", label: "Critical" },
];

const sampleStatusData = [
  { name: "Open", count: 12, color: "#4F46E5" },
  { name: "In progress", count: 8, color: "#0EA5E9" },
  { name: "Waiting", count: 5, color: "#F59E0B" },
  { name: "Resolved", count: 16, color: "#16A34A" },
];

const samplePriorityData = [
  { name: "Low", count: 4, color: "#94A3B8" },
  { name: "Medium", count: 12, color: "#0EA5E9" },
  { name: "High", count: 7, color: "#F59E0B" },
  { name: "Critical", count: 2, color: "#DC2626" },
];

function SectionTitle({ eyebrow, title, description }) {
  return (
    <div className="mb-4">
      {eyebrow && <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-600">{eyebrow}</p>}
      <h2 className="mt-1 text-lg font-semibold tracking-tight text-ink">{title}</h2>
      {description && <p className="mt-1 text-sm leading-6 text-muted">{description}</p>}
    </div>
  );
}

function ColorSwatch({ name, hex, className }) {
  return (
    <div className="min-w-0">
      <div className={`h-12 rounded-lg border border-black/5 ${className}`} />
      <p className="mt-2 truncate text-xs font-medium text-slate-700">{name}</p>
      <p className="text-[11px] text-muted">{hex}</p>
    </div>
  );
}

export default function DesignSystemPage() {
  const { role } = useOutletContext();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [tablePage, setTablePage] = useState(1);
  const pageSize = 3;
  const normalizedSearch = searchValue.trim().toLowerCase();
  const filteredTickets = sampleTickets.filter((ticket) => {
    const matchesSearch = `${ticket.id} ${ticket.title}`.toLowerCase().includes(normalizedSearch);
    const matchesStatus = statusFilter === "ALL" || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === "ALL" || ticket.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });
  const pageCount = Math.max(1, Math.ceil(filteredTickets.length / pageSize));
  const currentPage = Math.min(tablePage, pageCount);
  const visibleTickets = filteredTickets.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="grid gap-8">
      <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-600">
              UI foundation
            </p>
            <Badge variant="info">Preview only</Badge>
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink sm:text-[28px]">
            Design system
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            A consistent, accessible visual language for every SmartResolve workflow. Components
            shown here are reusable building blocks, not connected product screens.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted">Role navigation preview:</span>
          <Badge variant="neutral">{role.replaceAll("_", " ")}</Badge>
        </div>
      </section>

      <section>
        <SectionTitle
          eyebrow="Foundation"
          title="Color system"
          description="Indigo anchors actions; semantic color is reserved for meaning and urgency."
        />
        <div className="grid grid-cols-2 gap-4 rounded-xl border border-line bg-white p-5 sm:grid-cols-4 lg:grid-cols-8">
          <ColorSwatch name="Brand 700" hex="#3730A3" className="bg-brand-700" />
          <ColorSwatch name="Brand 600" hex="#4F46E5" className="bg-brand-600" />
          <ColorSwatch name="Brand 50" hex="#EEF2FF" className="bg-brand-50" />
          <ColorSwatch name="Canvas" hex="#F5F7FB" className="bg-canvas" />
          <ColorSwatch name="Success" hex="#15803D" className="bg-success" />
          <ColorSwatch name="Warning" hex="#B45309" className="bg-warning" />
          <ColorSwatch name="Critical" hex="#B91C1C" className="bg-critical" />
          <ColorSwatch name="AI accent" hex="#7C3AED" className="bg-ai" />
        </div>
      </section>

      <section>
        <SectionTitle
          eyebrow="Reusable patterns"
          title="Buttons and badges"
          description="Clear hierarchy for primary actions, supporting actions, and ticket signals."
        />
        <Card className="grid gap-6 p-5 lg:grid-cols-2">
          <div>
            <p className="mb-3 text-xs font-semibold text-slate-600">Button variants</p>
            <div className="flex flex-wrap items-center gap-2">
              <Button><TicketCheck aria-hidden="true" className="size-4" />Primary action</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Quiet action</Button>
              <Button variant="danger">Destructive</Button>
              <Button loading>Loading</Button>
            </div>
          </div>
          <div>
            <p className="mb-3 text-xs font-semibold text-slate-600">Ticket status and priority</p>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status="OPEN" />
              <StatusBadge status="IN_PROGRESS" />
              <StatusBadge status="WAITING_FOR_EMPLOYEE" />
              <StatusBadge status="RESOLVED" />
              <StatusBadge status="CLOSED" />
              <PriorityBadge priority="LOW" />
              <PriorityBadge priority="MEDIUM" />
              <PriorityBadge priority="HIGH" />
              <PriorityBadge priority="CRITICAL" />
              <Badge variant="ai"><Sparkles aria-hidden="true" className="mr-1 size-3" />AI advisory</Badge>
            </div>
          </div>
        </Card>
      </section>

      <section>
        <SectionTitle
          eyebrow="Data presentation"
          title="Metric cards"
          description="Values remain empty until populated by live dashboard APIs."
        />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard detail="Live value will be loaded from the API." icon={FileText} label="Total tickets" value={null} />
          <MetricCard detail="Live value will be loaded from the API." icon={CircleAlert} label="Open tickets" tone="warning" value={null} />
          <MetricCard detail="Live value will be loaded from the API." icon={Clock3} label="In progress" tone="brand" value={null} />
          <MetricCard detail="Live value will be loaded from the API." icon={TicketCheck} label="Resolved" tone="success" value={null} />
        </div>
      </section>

      <Suspense fallback={<div aria-label="Loading charts" className="grid gap-4 xl:grid-cols-2" role="status"><Skeleton className="h-80 rounded-xl" /><Skeleton className="h-80 rounded-xl" /></div>}>
        <ChartsPreview priorityData={samplePriorityData} statusData={sampleStatusData} />
      </Suspense>

      <section>
        <SectionTitle
          eyebrow="Forms and tables"
          title="Search, filters, tables and forms"
          description="Reusable controls keep sample data easy to scan and narrow down."
        />
        <div className="grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <Card className="p-5">
            <CardHeader
              className="p-0 pb-5"
              description="These controls demonstrate validation and focus treatment only."
              title="Form controls"
            />
            <div className="grid gap-4">
              <TextInput
                autoComplete="off"
                hint="Use a clear, descriptive title."
                id="preview-title"
                label="Ticket title"
                placeholder="Describe the issue"
              />
              <SelectInput id="preview-priority" label="Priority">
                <option value="">Select a priority</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </SelectInput>
              <TextArea
                error="Please add a little more detail."
                id="preview-description"
                label="Description"
                placeholder="What happened?"
              />
              <div className="flex flex-wrap justify-end gap-2">
                <Button onClick={() => toast.error("This preview does not save data.")} variant="secondary">
                  Cancel
                </Button>
                <Button onClick={() => toast.success("Interaction preview complete.")}>
                  <Check aria-hidden="true" className="size-4" />
                  Preview feedback
                </Button>
              </div>
            </div>
          </Card>
          <Card className="overflow-hidden">
            <CardHeader
              action={
                <Badge variant="info">Local sample</Badge>
              }
              description="Illustrative ticket rows for component styling only. This table does not call or save data."
              title="Ticket table"
            />
            <div className="grid gap-3 border-b border-line p-4 sm:grid-cols-[minmax(220px,1fr)_190px_180px]">
              <SearchInput
                id="ticket-search"
                label="Search sample tickets"
                onChange={(event) => {
                  setSearchValue(event.target.value);
                  setTablePage(1);
                }}
                placeholder="Search by ID or title"
                value={searchValue}
              />
              <FilterDropdown
                id="ticket-status-filter"
                label="Status"
                onChange={(event) => {
                  setStatusFilter(event.target.value);
                  setTablePage(1);
                }}
                options={statusFilterOptions}
                value={statusFilter}
              />
              <FilterDropdown
                id="ticket-priority-filter"
                label="Priority"
                onChange={(event) => {
                  setPriorityFilter(event.target.value);
                  setTablePage(1);
                }}
                options={priorityFilterOptions}
                value={priorityFilter}
              />
            </div>
            <DataTable
              columns={sampleTicketColumns}
              emptyDescription="Try changing or clearing the search and filters."
              emptyTitle="No matching sample tickets"
              getRowKey={(ticket) => ticket.id}
              rows={visibleTickets}
            />
            <Pagination
              onPageChange={setTablePage}
              page={currentPage}
              pageSize={pageSize}
              totalItems={filteredTickets.length}
            />
          </Card>
        </div>
      </section>

      <section>
        <SectionTitle
          eyebrow="AI guidance"
          title="AI recommendations stay provisional"
          description="AI content is separated from confirmed ticket data and can be reviewed or edited by support."
        />
        <AiRecommendationCard analysis={null} />
      </section>

      <section>
        <SectionTitle
          eyebrow="System states"
          title="Loading, error and confirmation patterns"
          description="Reusable feedback states explain progress, recovery and consequential actions."
        />
        <div className="grid gap-4 xl:grid-cols-3">
          <Card className="overflow-hidden">
            <CardHeader description="Use a spinner for brief waits and a skeleton for page structure." title="Loading" />
            <div className="px-5 pb-2">
              <Spinner label="Loading tickets" />
            </div>
            <TableSkeleton columns={3} rows={2} />
          </Card>
          <Card className="overflow-hidden">
            <CardHeader description="Explain the issue and provide a clear recovery action." title="Error feedback" />
            <ErrorState
              className="min-h-52"
              description="The sample view could not be refreshed. No data was changed."
              onRetry={() => toast.error("Retry is only a visual interaction in this preview.")}
              title="Unable to refresh preview"
            />
          </Card>
          <Card className="p-5">
            <div className="flex items-start gap-4">
              <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-warning-soft text-warning">
                <UsersRound aria-hidden="true" className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold text-ink">Confirm before important changes</h3>
                <p className="mt-1 text-sm leading-6 text-muted">
                  The confirmation pattern makes the outcome clear before continuing.
                </p>
                <Button className="mt-4" onClick={() => setDialogOpen(true)} variant="secondary">
                  Open confirmation
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <ConfirmationDialog
        confirmText="Confirm preview"
        description="This is a visual-only confirmation. No ticket or account data will be changed."
        onClose={() => setDialogOpen(false)}
        onConfirm={() => {
          setDialogOpen(false);
          toast.success("Confirmation preview complete.");
        }}
        open={dialogOpen}
        title="Continue with this action?"
      />
    </div>
  );
}
