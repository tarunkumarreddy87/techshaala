import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertGradeSchema, type InsertGrade } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { EmptyState } from "@/components/empty-state";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowLeft, FileText, Award, Users, Loader2 } from "lucide-react";
import { format } from "date-fns";
import type { Assignment, SubmissionWithDetails } from "@shared/schema";
import { useState } from "react";

export default function TeacherAssignmentSubmissions() {
  const { toast } = useToast();
  const [, params] = useRoute("/teacher/assignment/:id");
  const [, setLocation] = useLocation();
  const assignmentId = params?.id;
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionWithDetails | null>(null);

  const { data: assignment, isLoading: assignmentLoading } = useQuery<Assignment>({
    queryKey: [`/api/assignments/${assignmentId}`],
    enabled: !!assignmentId,
  });

  const { data: submissions, isLoading: submissionsLoading } = useQuery<SubmissionWithDetails[]>({
    queryKey: [`/api/assignments/${assignmentId}/submissions`],
    enabled: !!assignmentId,
  });

  const form = useForm<InsertGrade>({
    resolver: zodResolver(insertGradeSchema),
    defaultValues: {
      score: 0,
      feedback: "",
      submissionId: "",
    },
  });

  const gradeMutation = useMutation({
    mutationFn: async (data: InsertGrade) => {
      return await apiRequest("POST", "/api/grades", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/assignments/${assignmentId}/submissions`] });
      toast({
        title: "Grade submitted!",
        description: "The student can now view their grade and feedback",
      });
      setSelectedSubmission(null);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Grading failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertGrade) => {
    gradeMutation.mutate(data);
  };

  const handleGradeSubmission = (submission: SubmissionWithDetails) => {
    setSelectedSubmission(submission);
    form.reset({
      score: 0,
      feedback: "",
      submissionId: submission.id,
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (assignmentLoading || submissionsLoading) {
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
        <EmptyState
          icon={FileText}
          title="Assignment not found"
          description="The assignment you're looking for doesn't exist"
          action={{
            label: "Back to Dashboard",
            onClick: () => setLocation("/teacher/dashboard"),
          }}
        />
      </div>
    );
  }

  const gradedCount = submissions?.filter(s => s.grade).length || 0;
  const pendingCount = (submissions?.length || 0) - gradedCount;

  return (
    <div className="p-6 space-y-6">
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
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-3xl">{assignment.title}</CardTitle>
              <CardDescription className="mt-2 text-base">
                {assignment.description}
              </CardDescription>
            </div>
            <FileText className="h-8 w-8 text-primary flex-shrink-0" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>{submissions?.length || 0} submissions</span>
            </div>
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-muted-foreground" />
              <span>{assignment.maxScore} points max</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Badge variant="secondary">{gradedCount} graded</Badge>
            <Badge variant="outline">{pendingCount} pending</Badge>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-2xl font-semibold mb-4">Student Submissions</h2>
        {submissions && submissions.length > 0 ? (
          <div className="space-y-4">
            {submissions.map((submission) => (
              <Card key={submission.id} data-testid={`card-submission-${submission.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Avatar>
                        <AvatarFallback>
                          {getInitials(submission.student.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg">{submission.student.name}</CardTitle>
                        <CardDescription>
                          Submitted {format(new Date(submission.submittedAt), "MMM d, yyyy 'at' h:mm a")}
                        </CardDescription>
                      </div>
                    </div>
                    {submission.grade ? (
                      <Badge variant="default" className="bg-chart-2 text-white">
                        Graded: {submission.grade.score}/{assignment.maxScore}
                      </Badge>
                    ) : (
                      <Badge variant="outline">Pending</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-2">Submission</p>
                    <Card className="bg-muted/50">
                      <CardContent className="p-4">
                        <p className="whitespace-pre-wrap font-mono text-sm">{submission.content}</p>
                      </CardContent>
                    </Card>
                  </div>

                  {submission.grade ? (
                    <div>
                      <p className="text-sm font-medium mb-2">Your Feedback</p>
                      <p className="text-muted-foreground">{submission.grade.feedback || "No feedback provided"}</p>
                    </div>
                  ) : (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          className="w-full"
                          onClick={() => handleGradeSubmission(submission)}
                          data-testid={`button-grade-${submission.id}`}
                        >
                          <Award className="h-4 w-4 mr-2" />
                          Grade Submission
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Grade Submission</DialogTitle>
                          <DialogDescription>
                            Provide a score and feedback for {submission.student.name}'s work
                          </DialogDescription>
                        </DialogHeader>
                        <Form {...form}>
                          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                              control={form.control}
                              name="score"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Score (out of {assignment.maxScore})</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      min="0"
                                      max={assignment.maxScore}
                                      data-testid="input-score"
                                      {...field}
                                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="feedback"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Feedback (Optional)</FormLabel>
                                  <FormControl>
                                    <Textarea
                                      placeholder="Provide constructive feedback for the student..."
                                      className="min-h-32"
                                      data-testid="input-feedback"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <Button
                              type="submit"
                              className="w-full"
                              disabled={gradeMutation.isPending}
                              data-testid="button-submit-grade"
                            >
                              {gradeMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                              Submit Grade
                            </Button>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Users}
            title="No submissions yet"
            description="Students haven't submitted their work for this assignment"
          />
        )}
      </div>
    </div>
  );
}
