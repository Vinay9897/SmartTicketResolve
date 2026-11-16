import { useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import Button from "./ui/Button.jsx";
import { SelectInput, TextInput } from "./ui/FormField.jsx";
import Modal from "./ui/Modal.jsx";
import { createAdminUser, updateAdminUser } from "../services/adminUserService.js";

const roles = ["EMPLOYEE", "SUPPORT_ENGINEER", "ADMIN"];
const emailSchema = z.string()
  .trim()
  .max(254, "Email must be 254 characters or fewer.")
  .email("Enter a valid email address.");
const nameSchema = z.string()
  .trim()
  .min(1, "Name is required.")
  .max(160, "Name must be 160 characters or fewer.");
const passwordByteLength = (password) => new TextEncoder().encode(password).length;
const createPasswordSchema = z.string()
  .min(12, "Password must be at least 12 characters.")
  .max(72, "Password must be 72 characters or fewer.")
  .refine((password) => passwordByteLength(password) <= 72, {
    message: "Password must be 72 UTF-8 bytes or fewer.",
  });
const updatePasswordSchema = z.string()
  .max(72, "Password must be 72 characters or fewer.")
  .refine((password) => !password || password.length >= 12, {
    message: "Password must be at least 12 characters when changing it.",
  })
  .refine((password) => !password || passwordByteLength(password) <= 72, {
    message: "Password must be 72 UTF-8 bytes or fewer.",
  });

const commonFields = {
  name: nameSchema,
  email: emailSchema,
  role: z.enum(roles),
};
const createUserSchema = z.object({ ...commonFields, password: createPasswordSchema });
const updateUserSchema = z.object({ ...commonFields, password: updatePasswordSchema });

function getErrorMessage(error) {
  const message = error.response?.data?.message;
  if (typeof message === "string" && message.trim()) return message;
  if (error.response?.status === 401) return "Your session has expired. Sign in again.";
  if (error.response?.status === 403) return "Only administrators can manage users.";
  if (error.response?.status === 404) return "This user is no longer available.";
  if (error.response?.status === 409) return "The email address is already in use.";
  if (error.isAxiosError && !error.response) {
    return "Could not connect to SmartResolve. Check your connection and try again.";
  }
  if (error.message) return error.message;
  return "The user could not be saved. Please try again.";
}

export default function AdminUserFormDialog({ mode, user, onClose, onSaved }) {
  const [serverError, setServerError] = useState("");
  const isCreate = mode === "create";
  const formId = "admin-user-form";
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(isCreate ? createUserSchema : updateUserSchema),
    defaultValues: {
      name: user?.name ?? "",
      email: user?.email ?? "",
      role: user?.role ?? "EMPLOYEE",
      password: "",
    },
  });

  async function onSubmit(values) {
    setServerError("");
    const request = {
      name: values.name,
      email: values.email,
      role: values.role,
    };
    if (isCreate || values.password) request.password = values.password;

    try {
      if (isCreate) await createAdminUser(request);
      else await updateAdminUser(user.id, request);
      toast.success(isCreate ? "User created." : "User updated.");
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
        ? "Create an administrator-managed account with the selected role."
        : "Update the user's profile and role. Leave password blank to keep it unchanged."}
      onClose={() => {
        if (!isSubmitting) onClose();
      }}
      open
      title={isCreate ? "Create user" : "Edit user"}
      footer={(
        <>
          <Button disabled={isSubmitting} onClick={onClose} type="button" variant="secondary">
            Cancel
          </Button>
          <Button disabled={isSubmitting} form={formId} loading={isSubmitting} type="submit">
            {isCreate ? "Create user" : "Save changes"}
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
          autoComplete="name"
          disabled={isSubmitting}
          error={errors.name?.message}
          id="admin-user-name"
          label="Full name"
          maxLength={160}
          required
          {...register("name")}
        />
        <TextInput
          autoComplete="email"
          disabled={isSubmitting}
          error={errors.email?.message}
          id="admin-user-email"
          label="Email"
          maxLength={254}
          required
          type="email"
          {...register("email")}
        />
        <SelectInput
          disabled={isSubmitting}
          error={errors.role?.message}
          id="admin-user-role"
          label="Role"
          required
          {...register("role")}
        >
          {roles.map((role) => <option key={role} value={role}>{role.replaceAll("_", " ")}</option>)}
        </SelectInput>
        <TextInput
          autoComplete="new-password"
          disabled={isSubmitting}
          error={errors.password?.message}
          hint={isCreate ? "Use 12–72 characters." : "Optional. Use 12–72 characters to set a new password."}
          id="admin-user-password"
          label={isCreate ? "Temporary password" : "New password"}
          maxLength={72}
          required={isCreate}
          type="password"
          {...register("password")}
        />
      </form>
    </Modal>
  );
}
