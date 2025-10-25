import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { AssignmentCard } from "@/components/assignment-card";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText } from "lucide-react";
import { useLocation } from "wouter";
import type { AssignmentWithCourse } from "@shared/schema";

export default function TeacherAssignments() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: assignments, isLoading } = useQuery<AssignmentWithCourse[]>({
    queryKey: ["/api/assignments/my-assignments"],
    enabled: !!user?.id,
  });

  // Since we don't have submission counts in the current data structure,
  // we'll categorize assignments based on whether they have due dates in the past or future
  const pastDue = assignments?.filter(a => new Date(a.dueDate) < new Date()) || [];
  const upcoming = assignments?.filter(a => new Date(a.dueDate) >= new Date()) || [];
  const allAssignments = assignments || [];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Assignments</h1>
        <p className="text-muted-foreground mt-1">Manage and grade assignments from your courses</p>
      </div>

      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all" data-testid="tab-all">
            All Assignments ({allAssignments.length})
          </TabsTrigger>
          <TabsTrigger value="upcoming" data-testid="tab-upcoming">
            Upcoming ({upcoming.length})
          </TabsTrigger>
          <TabsTrigger value="past" data-testid="tab-past">
            Past Due ({pastDue.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-48 w-full" />
              ))}
            </div>
          ) : allAssignments.length > 0 ? (
            <div className="space-y-4">
              {allAssignments.map((assignment) => (
                <AssignmentCard
                  key={assignment.id}
                  assignment={assignment}
                  showCourse
                  actionButton={
                    <Button
                      className="w-full"
                      onClick={() => setLocation(`/teacher/assignment/${assignment.id}`)}
                      data-testid={`button-grade-${assignment.id}`}
                    >
                      Manage Assignment
                    </Button>
                  }
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={FileText}
              title="No assignments found"
              description="Create your first assignment to get started"
            />
          )}
        </TabsContent>

        <TabsContent value="upcoming" className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-48 w-full" />
              ))}
            </div>
          ) : upcoming.length > 0 ? (
            <div className="space-y-4">
              {upcoming.map((assignment) => (
                <AssignmentCard
                  key={assignment.id}
                  assignment={assignment}
                  showCourse
                  actionButton={
                    <Button
                      className="w-full"
                      onClick={() => setLocation(`/teacher/assignment/${assignment.id}`)}
                      data-testid={`button-grade-${assignment.id}`}
                    >
                      Manage Assignment
                    </Button>
                  }
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={FileText}
              title="No upcoming assignments"
              description="All assignments have passed their due dates"
            />
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-48 w-full" />
              ))}
            </div>
          ) : pastDue.length > 0 ? (
            <div className="space-y-4">
              {pastDue.map((assignment) => (
                <AssignmentCard
                  key={assignment.id}
                  assignment={assignment}
                  showCourse
                  actionButton={
                    <Button
                      className="w-full"
                      onClick={() => setLocation(`/teacher/assignment/${assignment.id}`)}
                      data-testid={`button-grade-${assignment.id}`}
                    >
                      Manage Assignment
                    </Button>
                  }
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={FileText}
              title="No past due assignments"
              description="All assignments are upcoming"
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}