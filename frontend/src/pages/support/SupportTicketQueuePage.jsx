import { useEffect, useMemo, useState } from "react";
import { ArrowRight, RotateCcw } from "lucide-react";
import { Link } from "react-router-dom";
import Card, { CardHeader } from "../../components/ui/Card.jsx";
import DataTable from "../../components/ui/DataTable.jsx";
import ErrorState from "../../components/ui/ErrorState.jsx";
import FilterDropdown from "../../components/ui/FilterDropdown.jsx";
import PageHeading from "../../components/ui/PageHeading.jsx";
import Pagination from "../../components/ui/Pagination.jsx";
import SearchInput from "../../components/ui/SearchInput.jsx";
import { TableSkeleton } from "../../components/ui/Skeleton.jsx";
import { PriorityBadge, StatusBadge } from "../../components/ui/Badge.jsx";
import { getAllSupportTickets } from "../../services/ticketService.js";

const PAGE_SIZE = 20;

const priorityOptions = [
  { value: "", label: "All priorities" },
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "CRITICAL", label: "Critical" },
];

const statusOptions = [
  { value: "", label: "All statuses" },
  { value: "OPEN", label: "Open" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "WAITING_FOR_EMPLOYEE", label: "Waiting for employee" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "CLOSED", label: "Closed" },
];

const sortOptions = [
  { value: "DESC", label: "Newest first" },
  { value: "ASC", label: "Oldest first" },
];

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
  if (error.response?.status === 401) return "Your session has expired. Sign in again to view the ticket queue.";
  if (error.response?.status === 403) return "Your account cannot access the support ticket queue.";
  if (error.isAxiosError && !error.response) {
    return "Could not connect to SmartResolve. Check your connection and try again.";
  }
  if (!error.isAxiosError && error.message) return error.message;
  return "The support ticket queue could not be loaded. Please try again.";
}

function getCategoryOptions(tickets) {
  const categoriesById = new Map();
  tickets.forEach((ticket) => {
    if (ticket.categoryId) {
      categoriesById.set(ticket.categoryId, {
        value: ticket.categoryId,
        label: ticket.categoryName || ticket.categoryId,
      });
    }
  });
  return [...categoriesById.values()].sort((left, right) => left.label.localeCompare(right.label));
}

const columns = [
  {
    key: "id",
    header: "Ticket ID",
    className: "whitespace-nowrap",
    render: (ticket) => (
      <Link
        aria-label={`View ticket ${ticket.id}`}
        className="font-mono text-xs font-medium text-brand-700 hover:text-brand-800"
        to={`/support/tickets/${ticket.id}`}
      >
        {ticket.id}
      </Link>
    ),
  },
  {
    key: "title",
    header: "Title",
    render: (ticket) => (
      <Link
        className="block min-w-40 truncate font-medium text-slate-800 hover:text-brand-700"
        to={`/support/tickets/${ticket.id}`}
      >
        {ticket.title}
      </Link>
    ),
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
    key: "createdAt",
    header: "Created",
    className: "whitespace-nowrap",
    render: (ticket) => formatDate(ticket.createdAt),
  },
  {
    key: "assignedToName",
    header: "Assigned engineer",
    render: (ticket) => ticket.assignedToName || <span className="text-muted">Unassigned</span>,
  },
];

