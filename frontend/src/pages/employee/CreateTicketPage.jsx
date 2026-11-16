import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, LifeBuoy } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import AuthFormError from "../../components/auth/AuthFormError.jsx";
import Card from "../../components/ui/Card.jsx";
import Button from "../../components/ui/Button.jsx";
import { TextArea, TextInput } from "../../components/ui/FormField.jsx";
import PageHeading from "../../components/ui/PageHeading.jsx";
import { createTicketSchema } from "../../schemas/ticketSchemas.js";
import { createTicket } from "../../services/ticketService.js";

function getCreateErrorMessage(error) {
  const serverMessage = error.response?.data?.message;
  if (typeof serverMessage === "string" && serverMessage.trim()) return serverMessage;
  if (error.response?.status === 401) return "Your session has expired. Sign in again to submit a ticket.";
  if (error.response?.status === 403) return "Your account cannot create a support ticket.";
  if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
    return "The request timed out. Your ticket may still have been created; check My Tickets before trying again.";
  }
  if (error.isAxiosError && !error.response) {
    return "Could not connect to SmartResolve. Check your connection and try again.";
  }
  if (!error.isAxiosError && error.message) return error.message;
  return "Your ticket could not be submitted. Please try again.";
}

export default function CreateTicketPage() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState("");
  const [submissionStarted, setSubmissionStarted] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(createTicketSchema),
    defaultValues: { title: "", description: "" },
  });

  async function onSubmit(values) {
    if (submissionStarted) return;
    setSubmissionStarted(true);
    setServerError("");

    try {
      const ticket = await createTicket(values);
      toast.success("Your support ticket was submitted.");
      navigate(`/employee/tickets/${ticket.id}`, {
        replace: true,
        state: { createdTicket: ticket },
      });
    } catch (error) {
      setServerError(getCreateErrorMessage(error));
    } finally {
      setSubmissionStarted(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-3xl gap-6">
      <PageHeading
        actions={(
          <Link
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-line bg-white px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            to="/employee/dashboard"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            Back to dashboard
          </Link>
        )}
        description="Tell us what happened. Your support team will review the request and follow up."
        eyebrow="Employee support"
        title="Create a support ticket"
      />

      <Card className="overflow-hidden">
        <div className="flex items-start gap-3 border-b border-line bg-slate-50/70 px-5 py-4 sm:px-6">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700">
            <LifeBuoy aria-hidden="true" className="size-[18px]" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-ink">Request details</h2>
            <p className="mt-1 text-xs leading-5 text-muted">
              Priority defaults to Medium. Category selection is not available in the employee ticket form.
            </p>
          </div>
        </div>

        <form
          aria-busy={isSubmitting || submissionStarted}
          className="grid gap-5 p-5 sm:p-6"
          noValidate
          onSubmit={handleSubmit(onSubmit)}
        >
          <AuthFormError message={serverError} />
          <TextInput
            autoComplete="off"
            error={errors.title?.message}
            id="ticket-title"
            label="Ticket title"
            maxLength={200}
            placeholder="A short summary of the issue"
            required
            {...register("title")}
          />
          <TextArea
            error={errors.description?.message}
            id="ticket-description"
            label="Detailed problem description"
            maxLength={20000}
            placeholder="Describe what you were trying to do, what happened, and any error message you saw."
            required
            rows={7}
            {...register("description")}
          />
          <p className="-mt-3 text-xs leading-5 text-muted">
            Please include relevant details, but do not include passwords or other sensitive credentials.
          </p>
          <div className="flex flex-col-reverse gap-3 border-t border-line pt-5 sm:flex-row sm:justify-end">
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-line bg-white px-5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              to="/employee/dashboard"
            >
              Cancel
            </Link>
            <Button
              className="sm:min-w-40"
              loading={isSubmitting || submissionStarted}
              size="lg"
              type="submit"
            >
              {isSubmitting || submissionStarted ? "Submitting ticket..." : "Submit ticket"}
            </Button>
          </div>
          {(isSubmitting || submissionStarted) && (
            <span className="sr-only" role="status">Submitting your support ticket</span>
          )}
        </form>
      </Card>
    </div>
  );
}
