import { useEffect, useState } from "react";
import { Eye, Pencil, Plus, ToggleLeft, ToggleRight } from "lucide-react";
import toast from "react-hot-toast";
import AdminCategoryFormDialog from "../components/AdminCategoryFormDialog.jsx";
import Badge from "../components/ui/Badge.jsx";
import Button from "../components/ui/Button.jsx";
import Card, { CardHeader } from "../components/ui/Card.jsx";
import ConfirmationDialog from "../components/ui/ConfirmationDialog.jsx";
import DataTable from "../components/ui/DataTable.jsx";
import ErrorState from "../components/ui/ErrorState.jsx";
import Modal from "../components/ui/Modal.jsx";
import PageHeading from "../components/ui/PageHeading.jsx";
import Skeleton from "../components/ui/Skeleton.jsx";
import {
  deactivateAdminCategory,
  getAdminCategories,
  updateAdminCategory,
} from "../services/adminCategoryService.js";

function getErrorMessage(error) {
  const message = error.response?.data?.message;
  if (typeof message === "string" && message.trim()) return message;
  if (error.response?.status === 401) return "Your session has expired. Sign in again to manage categories.";
  if (error.response?.status === 403) return "Only administrators can access category management.";
  if (error.response?.status === 404) return "This category is no longer available.";
  if (error.response?.status === 409) return "The category update conflicts with an existing category.";
  if (error.isAxiosError && !error.response) {
    return "Could not connect to SmartResolve. Check your connection and try again.";
  }
  if (error.message) return error.message;
  return "Category data could not be loaded. Please try again.";
}

function CategoryListSkeleton() {
  return (
    <div aria-label="Loading ticket categories" className="grid gap-4 p-5" role="status">
      {Array.from({ length: 5 }, (_, index) => (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4" key={index}>
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-4 w-full max-w-56" />
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-8 w-24" />
        </div>
      ))}
      <span className="sr-only">Loading ticket category records</span>
    </div>
  );
}

function CategoryDetailsDialog({ category, onClose }) {
  return (
    <Modal
      description="Category details from the administrator catalog API."
      onClose={onClose}
      open
      title="Ticket category details"
    >
      <dl className="grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted">Name</dt>
          <dd className="mt-1 break-words text-sm text-slate-800">{category.name}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-muted">Status</dt>
          <dd className="mt-1">
            <Badge variant={category.active ? "success" : "neutral"}>
              {category.active ? "Active" : "Inactive"}
            </Badge>
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs font-medium uppercase tracking-wide text-muted">Description</dt>
          <dd className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
            {category.description || "No description provided."}
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs font-medium uppercase tracking-wide text-muted">Category ID</dt>
          <dd className="mt-1 break-all font-mono text-xs text-slate-600">{category.id}</dd>
        </div>
      </dl>
    </Modal>
  );
}

