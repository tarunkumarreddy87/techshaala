import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { CourseCard } from "@/components/course-card";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { CourseWithTeacher, EnrollmentWithCourse } from "@shared/schema";

export default function StudentCourses() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: allCourses, isLoading: allCoursesLoading } = useQuery<CourseWithTeacher[]>({
    queryKey: ["/api/courses"],
  });

  const { data: enrollments, isLoading: enrollmentsLoading } = useQuery<EnrollmentWithCourse[]>({
    queryKey: ["/api/enrollments/my-courses"],
    enabled: !!user?.id,
  });

  const enrollMutation = useMutation({
    mutationFn: async (courseId: string) => {
      return await apiRequest("POST", "/api/enrollments", { courseId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/enrollments/my-courses"] });
      toast({
        title: "Enrolled successfully!",
        description: "You can now access course materials and assignments",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Enrollment failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const enrolledCourseIds = new Set(enrollments?.map(e => e.courseId));
  const availableCourses = allCourses?.filter(c => !enrolledCourseIds.has(c.id));
  const myCourses = enrollments?.map(e => e.course);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Courses</h1>
        <p className="text-muted-foreground mt-1">Browse and enroll in available courses</p>
      </div>

      <Tabs defaultValue="available" className="space-y-6">
        <TabsList>
          <TabsTrigger value="available" data-testid="tab-available">
            Available Courses
          </TabsTrigger>
          <TabsTrigger value="enrolled" data-testid="tab-enrolled">
            My Courses ({myCourses?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="available" className="space-y-4">
          {allCoursesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-56 w-full" />
              ))}
            </div>
          ) : availableCourses && availableCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableCourses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  onClick={() => {}}
                  actionButton={
                    <Button
                      className="w-full"
                      onClick={() => enrollMutation.mutate(course.id)}
                      disabled={enrollMutation.isPending}
                      data-testid={`button-enroll-${course.id}`}
                    >
                      {enrollMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Enroll Now
                    </Button>
                  }
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={BookOpen}
              title="No available courses"
              description="All available courses have been enrolled"
            />
          )}
        </TabsContent>

        <TabsContent value="enrolled" className="space-y-4">
          {enrollmentsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-56 w-full" />
              ))}
            </div>
          ) : myCourses && myCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myCourses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  onClick={() => setLocation(`/student/course/${course.id}`)}
                  actionButton={
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLocation(`/student/course/${course.id}`);
                      }}
                      data-testid={`button-view-course-${course.id}`}
                    >
                      View Course
                    </Button>
                  }
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={BookOpen}
              title="No enrolled courses"
              description="You haven't enrolled in any courses yet. Browse available courses to get started"
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
