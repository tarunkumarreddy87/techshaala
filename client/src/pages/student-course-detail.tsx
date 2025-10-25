import { useState } from "react";
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
import { ArrowLeft, BookOpen, Clock, Users, FileText, Play, Download, MessageCircle } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { CourseWithTeacher, AssignmentWithCourse, SubmissionWithDetails, Chapter, SyllabusItem, User } from "@shared/schema";

export default function StudentCourseDetail() {
  const { user } = useAuth();
  const [, params] = useRoute("/student/course/:id");
  const [, setLocation] = useLocation();
  const courseId = params?.id;

  const { data: course, isLoading: courseLoading } = useQuery<CourseWithTeacher>({
    queryKey: [`/api/courses/${courseId}`],
    enabled: !!courseId,
  });

  const { data: assignments, isLoading: assignmentsLoading } = useQuery<(AssignmentWithCourse & {
    submission?: SubmissionWithDetails;
  })[]>({
    queryKey: [`/api/courses/${courseId}/assignments-with-submissions`],
    enabled: !!courseId,
  });

  const { data: syllabusItems, isLoading: syllabusLoading } = useQuery<SyllabusItem[]>({
    queryKey: [`/api/courses/${courseId}/syllabus`],
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
            label: "Back to Courses",
            onClick: () => setLocation("/student/courses"),
          }}
        />
      </div>
    );
  }

  const chapters = parseChapters(course.chapters);
  const youtubeId = course.youtubeLink ? extractYouTubeId(course.youtubeLink) : null;

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
          <div className="flex flex-wrap items-center gap-6 text-sm">
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
              {user && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="ml-2" 
                  onClick={() => setLocation(`/student/course-chat/${courseId}`)}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Course Chat
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview" data-testid="tab-overview">
            Overview
          </TabsTrigger>
          <TabsTrigger value="assignments" data-testid="tab-assignments">
            Assignments
          </TabsTrigger>
          <TabsTrigger value="syllabus" data-testid="tab-syllabus">
            Syllabus
          </TabsTrigger>
          <TabsTrigger value="discussion" className="flex items-center gap-2" data-testid="tab-discussion">
            <MessageCircle className="h-4 w-4" />
            Discussion
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Course Video */}
            {course.youtubeLink && (
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Play className="h-5 w-5" />
                    Course Introduction
                  </CardTitle>
                  <CardDescription>
                    Watch the introductory video for this course
                  </CardDescription>
                </CardHeader>
                <CardContent>
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
                </CardContent>
              </Card>
            )}

            {/* Chapters List */}
            <Card>
              <CardHeader>
                <CardTitle>Course Chapters</CardTitle>
                <CardDescription>
                  {chapters.length} chapters in this course
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {chapters.length > 0 ? (
                  chapters.map((chapter) => (
                    <div key={chapter.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <div className="font-medium">{chapter.title}</div>
                        <div className="text-sm text-muted-foreground">{chapter.duration}</div>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setLocation(`/student/learning/${courseId}`)}
                      >
                        View
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    No chapters available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="assignments" className="space-y-6">
          {assignmentsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          ) : assignments && assignments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {assignments.map((assignment) => (
                <AssignmentCard 
                  key={assignment.id} 
                  assignment={assignment} 
                  actionButton={
                    <Button 
                      variant="default" 
                      size="sm" 
                      onClick={() => setLocation(`/student/assignment/${assignment.id}`)}
                      className="w-full"
                    >
                      View Assignment
                    </Button>
                  }
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={FileText}
              title="No assignments"
              description="No assignments have been created for this course yet"
            />
          )}
        </TabsContent>

        <TabsContent value="syllabus" className="space-y-6">
          {syllabusLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : syllabusItems && syllabusItems.length > 0 ? (
            <div className="space-y-4">
              {syllabusItems.map((item) => (
                <Card key={item.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{item.title}</span>
                      {item.filePath && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => window.open(`/api/syllabus/${item.id}/file`, '_blank')}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      )}
                    </CardTitle>
                    <CardDescription>{item.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground">
                      Uploaded on {new Date(item.createdAt).toLocaleDateString()}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={FileText}
              title="No syllabus items"
              description="No syllabus items have been uploaded for this course yet"
            />
          )}
        </TabsContent>

        <TabsContent value="discussion" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Course Discussion
              </CardTitle>
              <CardDescription>
                Chat with your teacher and fellow students about this course
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Course Chat</h3>
                <p className="text-muted-foreground mb-4">
                  Join the conversation with your teacher and classmates in the course chat
                </p>
                <Button onClick={() => setLocation(`/student/course-chat/${courseId}`)}>
                  Go to Course Chat
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}