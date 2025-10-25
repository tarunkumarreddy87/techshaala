import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AssignmentCard } from "@/components/assignment-card";
import { EmptyState } from "@/components/empty-state";
import { ArrowLeft, BookOpen, Clock, Users, FileText, Plus, Edit, Play, Upload, Download, BarChart3, MessageCircle, TrendingUp, Award } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import type { CourseWithTeacher, Assignment, AssignmentWithCourse, User, Chapter, SyllabusItem } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/stat-card";

export default function TeacherCourseDetail() {
  const { user } = useAuth();
  const [, params] = useRoute("/teacher/course/:id");
  const [, setLocation] = useLocation();
  const courseId = params?.id;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadDescription, setUploadDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { data: course, isLoading: courseLoading } = useQuery<CourseWithTeacher>({
    queryKey: [`/api/courses/${courseId}`],
    enabled: !!courseId,
  });

  const { data: assignments, isLoading: assignmentsLoading } = useQuery<AssignmentWithCourse[]>({
    queryKey: [`/api/courses/${courseId}/assignments-with-course`],
    enabled: !!courseId,
  });

  const { data: students, isLoading: studentsLoading } = useQuery<User[]>({
    queryKey: [`/api/courses/${courseId}/students`],
    enabled: !!courseId,
  });

  const { data: syllabusItems, isLoading: syllabusLoading } = useQuery<SyllabusItem[]>({
    queryKey: [`/api/courses/${courseId}/syllabus`],
    enabled: !!courseId,
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Validate file type (only allow PDF)
      if (file.type !== 'application/pdf') {
        toast({
          title: "Invalid file type",
          description: "Only PDF files are allowed",
          variant: "destructive",
        });
        e.target.value = ''; // Clear the input
        return;
      }
      
      // Validate file size (50MB limit)
      if (file.size > 50 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "File size must be less than 50MB",
          variant: "destructive",
        });
        e.target.value = ''; // Clear the input
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const handleUploadSyllabus = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!uploadTitle || !uploadDescription) {
      toast({
        title: "Missing information",
        description: "Please provide a title and description",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const formData = new FormData();
      formData.append('title', uploadTitle);
      formData.append('description', uploadDescription);
      if (selectedFile) {
        formData.append('file', selectedFile);
      }
      
      const response = await fetch(`/api/courses/${courseId}/syllabus`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload syllabus');
      }
      
      // Reset form
      setUploadTitle("");
      setUploadDescription("");
      setSelectedFile(null);
      setIsUploadDialogOpen(false);
      
      // Refresh syllabus data
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${courseId}/syllabus`] });
      
      toast({
        title: "Syllabus uploaded",
        description: "Your syllabus item has been successfully uploaded",
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload syllabus item",
        variant: "destructive",
      });
    }
  };

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
  const studentCount = students?.length || 0;
  const assignmentCount = assignments?.length || 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{course.title}</h1>
          <p className="text-muted-foreground mt-1">{course.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setLocation("/teacher/courses")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Courses
          </Button>
          <Button onClick={() => setLocation(`/teacher/course/${courseId}/edit`)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Course
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Students"
          value={studentCount.toString()}
          icon={Users}
        />
        <StatCard
          title="Assignments"
          value={assignmentCount.toString()}
          icon={FileText}
        />
        <StatCard
          title="Course Duration"
          value={course.duration}
          icon={Clock}
        />
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview" data-testid="tab-overview">
            Overview
          </TabsTrigger>
          <TabsTrigger value="assignments" data-testid="tab-assignments">
            Assignments
          </TabsTrigger>
          <TabsTrigger value="students" data-testid="tab-students">
            Students
          </TabsTrigger>
          <TabsTrigger value="syllabus" data-testid="tab-syllabus">
            Syllabus
          </TabsTrigger>
          <TabsTrigger value="analytics" data-testid="tab-analytics">
            Analytics
          </TabsTrigger>
          <TabsTrigger value="discussion" className="flex items-center gap-2" data-testid="tab-discussion">
            <MessageCircle className="h-4 w-4" />
            Discussion
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Course Details */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Course Details
                </CardTitle>
                <CardDescription>
                  Information about this course
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Duration: {course.duration}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Students enrolled: {studentCount}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs">
                      {getInitials(course.teacher.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">Instructor: {course.teacher.name}</span>
                </div>
              </CardContent>
            </Card>

            {/* Course Video */}
            {course.youtubeLink && (
              <Card>
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
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Assignments</h2>
              <p className="text-muted-foreground">
                Manage assignments for this course
              </p>
            </div>
            <Button onClick={() => setLocation(`/teacher/course/${courseId}/create-assignment`)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Assignment
            </Button>
          </div>

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
                      onClick={() => setLocation(`/teacher/assignment/${assignment.id}`)}
                      className="w-full"
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
              title="No assignments"
              description="No assignments have been created for this course yet"
              action={{
                label: "Create Assignment",
                onClick: () => setLocation(`/teacher/course/${courseId}/create-assignment`),
              }}
            />
          )}
        </TabsContent>

        <TabsContent value="students" className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold">Enrolled Students</h2>
            <p className="text-muted-foreground">
              {studentCount} student{studentCount !== 1 ? 's' : ''} enrolled in this course
            </p>
          </div>

          {studentsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : students && students.length > 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {students.map((student) => (
                    <div key={student.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <Avatar>
                          <AvatarFallback>{getInitials(student.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{student.name}</p>
                          <p className="text-sm text-muted-foreground">{student.email}</p>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setLocation(`/teacher/course-chat/${courseId}`)}
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Course Chat
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <EmptyState
              icon={Users}
              title="No students enrolled"
              description="No students have enrolled in this course yet"
            />
          )}
        </TabsContent>

        <TabsContent value="syllabus" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Syllabus</h2>
              <p className="text-muted-foreground">
                Upload and manage course syllabus items
              </p>
            </div>
            <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Syllabus
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload Syllabus Item</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleUploadSyllabus} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={uploadTitle}
                      onChange={(e) => setUploadTitle(e.target.value)}
                      placeholder="Enter syllabus item title"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={uploadDescription}
                      onChange={(e) => setUploadDescription(e.target.value)}
                      placeholder="Enter syllabus item description"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="file">File (PDF, optional)</Label>
                    <Input
                      id="file"
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsUploadDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">Upload</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

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
              action={{
                label: "Upload Syllabus",
                onClick: () => setIsUploadDialogOpen(true),
              }}
            />
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold">Course Analytics</h2>
            <p className="text-muted-foreground">
              View statistics and performance metrics for this course
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Student Performance
                </CardTitle>
                <CardDescription>
                  Average grades and completion rates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Detailed analytics coming soon
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Top Performers
                </CardTitle>
                <CardDescription>
                  Students with highest grades
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Award className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Leaderboard coming soon
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="discussion" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Course Discussion
              </CardTitle>
              <CardDescription>
                Chat with your students about this course
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Course Chat</h3>
                <p className="text-muted-foreground mb-4">
                  Join the conversation with your students in the course chat
                </p>
                <Button onClick={() => setLocation(`/teacher/course-chat/${courseId}`)}>
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