import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { CourseCard } from "@/components/course-card";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen } from "lucide-react";
import { useLocation } from "wouter";
import type { CourseWithTeacher } from "@shared/schema";

export default function TeacherCourses() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: courses, isLoading } = useQuery<CourseWithTeacher[]>({
    queryKey: ["/api/courses/my-courses"],
    enabled: !!user?.id,
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Courses</h1>
          <p className="text-muted-foreground mt-1">Manage your courses and create new ones</p>
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

      {isLoading ? (
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
  );
}