export default function SupportTicketQueuePage() {
  const [categoryId, setCategoryId] = useState("");
  const [priority, setPriority] = useState("");
  const [status, setStatus] = useState("");
  const [direction, setDirection] = useState("DESC");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [retryCount, setRetryCount] = useState(0);
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [categoryOptionsLoaded, setCategoryOptionsLoaded] = useState(false);
  const requestKey = JSON.stringify({ categoryId, priority, status, direction, retryCount });
  const [result, setResult] = useState({ requestKey: "", status: "loading", tickets: [], error: "" });
  const isLoading = result.requestKey !== requestKey;
  const requestStatus = isLoading ? "loading" : result.status;
  const filtersDisabled = !categoryOptionsLoaded;

  useEffect(() => {
    const controller = new AbortController();
    getAllSupportTickets({
      categoryId: categoryId || undefined,
      priority: priority || undefined,
      status: status || undefined,
      sortBy: "createdAt",
      direction,
      signal: controller.signal,
    })
      .then((tickets) => {
        if (!categoryId && !priority && !status) {
          setCategoryOptions(getCategoryOptions(tickets));
          setCategoryOptionsLoaded(true);
        }
        setResult({ requestKey, status: "success", tickets, error: "" });
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          setResult({
            requestKey,
            status: "error",
            tickets: [],
            error: getErrorMessage(error),
          });
        }
      });

    return () => controller.abort();
  }, [categoryId, priority, status, direction, requestKey]);

  const filteredTickets = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    if (!query) return result.tickets;
    return result.tickets.filter((ticket) => (
      ticket.id.toLocaleLowerCase().includes(query)
      || ticket.title.toLocaleLowerCase().includes(query)
    ));
  }, [result.tickets, search]);

  const pageCount = Math.ceil(filteredTickets.length / PAGE_SIZE);
  const visibleTickets = filteredTickets.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const hasActiveFilters = Boolean(search.trim() || categoryId || priority || status);

  function updateFilter(setter) {
    return (event) => {
      setter(event.target.value);
      setPage(1);
    };
  }

  function clearFilters() {
    setCategoryId("");
    setPriority("");
    setStatus("");
    setDirection("DESC");
    setSearch("");
    setPage(1);
  }

  return (
    <div className="grid gap-6">
      <PageHeading
        actions={(
          <Link
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
            to="/support/dashboard"
          >
            <ArrowRight aria-hidden="true" className="size-4" />
            Dashboard
          </Link>
        )}
        description="Review incoming tickets available to you through your assignments, team memberships, and the unassigned queue."
        eyebrow="Support operations"
        title="Ticket queue"
      />

      <Card className="overflow-hidden">
        <CardHeader
          description="Category, priority, status, and creation-date sorting are sent to the support API. Search narrows the returned accessible tickets by ID or title."
          title="Accessible tickets"
        />
        <div className="grid items-end gap-3 px-5 pb-5 sm:grid-cols-2 xl:grid-cols-[minmax(220px,1fr)_repeat(4,minmax(140px,170px))_auto]">
          <SearchInput
            className="sm:col-span-2 xl:col-span-1"
            id="support-ticket-search"
            label="Search"
            onChange={updateFilter(setSearch)}
            placeholder="Search title or ticket ID"
            disabled={filtersDisabled}
            visibleLabel
            value={search}
          />
          <FilterDropdown
            id="support-ticket-category"
            label="Category"
            onChange={updateFilter(setCategoryId)}
            options={[{ value: "", label: "All categories" }, ...categoryOptions]}
            value={categoryId}
            disabled={filtersDisabled}
          />
          <FilterDropdown
            id="support-ticket-priority"
            label="Priority"
            onChange={updateFilter(setPriority)}
            options={priorityOptions}
            value={priority}
            disabled={filtersDisabled}
          />
          <FilterDropdown
            id="support-ticket-status"
            label="Status"
            onChange={updateFilter(setStatus)}
            options={statusOptions}
            value={status}
            disabled={filtersDisabled}
          />
          <FilterDropdown
            id="support-ticket-sort"
            label="Created date"
            onChange={updateFilter(setDirection)}
            options={sortOptions}
            value={direction}
            disabled={filtersDisabled}
          />
          <button
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
            disabled={filtersDisabled || (!hasActiveFilters && direction === "DESC")}
            onClick={clearFilters}
            type="button"
          >
            <RotateCcw aria-hidden="true" className="size-4" />
            Clear
          </button>
        </div>

        {requestStatus === "loading" && <TableSkeleton columns={7} rows={6} />}
        {requestStatus === "error" && (
          <ErrorState
            description={result.error}
            onRetry={() => setRetryCount((count) => count + 1)}
            title="Ticket queue is unavailable"
          />
        )}
        {requestStatus === "success" && (
          <>
            <DataTable
              columns={columns}
              emptyDescription={hasActiveFilters
                ? "Try adjusting the search or filters to find another accessible ticket."
                : "Incoming tickets available to your account will appear here."}
              emptyTitle={hasActiveFilters ? "No matching tickets" : "No incoming tickets"}
              rows={visibleTickets}
            />
            {filteredTickets.length > 0 && (
              <Pagination
                onPageChange={setPage}
                page={pageCount ? page : 1}
                pageSize={PAGE_SIZE}
                totalItems={filteredTickets.length}
              />
            )}
          </>
        )}
      </Card>
    </div>
  );
}
