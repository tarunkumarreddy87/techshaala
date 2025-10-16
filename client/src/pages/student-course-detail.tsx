import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AssignmentCard } from "@/components/assignment-card";
import { EmptyState } from "@/components/empty-state";
import { ArrowLeft, BookOpen, Clock, User, FileText } from "lucide-react";
import type { CourseWithTeacher, Assignment, SubmissionWithDetails } from "@shared/schema";

export default function StudentCourseDetail() {
  const { user } = useAuth();
  const [, params] = useRoute("/student/course/:id");
  const [, setLocation] = useLocation();
  const courseId = params?.id;

  const { data: course, isLoading: courseLoading } = useQuery<CourseWithTeacher>({
    queryKey: [`/api/courses/${courseId}`],
    enabled: !!courseId,
  });

  const { data: assignments, isLoading: assignmentsLoading } = useQuery<Assignment[]>({
    queryKey: [`/api/courses/${courseId}/assignments`],
    enabled: !!courseId,
  });

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (courseLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="p-6">
        <EmptyState
          icon={BookOpen}
          title="Course not found"
          description="The course you're looking for doesn't exist"
          action={{
            label: "Back to Courses",
            onClick: () => setLocation("/student/courses"),
          }}
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation("/student/courses")}
          className="mb-4"
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Courses
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-3xl">{course.title}</CardTitle>
              <CardDescription className="mt-3 text-base">
                {course.description}
              </CardDescription>
            </div>
            <BookOpen className="h-8 w-8 text-primary flex-shrink-0" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{course.duration}</span>
            </div>
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-xs">
                  {getInitials(course.teacher.name)}
                </AvatarFallback>
              </Avatar>
              <span>{course.teacher.name}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="assignments" className="space-y-6">
        <TabsList>
          <TabsTrigger value="assignments" data-testid="tab-assignments">
            Assignments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="assignments" className="space-y-4">
          <h2 className="text-2xl font-semibold">Course Assignments</h2>
          {assignmentsLoading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-48 w-full" />
              ))}
            </div>
          ) : assignments && assignments.length > 0 ? (
            <div className="space-y-4">
              {assignments.map((assignment) => (
                <AssignmentCard
                  key={assignment.id}
                  assignment={assignment}
                  submission={assignment.submission}
                  actionButton={
                    !assignment.submission ? (
                      <Button
                        className="w-full"
                        onClick={() => setLocation(`/student/assignment/${assignment.id}`)}
                        data-testid={`button-submit-assignment-${assignment.id}`}
                      >
                        Submit Assignment
                      </Button>
                    ) : assignment.submission.grade ? (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => setLocation(`/student/assignment/${assignment.id}`)}
                        data-testid={`button-view-grade-${assignment.id}`}
                      >
                        View Grade & Feedback
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        className="w-full"
                        disabled
                        data-testid={`button-pending-${assignment.id}`}
                      >
                        Pending Grading
                      </Button>
                    )
                  }
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={FileText}
              title="No assignments yet"
              description="Your teacher hasn't created any assignments for this course"
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
