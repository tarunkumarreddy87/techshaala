import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { EmptyState } from "@/components/empty-state";
import { ArrowLeft, BookOpen, Clock, User, Play, List } from "lucide-react";
import type { CourseWithTeacher } from "@shared/schema";

// Mock data for chapters - in a real implementation, this would come from the backend
const mockChapters = [
  { id: 1, title: "Introduction to the Course", youtubeId: "dQw4w9WgXcQ", duration: "10:30" },
  { id: 2, title: "Chapter 1: Fundamentals", youtubeId: "dQw4w9WgXcQ", duration: "15:45" },
  { id: 3, title: "Chapter 2: Advanced Concepts", youtubeId: "dQw4w9WgXcQ", duration: "22:15" },
  { id: 4, title: "Chapter 3: Practical Applications", youtubeId: "dQw4w9WgXcQ", duration: "18:20" },
  { id: 5, title: "Chapter 4: Case Studies", youtubeId: "dQw4w9WgXcQ", duration: "25:10" },
];

export default function LearningPage() {
  const { user } = useAuth();
  const [, params] = useRoute("/student/learning/:id");
  const [, setLocation] = useLocation();
  const courseId = params?.id;
  const [activeChapter, setActiveChapter] = useState(1);

  const { data: course, isLoading: courseLoading } = useQuery<CourseWithTeacher>({
    queryKey: [`/api/courses/${courseId}`],
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

  const currentChapter = mockChapters.find(chapter => chapter.id === activeChapter) || mockChapters[0];

  if (courseLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
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
          onClick={() => setLocation(`/student/course/${courseId}`)}
          className="mb-4"
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Course
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

      <Tabs defaultValue="learning" className="space-y-6">
        <TabsList>
          <TabsTrigger value="learning" data-testid="tab-learning">
            Learning
          </TabsTrigger>
        </TabsList>

        <TabsContent value="learning" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Video Player Section */}
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Play className="h-5 w-5" />
                    {currentChapter.title}
                  </CardTitle>
                  <CardDescription>
                    Chapter {currentChapter.id} • {currentChapter.duration}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                    <iframe
                      width="100%"
                      height="100%"
                      src={`https://www.youtube.com/embed/${currentChapter.youtubeId}`}
                      title={currentChapter.title}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full"
                    ></iframe>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Chapter List Section */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <List className="h-5 w-5" />
                    Course Chapters
                  </CardTitle>
                  <CardDescription>
                    {mockChapters.length} chapters in total
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {mockChapters.map((chapter) => (
                    <Button
                      key={chapter.id}
                      variant={activeChapter === chapter.id ? "default" : "ghost"}
                      className="w-full justify-between"
                      onClick={() => setActiveChapter(chapter.id)}
                    >
                      <span className="text-left">
                        Chapter {chapter.id}: {chapter.title}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {chapter.duration}
                      </span>
                    </Button>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}