import { useAuth } from "@/lib/auth-context";
import { Redirect } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "student" | "teacher";
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen p-6">
        <Skeleton className="h-full w-full" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  if (requiredRole && user.role !== requiredRole) {
    const redirectPath = user.role === "student" ? "/student/dashboard" : "/teacher/dashboard";
    return <Redirect to={redirectPath} />;
  }

  return <>{children}</>;
}
