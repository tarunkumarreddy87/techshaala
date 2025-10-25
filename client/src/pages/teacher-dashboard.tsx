import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { BookOpen, Users, FileText, Clock, TrendingUp, Calendar, Award } from "lucide-react";
import { StatCard } from "@/components/stat-card";
import { CourseCard } from "@/components/course-card";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import type { CourseWithTeacher, Assignment } from "@shared/schema";

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: courses, isLoading: coursesLoading } = useQuery<CourseWithTeacher[]>({
    queryKey: ["/api/courses/my-courses"],
    enabled: !!user?.id,
  });

  const { data: stats } = useQuery<{
    totalStudents: number;
    pendingSubmissions: number;
    totalAssignments: number;
  }>({
    queryKey: ["/api/teacher/stats"],
    enabled: !!user?.id,
  });

  const { data: recentAssignments } = useQuery<Assignment[]>({
    queryKey: ["/api/teacher/recent-assignments"],
    enabled: !!user?.id,
  });

  const totalCourses = courses?.length || 0;
  const totalStudents = stats?.totalStudents || 0;
  const totalAssignments = stats?.totalAssignments || 0;
  const pendingSubmissions = stats?.pendingSubmissions || 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user?.name}!</h1>
          <p className="text-muted-foreground mt-1">Manage your courses and track student progress</p>
        </div>
        <Button
          size="lg"
          onClick={() => setLocation("/teacher/create-course")}
          data-testid="button-create-course"
        >
          <BookOpen className="h-4 w-4 mr-2" />
          Create Course
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Courses"
          value={totalCourses}
          icon={BookOpen}
          description="Active courses"
        />
        <div onClick={() => setLocation("/teacher/students")} className="cursor-pointer">
          <StatCard
            title="Total Students"
            value={totalStudents}
            icon={Users}
            description="Enrolled across all courses"
          />
        </div>
        <StatCard
          title="Total Assignments"
          value={totalAssignments}
          icon={FileText}
          description="Created assignments"
        />
        <StatCard
          title="Pending Reviews"
          value={pendingSubmissions}
          icon={Clock}
          description="Awaiting grading"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Assignments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Recent Assignments
            </CardTitle>
            <CardDescription>Latest assignments you've created</CardDescription>
          </CardHeader>
          <CardContent>
            {recentAssignments && recentAssignments.length > 0 ? (
              <div className="space-y-3">
                {recentAssignments.slice(0, 5).map((assignment) => (
                  <div 
                    key={assignment.id} 
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => setLocation(`/teacher/assignment/${assignment.id}`)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{assignment.title}</p>
                      <p className="text-sm text-muted-foreground">
                        Due {format(new Date(assignment.dueDate), "MMM d, yyyy")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{assignment.maxScore} pts</Badge>
                      <Button size="sm" variant="outline">
                        View
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No recent assignments found
              </div>
            )}
          </CardContent>
        </Card>

        {/* Performance Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Performance Overview
            </CardTitle>
            <CardDescription>Your teaching metrics and insights</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm">Average Grade</span>
                </div>
                <span className="font-medium">87%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">Student Engagement</span>
                </div>
                <span className="font-medium">92%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-green-500" />
                  <span className="text-sm">On-time Submissions</span>
                </div>
                <span className="font-medium">85%</span>
              </div>
              <div className="pt-2">
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary w-4/5"></div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Overall performance rating</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">My Courses</h2>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setLocation("/teacher/courses")}
          >
            View All Courses
          </Button>
        </div>
        {coursesLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-56 w-full" />
            ))}
          </div>
        ) : courses && courses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                onClick={() => setLocation(`/teacher/course/${course.id}`)}
                actionButton={
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLocation(`/teacher/course/${course.id}`);
                    }}
                    data-testid={`button-manage-course-${course.id}`}
                  >
                    Manage Course
                  </Button>
                }
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={BookOpen}
            title="No courses yet"
            description="Start by creating your first course to begin teaching"
            action={{
              label: "Create Course",
              onClick: () => setLocation("/teacher/create-course"),
            }}
          />
        )}
      </div>
    </div>
  );
}