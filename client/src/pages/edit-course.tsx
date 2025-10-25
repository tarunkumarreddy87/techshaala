import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCourseSchema, updateCourseSchema, type InsertCourse, type Chapter } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useRoute, useLocation } from "wouter";
import { Loader2, ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { YouTubeChapters } from "@/components/youtube-chapters";

export default function EditCourse() {
  const { toast } = useToast();
  const [, params] = useRoute("/teacher/course/:id/edit");
  const [, setLocation] = useLocation();
  const courseId = params?.id;
  const [chapters, setChapters] = useState<Chapter[]>([]);

  const { data: course, isLoading: courseLoading } = useQuery<InsertCourse>({
    queryKey: [`/api/courses/${courseId}`],
    enabled: !!courseId,
  });

  const form = useForm<InsertCourse>({
    resolver: zodResolver(updateCourseSchema),
    defaultValues: {
      title: "",
      description: "",
      duration: "",
      youtubeLink: "",
      chapters: "",
    },
  });

  // Set form values when course data is loaded
  useEffect(() => {
    if (course && !form.formState.isDirty) {
      form.reset({
        title: course.title,
        description: course.description,
        duration: course.duration,
        youtubeLink: course.youtubeLink || "",
        chapters: course.chapters || "",
      });
      
      // Parse chapters if they exist
      if (course.chapters) {
        try {
          const parsedChapters = JSON.parse(course.chapters);
          setChapters(parsedChapters);
        } catch (e) {
          console.error("Error parsing chapters:", e);
        }
      }
    }
  }, [course, form, form.formState.isDirty]);

  const updateCourseMutation = useMutation({
    mutationFn: async (data: InsertCourse) => {
      // Add chapters to the data
      const courseData = {
        ...data,
        chapters: chapters.length > 0 ? JSON.stringify(chapters) : ""
      };
      return await apiRequest("PUT", `/api/courses/${courseId}`, courseData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/courses/my-courses"] });
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${courseId}`] });
      toast({
        title: "Course updated!",
        description: "Your course has been updated successfully",
      });
      setLocation(`/teacher/course/${courseId}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update course",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertCourse) => {
    updateCourseMutation.mutate(data);
  };

  if (courseLoading) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation(`/teacher/course/${courseId}`)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Course
          </Button>
        </div>
        <div className="space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse"></div>
          <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation(`/teacher/course/${courseId}`)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Course
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Edit Course</h1>
        <p className="text-muted-foreground mt-1">Update the details of your course</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Course Information</CardTitle>
          <CardDescription>
            Update the details about your course
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
                  initialChapters={chapters}
                  onChange={setChapters} 
                />
              </div>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation(`/teacher/course/${courseId}`)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={updateCourseMutation.isPending}
                >
                  {updateCourseMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Update Course
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}