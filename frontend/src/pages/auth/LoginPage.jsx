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
import { loginSchema } from "../../schemas/authSchemas.js";
import { getAuthErrorMessage } from "../../services/authService.js";

export default function LoginPage() {
  const { isAuthenticated, isRestoring, restoreError, sessionExpired, signIn, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  if (isRestoring) return <AuthLoadingState />;
  if (isAuthenticated) {
    return <Navigate to={getDashboardPath(user.role)} replace />;
  }

  async function onSubmit(credentials) {
    setServerError("");
    try {
      const authenticatedUser = await signIn(credentials);
      toast.success(`Welcome back, ${authenticatedUser.name}.`);
      navigate(getPostAuthPath(location, authenticatedUser.role), { replace: true });
    } catch (error) {
      setServerError(getAuthErrorMessage(error, "We couldn't sign you in. Please try again."));
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      description="Sign in with your work email to continue to your support workspace."
    >
      <form aria-busy={isSubmitting} className="grid gap-5" onSubmit={handleSubmit(onSubmit)} noValidate>
        <AuthFormError
          message={
            serverError ||
            restoreError ||
            (sessionExpired ? "Your session expired or is no longer valid. Sign in again." : "")
          }
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
          autoComplete="current-password"
          error={errors.password?.message}
          id="password"
          label="Password"
          placeholder="Enter your password"
          required
          {...register("password")}
        />
        <Button className="mt-1 w-full" loading={isSubmitting} size="lg" type="submit">
          {isSubmitting ? "Signing in..." : "Sign in"}
        </Button>
        {isSubmitting && <span className="sr-only" role="status">Signing in to SmartResolve</span>}
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        New to SmartResolve?{" "}
        <Link className="font-semibold text-brand-700 hover:text-brand-600" to="/register">
          Create an account
        </Link>
      </p>
    </AuthLayout>
  );
}
