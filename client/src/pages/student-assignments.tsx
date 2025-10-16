import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { AssignmentCard } from "@/components/assignment-card";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText } from "lucide-react";
import { useLocation } from "wouter";
import type { AssignmentWithCourse, SubmissionWithDetails } from "@shared/schema";

export default function StudentAssignments() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: assignments, isLoading } = useQuery<(AssignmentWithCourse & {
    submission?: SubmissionWithDetails;
  })[]>({
    queryKey: ["/api/assignments/my-assignments"],
    enabled: !!user?.id,
  });

  const pendingAssignments = assignments?.filter(a => !a.submission) || [];
  const submittedAssignments = assignments?.filter(a => a.submission && !a.submission.grade) || [];
  const gradedAssignments = assignments?.filter(a => a.submission?.grade) || [];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Assignments</h1>
        <p className="text-muted-foreground mt-1">View and manage all your assignments</p>
      </div>

      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList>
          <TabsTrigger value="pending" data-testid="tab-pending">
            Pending ({pendingAssignments.length})
          </TabsTrigger>
          <TabsTrigger value="submitted" data-testid="tab-submitted">
            Submitted ({submittedAssignments.length})
          </TabsTrigger>
          <TabsTrigger value="graded" data-testid="tab-graded">
            Graded ({gradedAssignments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-48 w-full" />
              ))}
            </div>
          ) : pendingAssignments.length > 0 ? (
            <div className="space-y-4">
              {pendingAssignments.map((assignment) => (
                <AssignmentCard
                  key={assignment.id}
                  assignment={assignment}
                  showCourse
                  actionButton={
                    <Button
                      className="w-full"
                      onClick={() => setLocation(`/student/assignment/${assignment.id}`)}
                      data-testid={`button-submit-${assignment.id}`}
                    >
                      Submit Assignment
                    </Button>
                  }
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={FileText}
              title="No pending assignments"
              description="You don't have any assignments to submit at the moment"
            />
          )}
        </TabsContent>

        <TabsContent value="submitted" className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-48 w-full" />
              ))}
            </div>
          ) : submittedAssignments.length > 0 ? (
            <div className="space-y-4">
              {submittedAssignments.map((assignment) => (
                <AssignmentCard
                  key={assignment.id}
                  assignment={assignment}
                  submission={assignment.submission}
                  showCourse
                  actionButton={
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setLocation(`/student/assignment/${assignment.id}`)}
                      data-testid={`button-view-${assignment.id}`}
                    >
                      View Submission
                    </Button>
                  }
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={FileText}
              title="No submitted assignments"
              description="Assignments you submit will appear here while awaiting grading"
            />
          )}
        </TabsContent>

        <TabsContent value="graded" className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-48 w-full" />
              ))}
            </div>
          ) : gradedAssignments.length > 0 ? (
            <div className="space-y-4">
              {gradedAssignments.map((assignment) => (
                <AssignmentCard
                  key={assignment.id}
                  assignment={assignment}
                  submission={assignment.submission}
                  showCourse
                  actionButton={
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setLocation(`/student/assignment/${assignment.id}`)}
                      data-testid={`button-view-grade-${assignment.id}`}
                    >
                      View Grade & Feedback
                    </Button>
                  }
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={FileText}
              title="No graded assignments"
              description="Your graded assignments will appear here"
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
