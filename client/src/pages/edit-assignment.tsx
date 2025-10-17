import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertAssignmentSchema, updateAssignmentSchema, type InsertAssignment } from "@shared/schema";
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
import { useEffect } from "react";

export default function EditAssignment() {
  const { toast } = useToast();
  const [, params] = useRoute("/teacher/assignment/:id/edit");
  const [, setLocation] = useLocation();
  const assignmentId = params?.id;

  const { data: assignment, isLoading: assignmentLoading } = useQuery<InsertAssignment>({
    queryKey: [`/api/assignments/${assignmentId}`],
    enabled: !!assignmentId,
  });

  const form = useForm<InsertAssignment>({
    resolver: zodResolver(updateAssignmentSchema),
    defaultValues: {
      title: "",
      description: "",
      dueDate: "",
      maxScore: 100,
    },
  });

  // Set form values when assignment data is loaded
  useEffect(() => {
    if (assignment && !form.formState.isDirty) {
      form.reset({
        title: assignment.title,
        description: assignment.description,
        dueDate: assignment.dueDate instanceof Date ? assignment.dueDate.toISOString().slice(0, 16) : assignment.dueDate,
        maxScore: assignment.maxScore,
      });
    }
  }, [assignment, form, form.formState.isDirty]);

  const updateAssignmentMutation = useMutation({
    mutationFn: async (data: InsertAssignment) => {
      return await apiRequest("PUT", `/api/assignments/${assignmentId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/assignments/${assignmentId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/assignments/${assignmentId}/submissions`] });
      toast({
        title: "Assignment updated!",
        description: "Your assignment has been updated successfully",
      });
      setLocation(`/teacher/assignment/${assignmentId}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update assignment",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertAssignment) => {
    updateAssignmentMutation.mutate(data);
  };

  if (assignmentLoading) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation(`/teacher/assignment/${assignmentId}`)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Assignment
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
          onClick={() => setLocation(`/teacher/assignment/${assignmentId}`)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Assignment
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Edit Assignment</h1>
        <p className="text-muted-foreground mt-1">Update the details of your assignment</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assignment Details</CardTitle>
          <CardDescription>
            Update the details for the assignment
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
                          {...field}
                          value={field.value instanceof Date ? field.value.toISOString().slice(0, 16) : field.value || ''}
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
                  onClick={() => setLocation(`/teacher/assignment/${assignmentId}`)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={updateAssignmentMutation.isPending}
                >
                  {updateAssignmentMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Update Assignment
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}