import { useEffect } from "react";
import { Link } from "react-router-dom";
import AuthLayout from "../../components/auth/AuthLayout.jsx";
import Button from "../../components/ui/Button.jsx";
import ErrorState from "../../components/ui/ErrorState.jsx";
import { getDashboardPath } from "../../constants/auth.js";
import { useAuth } from "../../auth/useAuth.js";

export default function UnauthorizedPage() {
  const { clearAccessDenied, isAuthenticated, user } = useAuth();

  useEffect(() => {
    clearAccessDenied();
  }, [clearAccessDenied]);

  return (
    <AuthLayout
      title="Access restricted"
      description="Your account does not have permission to view this resource."
    >
      <ErrorState
        className="min-h-0 px-2 py-4"
        title="You don't have access"
        description="Sign in with an account that has the required role, or return to your workspace."
      />
      {isAuthenticated ? (
        <Link className="mt-2 block" to={getDashboardPath(user.role)}>
          <Button className="w-full" size="lg">Return to workspace</Button>
        </Link>
      ) : (
        <Link className="mt-2 block" to="/login">
          <Button className="w-full" size="lg">Go to sign in</Button>
        </Link>
      )}
    </AuthLayout>
  );
}
