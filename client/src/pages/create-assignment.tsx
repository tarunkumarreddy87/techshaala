import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertAssignmentSchema, type InsertAssignment } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useRoute, useLocation } from "wouter";
import { Loader2, ArrowLeft } from "lucide-react";

export default function CreateAssignment() {
  const { toast } = useToast();
  const [, params] = useRoute("/teacher/course/:courseId/create-assignment");
  const [, setLocation] = useLocation();
  const courseId = params?.courseId;

  const form = useForm<InsertAssignment>({
    resolver: zodResolver(insertAssignmentSchema),
    defaultValues: {
      title: "",
      description: "",
      dueDate: "",
      maxScore: 100,
      courseId: courseId || "",
    },
  });

  const createAssignmentMutation = useMutation({
    mutationFn: async (data: InsertAssignment) => {
      return await apiRequest("POST", "/api/assignments", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/courses/${courseId}/assignments`] });
      toast({
        title: "Assignment created!",
        description: "Students can now submit their work",
      });
      setLocation(`/teacher/course/${courseId}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create assignment",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertAssignment) => {
    createAssignmentMutation.mutate({ ...data, courseId: courseId || "" });
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation(`/teacher/course/${courseId}`)}
          className="mb-4"
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Course
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Create Assignment</h1>
        <p className="text-muted-foreground mt-1">Create a new assignment for your students</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assignment Details</CardTitle>
          <CardDescription>
            Provide the details for the assignment
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
                    <FormLabel>Assignment Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Week 1: HTML Basics"
                        data-testid="input-title"
                        {...field}
                      />
                    </FormControl>
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
                        placeholder="Create a simple HTML page with proper structure..."
                        className="min-h-32"
                        data-testid="input-description"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Describe what students need to do
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Due Date</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          data-testid="input-due-date"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="maxScore"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maximum Score</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          data-testid="input-max-score"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation(`/teacher/course/${courseId}`)}
                  className="flex-1"
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={createAssignmentMutation.isPending}
                  data-testid="button-submit"
                >
                  {createAssignmentMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Assignment
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
