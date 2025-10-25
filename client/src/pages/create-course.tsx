import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCourseSchema, type InsertCourse, type Chapter } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth-context";
import { useLocation } from "wouter";
import { Loader2, ArrowLeft } from "lucide-react";
import { YouTubeChapters } from "@/components/youtube-chapters";
import { useState } from "react";

export default function CreateCourse() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [chapters, setChapters] = useState<Chapter[]>([]);

  const form = useForm<InsertCourse>({
    resolver: zodResolver(insertCourseSchema),
    defaultValues: {
      title: "",
      description: "",
      duration: "",
      teacherId: user?.id || "",
      youtubeLink: "",
      chapters: "",
    },
  });

  const createCourseMutation = useMutation({
    mutationFn: async (data: InsertCourse) => {
      // Add chapters to the data
      const courseData = {
        ...data,
        chapters: chapters.length > 0 ? JSON.stringify(chapters) : ""
      };
      return await apiRequest("POST", "/api/courses", courseData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/courses/my-courses"] });
      toast({
        title: "Course created!",
        description: "Your course has been created successfully",
      });
      setLocation("/teacher/dashboard");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create course",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: Omit<InsertCourse, 'teacherId'>) => {
    createCourseMutation.mutate(data as InsertCourse);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation("/teacher/dashboard")}
          className="mb-4"
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Create New Course</h1>
        <p className="text-muted-foreground mt-1">Fill in the details to create a new course</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Course Information</CardTitle>
          <CardDescription>
            Provide the basic details about your course
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Introduction to Web Development"
                        data-testid="input-title"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Choose a clear and descriptive title for your course
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="This course covers the fundamentals of web development including HTML, CSS, and JavaScript..."
                        className="min-h-32"
                        data-testid="input-description"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Describe what students will learn in this course
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="8 weeks"
                        data-testid="input-duration"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Specify the expected duration (e.g., "8 weeks", "3 months")
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="youtubeLink"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>YouTube Link (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://www.youtube.com/watch?v=..."
                        data-testid="input-youtube-link"
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormDescription>
                      Add a YouTube video link for your course content
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <YouTubeChapters 
                  onChange={setChapters} 
                />
              </div>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation("/teacher/dashboard")}
                  className="flex-1"
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={createCourseMutation.isPending}
                  data-testid="button-submit"
                >
                  {createCourseMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Course
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}