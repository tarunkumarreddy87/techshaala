import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { BookOpen, MessageCircle } from "lucide-react";
import type { CourseWithTeacher, EnrollmentWithCourse } from "@shared/schema";

export default function CourseChatSelection() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // For students, fetch their enrolled courses
  const { data: enrollments, isLoading: enrollmentsLoading } = useQuery<EnrollmentWithCourse[]>({
    queryKey: ["/api/enrollments/my-courses"],
    enabled: user?.role === "student" && !!user.id,
  });

  // For teachers, fetch courses they teach
  const { data: taughtCourses, isLoading: taughtCoursesLoading } = useQuery<CourseWithTeacher[]>({
    queryKey: ["/api/courses/my-courses"],
    enabled: user?.role === "teacher" && !!user.id,
  });

  const courses = user?.role === "student" 
    ? enrollments?.map(e => e.course) 
    : taughtCourses;

  const isLoading = user?.role === "student" ? enrollmentsLoading : taughtCoursesLoading;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Course Chat</h1>
          <p className="text-muted-foreground mt-1">Select a course to chat with your classmates and instructor</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Course Chat</h1>
        <p className="text-muted-foreground mt-1">Select a course to chat with your classmates and instructor</p>
      </div>

      {courses && courses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course) => (
            <Card 
              key={course.id} 
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setLocation(`/${user?.role}/course-chat/${course.id}`)}
            >
              <CardHeader>
                <CardTitle className="flex items-start justify-between gap-4">
                  <span className="text-lg">{course.title}</span>
                  <BookOpen className="h-5 w-5 text-primary flex-shrink-0" />
                </CardTitle>
                <CardDescription>
                  {course.description?.substring(0, 100)}...
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-medium">
                      {getInitials(course.teacher.name)}
                    </div>
                    <span className="text-sm">{course.teacher.name}</span>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={(e) => {
                      e.stopPropagation();
                      setLocation(`/${user?.role}/course-chat/${course.id}`);
                    }}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Chat
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={MessageCircle}
          title="No courses available"
          description={
            user?.role === "student"
              ? "You haven't enrolled in any courses yet. Browse available courses to get started."
              : "You haven't created or been assigned to any courses yet."
          }
          action={
            user?.role === "student"
              ? {
                  label: "Browse Courses",
                  onClick: () => setLocation("/student/courses"),
                }
              : {
                  label: "Create Course",
                  onClick: () => setLocation("/teacher/create-course"),
                }
          }
        />
      )}
    </div>
  );
}