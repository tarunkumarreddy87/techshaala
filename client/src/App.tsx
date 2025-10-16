import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeProvider } from "@/lib/theme-provider";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { ProtectedRoute } from "@/components/protected-route";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";

import Login from "@/pages/login";
import Register from "@/pages/register";
import StudentDashboard from "@/pages/student-dashboard";
import TeacherDashboard from "@/pages/teacher-dashboard";
import StudentCourses from "@/pages/student-courses";
import StudentCourseDetail from "@/pages/student-course-detail";
import TeacherCourseDetail from "@/pages/teacher-course-detail";
import CreateCourse from "@/pages/create-course";
import CreateAssignment from "@/pages/create-assignment";
import SubmitAssignment from "@/pages/submit-assignment";
import TeacherAssignmentSubmissions from "@/pages/teacher-assignment-submissions";
import StudentGrades from "@/pages/student-grades";
import StudentAssignments from "@/pages/student-assignments";
import NotFound from "@/pages/not-found";

function HomeRedirect() {
  const { user } = useAuth();
  
  if (!user) {
    return <Redirect to="/login" />;
  }
  
  const redirectPath = user.role === "student" ? "/student/dashboard" : "/teacher/dashboard";
  return <Redirect to={redirectPath} />;
}

function Router() {
  const { user } = useAuth();

  return (
    <Switch>
      <Route path="/" component={HomeRedirect} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      
      {/* Student Routes */}
      <Route path="/student/dashboard">
        <ProtectedRoute requiredRole="student">
          <StudentDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/student/courses">
        <ProtectedRoute requiredRole="student">
          <StudentCourses />
        </ProtectedRoute>
      </Route>
      <Route path="/student/course/:id">
        <ProtectedRoute requiredRole="student">
          <StudentCourseDetail />
        </ProtectedRoute>
      </Route>
      <Route path="/student/assignment/:id">
        <ProtectedRoute requiredRole="student">
          <SubmitAssignment />
        </ProtectedRoute>
      </Route>
      <Route path="/student/assignments">
        <ProtectedRoute requiredRole="student">
          <StudentAssignments />
        </ProtectedRoute>
      </Route>
      <Route path="/student/grades">
        <ProtectedRoute requiredRole="student">
          <StudentGrades />
        </ProtectedRoute>
      </Route>

      {/* Teacher Routes */}
      <Route path="/teacher/dashboard">
        <ProtectedRoute requiredRole="teacher">
          <TeacherDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/teacher/courses">
        <ProtectedRoute requiredRole="teacher">
          <TeacherDashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/teacher/course/:id">
        <ProtectedRoute requiredRole="teacher">
          <TeacherCourseDetail />
        </ProtectedRoute>
      </Route>
      <Route path="/teacher/create-course">
        <ProtectedRoute requiredRole="teacher">
          <CreateCourse />
        </ProtectedRoute>
      </Route>
      <Route path="/teacher/course/:courseId/create-assignment">
        <ProtectedRoute requiredRole="teacher">
          <CreateAssignment />
        </ProtectedRoute>
      </Route>
      <Route path="/teacher/assignment/:id">
        <ProtectedRoute requiredRole="teacher">
          <TeacherAssignmentSubmissions />
        </ProtectedRoute>
      </Route>
      <Route path="/teacher/assignments">
        <ProtectedRoute requiredRole="teacher">
          <TeacherDashboard />
        </ProtectedRoute>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { user } = useAuth();
  const isAuthPage = window.location.pathname === "/login" || window.location.pathname === "/register";

  if (isAuthPage || !user) {
    return <Router />;
  }

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between p-4 border-b bg-background">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-y-auto">
            <Router />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light">
        <AuthProvider>
          <TooltipProvider>
            <AppContent />
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
