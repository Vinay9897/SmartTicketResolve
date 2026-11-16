import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import Button from "./ui/Button.jsx";
import { TextArea, TextInput } from "./ui/FormField.jsx";
import Modal from "./ui/Modal.jsx";
import { createAdminCategory, updateAdminCategory } from "../services/adminCategoryService.js";

const categoryFormSchema = z.object({
  name: z.string()
    .trim()
    .min(1, "Category name is required.")
    .max(100, "Category name must be 100 characters or fewer."),
  description: z.string()
    .max(500, "Description must be 500 characters or fewer."),
});

function getErrorMessage(error) {
  const message = error.response?.data?.message;
  if (typeof message === "string" && message.trim()) return message;
  if (error.response?.status === 401) return "Your session has expired. Sign in again.";
  if (error.response?.status === 403) return "Only administrators can manage ticket categories.";
  if (error.response?.status === 404) return "This category is no longer available.";
  if (error.response?.status === 409) return "A category with this name already exists.";
  if (error.isAxiosError && !error.response) {
    return "Could not connect to SmartResolve. Check your connection and try again.";
  }
  if (error.message) return error.message;
  return "The category could not be saved. Please try again.";
}

export default function AdminCategoryFormDialog({
  mode,
  category,
  categories,
  onClose,
  onSaved,
}) {
  const [serverError, setServerError] = useState("");
  const isCreate = mode === "create";
  const formId = "admin-category-form";
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: category?.name ?? "",
      description: category?.description ?? "",
    },
  });

  async function onSubmit(values) {
    setServerError("");
    const request = {
      name: values.name,
      description: values.description.trim() || null,
    };
    const normalizedName = values.name.trim().toLocaleLowerCase();
    const duplicate = categories.some((item) => (
      item.id !== category?.id && item.name.trim().toLocaleLowerCase() === normalizedName
    ));
    if (duplicate) {
      const message = "A category with this name already exists.";
      setServerError(message);
      toast.error(message);
      return;
    }

    try {
      if (isCreate) await createAdminCategory(request);
      else await updateAdminCategory(category.id, request);
      toast.success(isCreate ? "Category created." : "Category updated.");
      onSaved();
      onClose();
    } catch (error) {
      const message = getErrorMessage(error);
      setServerError(message);
      toast.error(message);
    }
  }

  return (
    <Modal
      description={isCreate
        ? "Add a category that administrators and support teams can use to organize tickets."
        : "Update this category's name or description."}
      onClose={() => {
        if (!isSubmitting) onClose();
      }}
      open
      title={isCreate ? "Add ticket category" : "Edit ticket category"}
      footer={(
        <>
          <Button disabled={isSubmitting} onClick={onClose} type="button" variant="secondary">
            Cancel
          </Button>
          <Button disabled={isSubmitting} form={formId} loading={isSubmitting} type="submit">
            {isCreate ? "Add category" : "Save changes"}
          </Button>
        </>
      )}
    >
      <form aria-busy={isSubmitting} className="grid gap-4" id={formId} noValidate onSubmit={handleSubmit(onSubmit)}>
        {serverError && (
          <p className="rounded-lg border border-critical/20 bg-critical-soft px-3 py-2 text-sm text-critical" role="alert">
            {serverError}
          </p>
        )}
        <TextInput
          autoComplete="off"
          disabled={isSubmitting}
          error={errors.name?.message}
          id="admin-category-name"
          label="Category name"
          maxLength={100}
          placeholder="For example, Network access"
          required
          {...register("name")}
        />
        <TextArea
          disabled={isSubmitting}
          error={errors.description?.message}
          id="admin-category-description"
          label="Description"
          maxLength={500}
          placeholder="Describe the types of issues in this category."
          rows={4}
          {...register("description")}
        />
      </form>
    </Modal>
  );
}
