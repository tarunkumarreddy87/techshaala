import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { Award, TrendingUp, FileText } from "lucide-react";
import { format } from "date-fns";
import type { AssignmentWithCourse, SubmissionWithDetails } from "@shared/schema";

export default function StudentGrades() {
  const { user } = useAuth();
  const { data: assignments, isLoading } = useQuery<(AssignmentWithCourse & {
    submission?: SubmissionWithDetails;
  })[]>({
    queryKey: ["/api/assignments/my-assignments"],
    enabled: !!user?.id,
  });

  const gradedAssignments = assignments?.filter(a => a.submission?.grade) || [];
  const totalPoints = gradedAssignments.reduce((sum, a) => sum + (a.submission?.grade?.score || 0), 0);
  const maxPoints = gradedAssignments.reduce((sum, a) => sum + a.maxScore, 0);
  const averagePercentage = maxPoints > 0 ? Math.round((totalPoints / maxPoints) * 100) : 0;

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return "bg-chart-2 text-white";
    if (percentage >= 80) return "bg-chart-3 text-white";
    if (percentage >= 70) return "bg-chart-1 text-white";
    return "bg-destructive text-white";
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Grades</h1>
        <p className="text-muted-foreground mt-1">View your performance across all courses</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : gradedAssignments.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Average Grade</p>
                    <div className="flex items-baseline gap-2 mt-2">
                      <h3 className="text-4xl font-bold">{averagePercentage}%</h3>
                    </div>
                  </div>
                  <div className="rounded-full bg-primary/10 p-3">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Points</p>
                    <div className="flex items-baseline gap-2 mt-2">
                      <h3 className="text-4xl font-bold">{totalPoints}</h3>
                      <span className="text-xl text-muted-foreground">/ {maxPoints}</span>
                    </div>
                  </div>
                  <div className="rounded-full bg-primary/10 p-3">
                    <Award className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Graded Assignments</p>
                    <div className="flex items-baseline gap-2 mt-2">
                      <h3 className="text-4xl font-bold">{gradedAssignments.length}</h3>
                    </div>
                  </div>
                  <div className="rounded-full bg-primary/10 p-3">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-4">Graded Assignments</h2>
            <div className="space-y-4">
              {gradedAssignments.map((assignment) => {
                const score = assignment.submission?.grade?.score || 0;
                const percentage = Math.round((score / assignment.maxScore) * 100);
                
                return (
                  <Card key={assignment.id} data-testid={`card-grade-${assignment.id}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-xl">{assignment.title}</CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            {assignment.course.title}
                          </p>
                        </div>
                        <Badge className={getGradeColor(percentage)}>
                          {score}/{assignment.maxScore} ({percentage}%)
                        </Badge>
                      </div>
                    </CardHeader>
                    {assignment.submission?.grade?.feedback && (
                      <CardContent>
                        <div>
                          <p className="text-sm font-medium mb-2">Teacher Feedback</p>
                          <p className="text-muted-foreground">{assignment.submission.grade.feedback}</p>
                        </div>
                        {assignment.submission?.grade?.gradedAt && (
                          <p className="text-xs text-muted-foreground mt-3">
                            Graded on {format(new Date(assignment.submission.grade.gradedAt), "MMM d, yyyy 'at' h:mm a")}
                          </p>
                        )}
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        <EmptyState
          icon={Award}
          title="No grades yet"
          description="Your grades will appear here once your teacher has graded your submissions"
        />
      )}
    </div>
  );
}
