import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertSubmissionSchema, type InsertSubmission } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth-context";
import { ArrowLeft, FileText, Calendar, Award, Loader2, CheckCircle, Upload, File } from "lucide-react";
import { format } from "date-fns";
import type { AssignmentWithCourse, SubmissionWithDetails } from "@shared/schema";

export default function SubmitAssignment() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, params] = useRoute("/student/assignment/:id");
  const [, setLocation] = useLocation();
  const assignmentId = params?.id;

  const { data: assignment, isLoading } = useQuery<AssignmentWithCourse & {
    submission?: SubmissionWithDetails;
  }>({
    queryKey: [`/api/assignments/${assignmentId}`],
    enabled: !!assignmentId && !!user?.id,
  });

  const form = useForm<InsertSubmission>({
    resolver: zodResolver(insertSubmissionSchema),
    defaultValues: {
      content: "",
      assignmentId: assignmentId || "",
      studentId: user?.id || "",
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (data: Omit<InsertSubmission, 'studentId'>) => {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('content', data.content);
      formData.append('assignmentId', assignmentId || '');
      formData.append('studentId', user?.id || '');
      
      // If there's a file, append it
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput?.files?.[0]) {
        formData.append('file', fileInput.files[0]);
      }

      return await apiRequest("POST", "/api/submissions", formData, {
        // Remove Content-Type header to let browser set it automatically with boundary
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/assignments/${assignmentId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/assignments/my-assignments"] });
      toast({
        title: "Assignment submitted!",
        description: "Your teacher will review and grade your submission",
      });
      setLocation("/student/dashboard");
    },
    onError: (error: Error) => {
      toast({
        title: "Submission failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertSubmission) => {
    submitMutation.mutate({
      content: data.content,
      assignmentId: assignmentId || "",
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
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
    }
  };

  const handleDownloadFile = async (submissionId: string) => {
    try {
      const response = await fetch(`/api/submissions/${submissionId}/file`);
      if (!response.ok) {
        throw new Error('Failed to download file');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = assignment?.submission?.fileName || 'submission.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Failed to download the submitted file",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-2xl font-semibold">Assignment not found</h2>
          <Button
            onClick={() => setLocation("/student/dashboard")}
            className="mt-4"
            data-testid="button-back-to-dashboard"
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const hasSubmission = !!assignment.submission;
  const hasGrade = !!assignment.submission?.grade;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation(`/student/course/${assignment.courseId}`)}
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
              <CardTitle className="text-3xl flex items-center gap-2">
                <FileText className="h-8 w-8 text-primary" />
                {assignment.title}
              </CardTitle>
              <CardDescription className="mt-2 text-base">
                {assignment.course.title}
              </CardDescription>
            </div>
            {hasGrade ? (
              <Badge variant="default" className="bg-chart-2 text-white">
                Graded
              </Badge>
            ) : hasSubmission ? (
              <Badge variant="secondary">Submitted</Badge>
            ) : (
              <Badge variant="outline">Not Submitted</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="text-muted-foreground">{assignment.description}</p>
          </div>

          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Due: {format(new Date(assignment.dueDate), "MMM d, yyyy 'at' h:mm a")}</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-muted-foreground" />
              <span>Worth {assignment.maxScore} points</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {hasGrade ? (
        <Card className="border-chart-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-chart-2" />
              Grade & Feedback
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Your Score</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-chart-2">
                  {assignment.submission?.grade?.score}
                </span>
                <span className="text-2xl text-muted-foreground">/ {assignment.maxScore}</span>
                <Badge variant="default" className="ml-2 bg-chart-2 text-white">
                  {Math.round((assignment.submission?.grade?.score || 0) / assignment.maxScore * 100)}%
                </Badge>
              </div>
            </div>

            {assignment.submission?.grade?.feedback && (
              <div>
                <p className="text-sm font-medium mb-2">Teacher Feedback</p>
                <p className="text-muted-foreground">{assignment.submission.grade.feedback}</p>
              </div>
            )}

            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-1">Your Submission</p>
              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <p className="whitespace-pre-wrap">{assignment.submission?.content}</p>
                  {assignment.submission?.fileName && (
                    <div className="mt-4 flex items-center gap-2">
                      <File className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{assignment.submission.fileName}</span>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleDownloadFile(assignment.submission!.id)}
                      >
                        Download
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      ) : hasSubmission ? (
        <Card>
          <CardHeader>
            <CardTitle>Your Submission</CardTitle>
            <CardDescription>
              Submitted on {assignment.submission?.submittedAt ? format(new Date(assignment.submission.submittedAt), "MMM d, yyyy 'at' h:mm a") : "Unknown date"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <p className="whitespace-pre-wrap">{assignment.submission?.content}</p>
                {assignment.submission?.fileName && (
                  <div className="mt-4 flex items-center gap-2">
                    <File className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{assignment.submission.fileName}</span>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleDownloadFile(assignment.submission!.id)}
                    >
                      Download
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
            <p className="text-sm text-muted-foreground mt-4">
              Your submission is pending grading by your teacher
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Submit Your Work</CardTitle>
            <CardDescription>
              Provide your answer or solution below and optionally upload a PDF file
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your Submission</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter your answer, code, or written response here..."
                          className="min-h-64 font-mono"
                          data-testid="input-content"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                  <FormLabel>Upload PDF File (Optional)</FormLabel>
                  <div className="flex items-center gap-2">
                    <input
                      id="file-upload"
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('file-upload')?.click()}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Choose PDF File
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      {(() => {
                        const fileInput = document.getElementById('file-upload') as HTMLInputElement;
                        const file = fileInput?.files?.[0];
                        return file ? file.name : 'No file chosen';
                      })()}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Only PDF files up to 50MB are allowed
                  </p>
                </div>

                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setLocation(`/student/course/${assignment.courseId}`)}
                    className="flex-1"
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={submitMutation.isPending}
                    data-testid="button-submit"
                  >
                    {submitMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Submit Assignment
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}