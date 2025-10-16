import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { BookOpen, FileText, Award, TrendingUp } from "lucide-react";
import { StatCard } from "@/components/stat-card";
import { CourseCard } from "@/components/course-card";
import { AssignmentCard } from "@/components/assignment-card";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";
import type { EnrollmentWithCourse, AssignmentWithCourse, SubmissionWithDetails } from "@shared/schema";

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

  const enrolledCoursesCount = enrollments?.length || 0;
  const pendingAssignments = assignments?.filter(a => !a.submission).length || 0;
  const completedAssignments = assignments?.filter(a => a.submission).length || 0;
  const averageGrade = assignments
    ?.filter(a => a.submission?.grade)
    .reduce((acc, a) => {
      const score = a.submission?.grade?.score || 0;
      const max = a.maxScore;
      return acc + (score / max) * 100;
    }, 0) / (assignments?.filter(a => a.submission?.grade).length || 1);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user?.name}!</h1>
        <p className="text-muted-foreground mt-1">Track your learning progress and upcoming assignments</p>
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
