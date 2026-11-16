import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Plus, RotateCcw } from "lucide-react";
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
import { getAllMyTickets } from "../../services/ticketService.js";

const PAGE_SIZE = 10;

const statusOptions = [
  { value: "", label: "All statuses" },
  { value: "OPEN", label: "Open" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "WAITING_FOR_EMPLOYEE", label: "Waiting for you" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "CLOSED", label: "Closed" },
];

const priorityOptions = [
  { value: "", label: "All priorities" },
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "CRITICAL", label: "Critical" },
];

const sortOptions = [
  { value: "createdAt-desc", label: "Newest submitted" },
  { value: "createdAt-asc", label: "Oldest submitted" },
  { value: "updatedAt-desc", label: "Recently updated" },
  { value: "updatedAt-asc", label: "Least recently updated" },
  { value: "title-asc", label: "Title A to Z" },
  { value: "title-desc", label: "Title Z to A" },
  { value: "priority-desc", label: "Highest priority" },
  { value: "priority-asc", label: "Lowest priority" },
  { value: "status-asc", label: "Status A to Z" },
  { value: "status-desc", label: "Status Z to A" },
];

const priorityOrder = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 };

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function compareTickets(left, right, sort) {
  const [field, direction] = sort.split("-");
  let comparison = 0;

  if (field === "createdAt" || field === "updatedAt") {
    comparison = Date.parse(left[field]) - Date.parse(right[field]);
  } else if (field === "priority") {
    comparison = priorityOrder[left.priority] - priorityOrder[right.priority];
  } else {
    comparison = String(left[field] ?? "").localeCompare(String(right[field] ?? ""));
  }

  return direction === "desc" ? -comparison : comparison;
}

function getErrorMessage(error) {
  const message = error.response?.data?.message;
  if (typeof message === "string" && message.trim()) return message;
  if (error.response?.status === 401) return "Your session has expired. Sign in again to view your tickets.";
  if (error.response?.status === 403) return "Your account cannot access these tickets.";
  if (error.isAxiosError && !error.response) {
    return "Could not connect to SmartResolve. Check your connection and try again.";
  }
  if (!error.isAxiosError && error.message) return error.message;
  return "Your tickets could not be loaded. Please try again.";
}

const columns = [
  {
    key: "title",
    header: "Ticket",
    render: (ticket) => (
      <Link
        className="group flex min-w-48 items-center justify-between gap-3 rounded font-medium text-slate-800 hover:text-brand-700"
        to={`/employee/tickets/${ticket.id}`}
      >
        <span className="min-w-0">
          <span className="block truncate">{ticket.title}</span>
          <span className="mt-1 block text-[11px] font-normal text-muted">
            #{ticket.id.slice(0, 8)}
          </span>
        </span>
        <ArrowRight
          aria-hidden="true"
          className="size-4 shrink-0 text-slate-400 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100"
        />
      </Link>
    ),
  },
  {
    key: "status",
    header: "Status",
    render: (ticket) => <StatusBadge status={ticket.status} />,
  },
  {
    key: "priority",
    header: "Priority",
    render: (ticket) => <PriorityBadge priority={ticket.priority} />,
  },
  {
    key: "categoryName",
    header: "Category",
    render: (ticket) => ticket.categoryName || <span className="text-muted">Uncategorized</span>,
  },
  {
    key: "createdAt",
    header: "Submitted",
    className: "whitespace-nowrap",
    render: (ticket) => formatDate(ticket.createdAt),
  },
  {
    key: "updatedAt",
    header: "Last updated",
    className: "whitespace-nowrap",
    render: (ticket) => formatDate(ticket.updatedAt),
  },
];

