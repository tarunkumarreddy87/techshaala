import { useAuth } from "@/lib/auth-context";
import { Redirect } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "student" | "teacher" | "admin";
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
  }, []);

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
    // If user has wrong role, redirect to their dashboard
    const redirectPath = user.role === "student" ? "/student/dashboard" : 
                        user.role === "teacher" ? "/teacher/dashboard" : 
                        "/admin/dashboard";
    return <Redirect to={redirectPath} />;
  }

  return <>{children}</>;
}