export default function AdminCategoriesPage() {
  const [retryCount, setRetryCount] = useState(0);
  const [result, setResult] = useState({ requestId: -1, status: "loading", categories: [], error: "" });
  const [dialog, setDialog] = useState(null);
  const [deactivatingCategory, setDeactivatingCategory] = useState(null);
  const [changingCategoryId, setChangingCategoryId] = useState(null);

  const isLoading = result.requestId !== retryCount;
  const categories = !isLoading && result.status === "success" ? result.categories : [];
  const error = !isLoading && result.status === "error" ? result.error : "";

  useEffect(() => {
    const controller = new AbortController();
    getAdminCategories({ signal: controller.signal })
      .then((items) => {
        setResult({ requestId: retryCount, status: "success", categories: items, error: "" });
      })
      .catch((requestError) => {
        if (!controller.signal.aborted) {
          setResult({
            requestId: retryCount,
            status: "error",
            categories: [],
            error: getErrorMessage(requestError),
          });
        }
      });
    return () => controller.abort();
  }, [retryCount]);

  function refreshCategories() {
    setRetryCount((count) => count + 1);
  }

  async function reactivateCategory(category) {
    setChangingCategoryId(category.id);
    try {
      await updateAdminCategory(category.id, {
        name: category.name,
        description: category.description,
        active: true,
      });
      toast.success("Category activated.");
      refreshCategories();
    } catch (requestError) {
      const message = getErrorMessage(requestError);
      toast.error(message);
    } finally {
      setChangingCategoryId(null);
    }
  }

  async function deactivateCategory() {
    if (!deactivatingCategory) return;
    setChangingCategoryId(deactivatingCategory.id);
    try {
      await deactivateAdminCategory(deactivatingCategory.id);
      toast.success("Category deactivated.");
      setDeactivatingCategory(null);
      refreshCategories();
    } catch (requestError) {
      const message = getErrorMessage(requestError);
      toast.error(message);
    } finally {
      setChangingCategoryId(null);
    }
  }

  const columns = [
    {
      key: "name",
      header: "Category",
      render: (category) => <span className="font-medium text-slate-800">{category.name}</span>,
    },
    {
      key: "description",
      header: "Description",
      render: (category) => (
        <span className="block max-w-xl truncate text-slate-600">
          {category.description || "—"}
        </span>
      ),
    },
    {
      key: "active",
      header: "Status",
      render: (category) => (
        <Badge variant={category.active ? "success" : "neutral"}>
          {category.active ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      className: "whitespace-nowrap",
      render: (category) => (
        <div className="flex items-center gap-2">
          <Button
            aria-label={`View ${category.name} details`}
            className="size-10 shrink-0 px-0"
            onClick={() => setDialog({ kind: "details", category })}
            title="View details"
            type="button"
            variant="ghost"
          >
            <Eye aria-hidden="true" className="size-5 shrink-0" />
          </Button>
          <Button
            aria-label={`Edit ${category.name}`}
            className="size-10 shrink-0 px-0"
            onClick={() => setDialog({ kind: "edit", category })}
            title="Edit category"
            type="button"
            variant="ghost"
          >
            <Pencil aria-hidden="true" className="size-5 shrink-0" />
          </Button>
          {category.active ? (
            <Button
              aria-label={`Deactivate ${category.name}`}
              className="size-10 shrink-0 px-0 text-critical"
              disabled={Boolean(changingCategoryId)}
              onClick={() => setDeactivatingCategory(category)}
              title="Deactivate category"
              type="button"
              variant="ghost"
            >
              <ToggleLeft aria-hidden="true" className="size-5 shrink-0" />
            </Button>
          ) : (
            <Button
              aria-label={`Activate ${category.name}`}
              className="size-10 shrink-0 px-0 text-success"
              disabled={Boolean(changingCategoryId)}
              onClick={() => reactivateCategory(category)}
              title="Activate category"
              type="button"
              variant="ghost"
            >
              <ToggleRight aria-hidden="true" className="size-5 shrink-0" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="mx-auto grid max-w-[1480px] gap-6">
        <PageHeading
          description="Create and maintain the categories used to organize support tickets."
          eyebrow="Administration"
          title="Ticket categories"
        />
        <Card className="overflow-hidden">
          <CardHeader title="Categories" />
          <CategoryListSkeleton />
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl">
        <PageHeading
          description="Create and maintain the categories used to organize support tickets."
          eyebrow="Administration"
          title="Ticket categories"
        />
        <ErrorState
          className="mt-6"
          description={error}
          onRetry={refreshCategories}
          title="Categories could not be loaded"
        />
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-[1480px] gap-6">
      <PageHeading
        actions={(
          <Button onClick={() => setDialog({ kind: "create" })} type="button">
            <Plus aria-hidden="true" className="size-4" />
            Add category
          </Button>
        )}
        description="Create and maintain the categories used to organize support tickets."
        eyebrow="Administration"
        title="Ticket categories"
      />

      <Card className="overflow-hidden">
        <CardHeader
          description="Inactive categories are retained for existing ticket history and can be reactivated."
          title="Categories"
        />
        <DataTable
          columns={columns}
          emptyDescription="Add a category to help organize support tickets."
          emptyTitle="No ticket categories yet"
          rows={categories}
        />
      </Card>

      {dialog?.kind === "details" && (
        <CategoryDetailsDialog
          category={dialog.category}
          onClose={() => setDialog(null)}
        />
      )}
      {(dialog?.kind === "create" || dialog?.kind === "edit") && (
        <AdminCategoryFormDialog
          categories={categories}
          category={dialog.category}
          key={dialog.kind === "edit" ? dialog.category.id : "create-category"}
          mode={dialog.kind}
          onClose={() => setDialog(null)}
          onSaved={refreshCategories}
        />
      )}
      <ConfirmationDialog
        confirmText="Deactivate category"
        description={deactivatingCategory
          ? `Deactivate "${deactivatingCategory.name}"? It will remain attached to existing tickets but won't be available for new category assignments.`
          : ""}
        destructive
        loading={Boolean(deactivatingCategory && changingCategoryId === deactivatingCategory.id)}
        onClose={() => {
          if (!changingCategoryId) setDeactivatingCategory(null);
        }}
        onConfirm={deactivateCategory}
        open={Boolean(deactivatingCategory)}
        title="Deactivate this category?"
      />
    </div>
  );
}
