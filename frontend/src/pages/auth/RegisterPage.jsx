import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import AuthFormError from "../../components/auth/AuthFormError.jsx";
import AuthLayout from "../../components/auth/AuthLayout.jsx";
import AuthLoadingState from "../../components/auth/AuthLoadingState.jsx";
import PasswordInput from "../../components/auth/PasswordInput.jsx";
import Button from "../../components/ui/Button.jsx";
import { TextInput } from "../../components/ui/FormField.jsx";
import { getDashboardPath, getPostAuthPath } from "../../constants/auth.js";
import { useAuth } from "../../auth/useAuth.js";
import { registrationSchema } from "../../schemas/authSchemas.js";
import { getAuthErrorMessage } from "../../services/authService.js";

export default function RegisterPage() {
  const { isAuthenticated, isRestoring, restoreError, sessionExpired, signUp, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registrationSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

  if (isRestoring) return <AuthLoadingState />;
  if (isAuthenticated) {
    return <Navigate to={getDashboardPath(user.role)} replace />;
  }

  async function onSubmit(registration) {
    setServerError("");
    try {
      const authenticatedUser = await signUp(registration);
      toast.success("Your employee account is ready.");
      navigate(getPostAuthPath(location, authenticatedUser.role), { replace: true });
    } catch (error) {
      setServerError(getAuthErrorMessage(error, "We couldn't create your account. Please try again."));
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      description="Set up an employee account to submit and track support requests."
    >
      <form aria-busy={isSubmitting} className="grid gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <AuthFormError
          message={
            serverError ||
            restoreError ||
            (sessionExpired ? "Your session expired or is no longer valid. Sign in again." : "")
          }
        />
        <TextInput
          autoComplete="name"
          error={errors.name?.message}
          id="name"
          label="Full name"
          placeholder="Your name"
          required
          {...register("name")}
        />
        <TextInput
          autoComplete="email"
          error={errors.email?.message}
          id="email"
          label="Work email"
          placeholder="name@company.com"
          required
          type="email"
          {...register("email")}
        />
        <PasswordInput
          autoComplete="new-password"
          error={errors.password?.message}
          id="password"
          label="Password"
          placeholder="At least 12 characters"
          required
          {...register("password")}
        />
        <PasswordInput
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          id="confirm-password"
          label="Confirm password"
          placeholder="Enter your password again"
          required
          {...register("confirmPassword")}
        />
        <p className="-mt-2 text-xs leading-5 text-muted">
          Use 12–72 characters. Your account is registered with the Employee role.
        </p>
        <Button className="mt-1 w-full" loading={isSubmitting} size="lg" type="submit">
          {isSubmitting ? "Creating account..." : "Create account"}
        </Button>
        {isSubmitting && <span className="sr-only" role="status">Creating your SmartResolve account</span>}
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link className="font-semibold text-brand-700 hover:text-brand-600" to="/login">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
