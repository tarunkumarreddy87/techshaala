import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { BookOpen, FileText, Award, TrendingUp, CheckCircle, Circle, BrainCircuit } from "lucide-react";
import { StatCard } from "@/components/stat-card";
import { CourseCard } from "@/components/course-card";
import { AssignmentCard } from "@/components/assignment-card";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useLocation } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import type { EnrollmentWithCourse, AssignmentWithCourse, SubmissionWithDetails, Task } from "@shared/schema";

export default function StudentDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: enrollments, isLoading: enrollmentsLoading } = useQuery<EnrollmentWithCourse[]>({
    queryKey: ["/api/enrollments/my-courses"],
    enabled: !!user?.id,
  });

  const { data: assignments, isLoading: assignmentsLoading } = useQuery<(AssignmentWithCourse & {
    submission?: SubmissionWithDetails;
  })[]>({
    queryKey: ["/api/assignments/my-assignments"],
    enabled: !!user?.id,
  });

  const { data: tasks, isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
    enabled: !!user?.id,
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, isCompleted }: { id: string; isCompleted: boolean }) => {
      const res = await apiRequest("PATCH", `/api/tasks/${id}`, { isCompleted });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    },
  });

  const enrolledCoursesCount = enrollments?.length || 0;
  const pendingAssignments = assignments?.filter(a => !a.submission).length || 0;
  const completedAssignments = assignments?.filter(a => a.submission).length || 0;
  const averageGrade = assignments && assignments.length > 0
    ? assignments
      .filter(a => a.submission?.grade)
      .reduce((acc, a) => {
        const score = a.submission?.grade?.score || 0;
        const max = a.maxScore;
        return acc + (score / max) * 100;
      }, 0) / (assignments.filter(a => a.submission?.grade).length || 1)
    : 0;

  const totalTasks = tasks?.length || 0;
  const completedTasksCount = tasks?.filter(t => t.isCompleted).length || 0;
  const taskProgress = totalTasks > 0 ? (completedTasksCount / totalTasks) * 100 : 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user?.name}!</h1>
          <p className="text-muted-foreground mt-1">Track your learning progress and upcoming assignments</p>
        </div>
        <div className="flex gap-2">
            <Button onClick={() => setLocation("/student/ai-chat")} className="gap-2">
                <BrainCircuit className="h-4 w-4" />
                AI Assistant
            </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Enrolled Courses"
          value={enrolledCoursesCount}
          icon={BookOpen}
          description="Active courses"
        />
        <StatCard
          title="Pending Assignments"
          value={pendingAssignments}
          icon={FileText}
          description="Due soon"
        />
        <StatCard
          title="Completed"
          value={completedAssignments}
          icon={Award}
          description="Assignments submitted"
        />
        <StatCard
          title="Average Grade"
          value={isNaN(averageGrade) ? "N/A" : `${Math.round(averageGrade)}%`}
          icon={TrendingUp}
          description="Overall performance"
        />
      </div>

      {/* Task Progress Section */}
      <Card>
        <CardHeader>
            <CardTitle className="flex justify-between items-center">
                <span>Task Progress</span>
                <span className="text-sm font-normal text-muted-foreground">{completedTasksCount}/{totalTasks} Completed</span>
            </CardTitle>
        </CardHeader>
        <CardContent>
            <Progress value={taskProgress} className="h-2 mb-4" />
            {tasksLoading ? (
                <Skeleton className="h-20 w-full" />
            ) : tasks && tasks.length > 0 ? (
                <div className="space-y-2">
                    {tasks.map((task) => (
                        <div key={task.id} className="flex items-center space-x-2 p-2 rounded hover:bg-muted/50">
                            <Checkbox 
                                id={task.id} 
                                checked={task.isCompleted || false}
                                onCheckedChange={(checked) => updateTaskMutation.mutate({ id: task.id, isCompleted: checked as boolean })}
                            />
                            <label
                                htmlFor={task.id}
                                className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${task.isCompleted ? 'line-through text-muted-foreground' : ''}`}
                            >
                                {task.title}
                            </label>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-4 text-muted-foreground">
                    <p>No tasks yet. Create one to get started!</p>
                    <Button variant="link" onClick={() => {
                        // For demo purposes, create some default tasks if none exist
                        const defaultTasks = [
                            "Complete Profile Setup",
                            "Review Course Syllabus", 
                            "Submit First Assignment",
                            "Join Course Group Chat",
                            "Upload Study Notes",
                            "Try AI Chat Assistant",
                            "Check Grades"
                        ];
                        // We would typically have a proper UI for this, but for the "7 tasks" requirement:
                        Promise.all(defaultTasks.map(title => apiRequest("POST", "/api/tasks", { title })))
                            .then(() => queryClient.invalidateQueries({ queryKey: ["/api/tasks"] }));
                    }}>
                        Initialize Default Tasks
                    </Button>
                </div>
            )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-2xl font-semibold mb-4">My Courses</h2>
          {enrollmentsLoading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-48 w-full" />
              ))}
            </div>
          ) : enrollments && enrollments.length > 0 ? (
            <div className="space-y-4">
              {enrollments.slice(0, 3).map((enrollment) => (
                <CourseCard
                  key={enrollment.id}
                  course={enrollment.course}
                  onClick={() => setLocation(`/student/course/${enrollment.course.id}`)}
                  actionButton={
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLocation(`/student/course/${enrollment.course.id}`);
                      }}
                      data-testid={`button-view-course-${enrollment.course.id}`}
                    >
                      View Course
                    </Button>
                  }
                />
              ))}
              {enrollments.length > 3 && (
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => setLocation("/student/courses")}
                  data-testid="button-view-all-courses"
                >
                  View all courses ({enrollments.length})
                </Button>
              )}
            </div>
          ) : (
            <EmptyState
              icon={BookOpen}
              title="No courses yet"
              description="Start your learning journey by enrolling in a course"
              action={{
                label: "Browse Courses",
                onClick: () => setLocation("/student/courses"),
              }}
            />
          )}
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-4">Upcoming Assignments</h2>
          {assignmentsLoading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-40 w-full" />
              ))}
            </div>
          ) : assignments && assignments.length > 0 ? (
            <div className="space-y-4">
              {assignments
                .filter(a => !a.submission)
                .slice(0, 3)
                .map((assignment) => (
                  <AssignmentCard
                    key={assignment.id}
                    assignment={assignment}
                    showCourse
                    actionButton={
                      <Button
                        className="w-full"
                        onClick={() => setLocation(`/student/assignment/${assignment.id}`)}
                        data-testid={`button-submit-assignment-${assignment.id}`}
                      >
                        Submit Assignment
                      </Button>
                    }
                  />
                ))}
              {pendingAssignments > 3 && (
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => setLocation("/student/assignments")}
                  data-testid="button-view-all-assignments"
                >
                  View all assignments ({pendingAssignments} pending)
                </Button>
              )}
            </div>
          ) : (
            <EmptyState
              icon={FileText}
              title="No assignments"
              description="You don't have any upcoming assignments at the moment"
            />
          )}
        </div>
      </div>
    </div>
  );
}
