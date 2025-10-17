import { useAuth } from "@/lib/auth-context";
import { Redirect } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "student" | "teacher";
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, isLoading, refreshAuth } = useAuth();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      await refreshAuth();
      setIsCheckingAuth(false);
    };

    checkAuth();
  }, [refreshAuth]);

  if (isLoading || isCheckingAuth) {
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