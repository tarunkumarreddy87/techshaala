import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AssignmentCard } from "@/components/assignment-card";
import { EmptyState } from "@/components/empty-state";
import { ArrowLeft, BookOpen, Clock, Users, FileText, Plus, Edit, Play } from "lucide-react";
import type { CourseWithTeacher, Assignment, User, Chapter } from "@shared/schema";

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

  const extractYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const parseChapters = (chaptersStr: string | null | undefined): Chapter[] => {
    if (!chaptersStr) return [];
    try {
      return JSON.parse(chaptersStr);
    } catch (e) {
      console.error("Error parsing chapters:", e);
      return [];
    }
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

  const chapters = parseChapters(course.chapters);
  const youtubeId = course.youtubeLink ? extractYouTubeId(course.youtubeLink) : null;

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
          onClick={() => setLocation(`/teacher/course/${courseId}/edit`)}
          variant="outline"
          className="mr-2"
          data-testid="button-edit-course"
        >
          <Edit className="h-4 w-4 mr-2" />
          Edit Course
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
          <div className="flex items-center gap-6 text-sm mb-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{course.duration}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>{students?.length || 0} students enrolled</span>
            </div>
          </div>

          {/* YouTube Video Section */}
          {youtubeId && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">Course Video</h3>
              <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                <iframe
                  width="100%"
                  height="100%"
                  src={`https://www.youtube.com/embed/${youtubeId}`}
                  title="Course Video"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            </div>
          )}

          {/* Chapters Section */}
          {chapters.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">Course Chapters</h3>
              <div className="space-y-2">
                {chapters.map((chapter) => (
                  <div key={chapter.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <Play className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{chapter.title}</p>
                        <p className="text-sm text-muted-foreground">{chapter.duration}</p>
                      </div>
                    </div>
                    {chapter.youtubeId && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`https://www.youtube.com/watch?v=${chapter.youtubeId}`, '_blank')}
                      >
                        Watch
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
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
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => setLocation(`/teacher/assignment/${assignment.id}/edit`)}
                        data-testid={`button-edit-assignment-${assignment.id}`}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => setLocation(`/teacher/assignment/${assignment.id}`)}
                        data-testid={`button-view-submissions-${assignment.id}`}
                      >
                        View Submissions
                      </Button>
                    </div>
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