export default function MyTicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [sort, setSort] = useState("createdAt-desc");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [retryCount, setRetryCount] = useState(0);
  const [request, setRequest] = useState({ requestKey: -1, status: "loading", error: "" });
  const isLoading = request.requestKey !== retryCount;
  const requestStatus = isLoading ? "loading" : request.status;

  useEffect(() => {
    const controller = new AbortController();

    getAllMyTickets({ signal: controller.signal })
      .then((result) => {
        setTickets(result);
        setRequest({ requestKey: retryCount, status: "success", error: "" });
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          setRequest({ requestKey: retryCount, status: "error", error: getErrorMessage(error) });
        }
      });

    return () => controller.abort();
  }, [retryCount]);

  const filteredTickets = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return tickets
      .filter((ticket) => !status || ticket.status === status)
      .filter((ticket) => !priority || ticket.priority === priority)
      .filter((ticket) => {
        if (!query) return true;
        return [
          ticket.title,
          ticket.description,
          ticket.issueSummary,
          ticket.categoryName,
          ticket.id,
        ].some((value) => String(value ?? "").toLocaleLowerCase().includes(query));
      })
      .sort((left, right) => compareTickets(left, right, sort));
  }, [tickets, status, priority, search, sort]);

  const pageCount = Math.ceil(filteredTickets.length / PAGE_SIZE);
  const visibleTickets = filteredTickets.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const hasActiveFilters = Boolean(search.trim() || status || priority);

  function updateFilter(setter) {
    return (event) => {
      setter(event.target.value);
      setPage(1);
    };
  }

  function clearFilters() {
    setSearch("");
    setStatus("");
    setPriority("");
    setSort("createdAt-desc");
    setPage(1);
  }

  return (
    <div className="grid gap-6">
      <PageHeading
        actions={(
          <Link
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
            to="/employee/tickets/create"
          >
            <Plus aria-hidden="true" className="size-4" />
            Create ticket
          </Link>
        )}
        description="Review your support requests, check their progress, or find a specific ticket."
        eyebrow="Employee support"
        title="My tickets"
      />

      <Card className="overflow-hidden">
        <CardHeader
          description="Only tickets submitted from your account are shown."
          title="Your support requests"
        />

        <div className="grid items-end gap-3 px-5 pb-5 sm:grid-cols-2 xl:grid-cols-[minmax(220px,1fr)_repeat(3,minmax(150px,190px))_auto]">
          <SearchInput
            className="sm:col-span-2 xl:col-span-1"
            id="ticket-search"
            label="Search"
            onChange={updateFilter(setSearch)}
            placeholder="Search title, description, or ID"
            visibleLabel
            value={search}
          />
          <FilterDropdown
            id="ticket-status"
            label="Status"
            onChange={updateFilter(setStatus)}
            options={statusOptions}
            value={status}
          />
          <FilterDropdown
            id="ticket-priority"
            label="Priority"
            onChange={updateFilter(setPriority)}
            options={priorityOptions}
            value={priority}
          />
          <FilterDropdown
            id="ticket-sort"
            label="Sort by"
            onChange={updateFilter(setSort)}
            options={sortOptions}
            value={sort}
          />
          <button
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!hasActiveFilters && sort === "createdAt-desc"}
            onClick={clearFilters}
            type="button"
          >
            <RotateCcw aria-hidden="true" className="size-4" />
            Clear
          </button>
        </div>

        {requestStatus === "loading" && <TableSkeleton columns={6} rows={6} />}
        {requestStatus === "error" && (
          <ErrorState
            description={request.error}
            onRetry={() => setRetryCount((count) => count + 1)}
            title="Tickets are unavailable"
          />
        )}
        {requestStatus === "success" && (
          <>
            <DataTable
              columns={columns}
              emptyDescription={hasActiveFilters
                ? "Try changing your search or filters to see more tickets."
                : "Submit a support request and it will appear here."}
              emptyTitle={hasActiveFilters ? "No matching tickets" : "You have not submitted any tickets"}
              rows={visibleTickets}
            />
            {tickets.length === 0 ? (
              <div className="border-t border-line px-5 py-4">
                <Link
                  className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-brand-600 px-4 text-sm font-medium text-white transition-colors hover:bg-brand-700"
                  to="/employee/tickets/create"
                >
                  <Plus aria-hidden="true" className="size-4" />
                  Create your first ticket
                </Link>
              </div>
            ) : filteredTickets.length > 0 && (
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
