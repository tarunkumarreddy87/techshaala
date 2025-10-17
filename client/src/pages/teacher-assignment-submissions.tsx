import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertGradeSchema, updateGradeSchema, type InsertGrade, type UpdateGrade } from "@shared/schema";
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
import { ArrowLeft, FileText, Award, Users, Loader2, Edit, CheckCircle, XCircle, Clock } from "lucide-react";
import { format, isBefore } from "date-fns";
import type { Assignment, SubmissionWithDetails } from "@shared/schema";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function TeacherAssignmentSubmissions() {
  const { toast } = useToast();
  const [, params] = useRoute("/teacher/assignment/:id");
  const [, setLocation] = useLocation();
  const assignmentId = params?.id;
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionWithDetails | null>(null);
  const [isEditing, setIsEditing] = useState(false);

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

  const editForm = useForm<UpdateGrade>({
    resolver: zodResolver(updateGradeSchema),
    defaultValues: {
      score: 0,
      feedback: "",
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

  const updateGradeMutation = useMutation({
    mutationFn: async (data: { gradeId: string; updateData: UpdateGrade }) => {
      return await apiRequest("PUT", `/api/grades/${data.gradeId}`, data.updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/assignments/${assignmentId}/submissions`] });
      toast({
        title: "Grade updated!",
        description: "The student's grade has been updated successfully",
      });
      setSelectedSubmission(null);
      setIsEditing(false);
      editForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Grade update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertGrade) => {
    gradeMutation.mutate(data);
  };

  const onUpdateGrade = (data: UpdateGrade) => {
    if (selectedSubmission?.grade?.id) {
      updateGradeMutation.mutate({
        gradeId: selectedSubmission.grade.id,
        updateData: data
      });
    }
  };

  const handleGradeSubmission = (submission: SubmissionWithDetails) => {
    setSelectedSubmission(submission);
    setIsEditing(false);
    form.reset({
      score: 0,
      feedback: "",
      submissionId: submission.id,
    });
  };

  const handleEditGrade = (submission: SubmissionWithDetails) => {
    setSelectedSubmission(submission);
    setIsEditing(true);
    if (submission.grade) {
      editForm.reset({
        score: submission.grade.score,
        feedback: submission.grade.feedback || "",
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

      {/* New Table View for Submissions */}
      <Card>
        <CardHeader>
          <CardTitle>Student Submissions</CardTitle>
          <CardDescription>
            View all student submissions with submission status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {submissions && submissions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">S.No</TableHead>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Course Name</TableHead>
                  <TableHead>Submitted On</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((submission, index) => {
                  const isOnTime = submission.submittedAt && assignment.dueDate && 
                    isBefore(new Date(submission.submittedAt), new Date(assignment.dueDate.toString()));
                  
                  return (
                    <TableRow key={submission.id}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {getInitials(submission.student.name)}
                            </AvatarFallback>
                          </Avatar>
                          <span>{submission.student.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{submission.assignment?.title || "N/A"}</TableCell>
                      <TableCell>
                        {submission.submittedAt ? 
                          format(new Date(submission.submittedAt), "MMM d, yyyy 'at' h:mm a") : 
                          "Not submitted"}
                      </TableCell>
                      <TableCell>
                        {submission.submittedAt ? (
                          isOnTime ? (
                            <div className="flex items-center gap-1 text-green-600">
                              <CheckCircle className="h-4 w-4" />
                              <span>On Time</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-red-600">
                              <XCircle className="h-4 w-4" />
                              <span>Late</span>
                            </div>
                          )
                        ) : (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>Pending</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {submission.grade ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditGrade(submission)}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit Grade
                            </Button>
                          ) : (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  onClick={() => handleGradeSubmission(submission)}
                                >
                                  <Award className="h-4 w-4 mr-1" />
                                  Grade
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

                                    <input type="hidden" {...form.register("submissionId")} value={submission.id} />

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
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <EmptyState
              icon={Users}
              title="No submissions yet"
              description="Students haven't submitted their work for this assignment"
            />
          )}
        </CardContent>
      </Card>

      {/* Edit Grade Dialog */}
      <Dialog open={isEditing && selectedSubmission !== null} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Grade</DialogTitle>
            <DialogDescription>
              Update the score and feedback for {selectedSubmission?.student.name}'s work
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onUpdateGrade)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="score"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Score (out of {assignment?.maxScore})</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        max={assignment?.maxScore}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="feedback"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Feedback (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Provide constructive feedback for the student..."
                        className="min-h-32"
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
                disabled={updateGradeMutation.isPending}
              >
                {updateGradeMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Grade
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}