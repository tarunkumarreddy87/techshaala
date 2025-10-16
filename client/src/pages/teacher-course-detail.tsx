import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AssignmentCard } from "@/components/assignment-card";
import { EmptyState } from "@/components/empty-state";
import { ArrowLeft, BookOpen, Clock, Users, FileText, Plus } from "lucide-react";
import type { CourseWithTeacher, Assignment, User } from "@shared/schema";

export default function TeacherCourseDetail() {
  const [, params] = useRoute("/teacher/course/:id");
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

  const { data: students, isLoading: studentsLoading } = useQuery<User[]>({
    queryKey: [`/api/courses/${courseId}/students`],
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
            label: "Back to Dashboard",
            onClick: () => setLocation("/teacher/dashboard"),
          }}
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation("/teacher/dashboard")}
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <Button
          onClick={() => setLocation(`/teacher/course/${courseId}/create-assignment`)}
          data-testid="button-create-assignment"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Assignment
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
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>{students?.length || 0} students enrolled</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="assignments" className="space-y-6">
        <TabsList>
          <TabsTrigger value="assignments" data-testid="tab-assignments">
            Assignments ({assignments?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="students" data-testid="tab-students">
            Students ({students?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="assignments" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Course Assignments</h2>
            <Button
              onClick={() => setLocation(`/teacher/course/${courseId}/create-assignment`)}
              data-testid="button-create-assignment-inline"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Assignment
            </Button>
          </div>
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
                  assignment={{ ...assignment, course }}
                  actionButton={
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setLocation(`/teacher/assignment/${assignment.id}`)}
                      data-testid={`button-view-submissions-${assignment.id}`}
                    >
                      View Submissions
                    </Button>
                  }
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={FileText}
              title="No assignments yet"
              description="Create your first assignment to start evaluating student work"
              action={{
                label: "Create Assignment",
                onClick: () => setLocation(`/teacher/course/${courseId}/create-assignment`),
              }}
            />
          )}
        </TabsContent>

        <TabsContent value="students" className="space-y-4">
          <h2 className="text-2xl font-semibold">Enrolled Students</h2>
          {studentsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : students && students.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {students.map((student) => (
                <Card key={student.id} data-testid={`card-student-${student.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {getInitials(student.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{student.name}</p>
                        <p className="text-sm text-muted-foreground truncate">{student.email}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Users}
              title="No students enrolled"
              description="Students will appear here once they enroll in your course"
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
