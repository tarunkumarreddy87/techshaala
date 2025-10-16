import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, FileText, Award } from "lucide-react";
import type { AssignmentWithCourse } from "@shared/schema";
import { format, isPast, isToday, isTomorrow } from "date-fns";

interface AssignmentCardProps {
  assignment: AssignmentWithCourse;
  actionButton?: React.ReactNode;
  showCourse?: boolean;
  submission?: {
    submittedAt: Date;
    grade?: {
      score: number;
    };
  } | null;
}

export function AssignmentCard({ assignment, actionButton, showCourse = false, submission }: AssignmentCardProps) {
  const dueDate = new Date(assignment.dueDate);
  const isOverdue = isPast(dueDate) && !submission;
  
  const getDateLabel = () => {
    if (isToday(dueDate)) return "Due Today";
    if (isTomorrow(dueDate)) return "Due Tomorrow";
    if (isOverdue) return "Overdue";
    return `Due ${format(dueDate, "MMM d, yyyy")}`;
  };

  const getStatusBadge = () => {
    if (submission?.grade) {
      return (
        <Badge variant="default" className="bg-chart-2 text-white">
          Graded: {submission.grade.score}/{assignment.maxScore}
        </Badge>
      );
    }
    if (submission) {
      return <Badge variant="secondary">Submitted</Badge>;
    }
    if (isOverdue) {
      return <Badge variant="destructive">Overdue</Badge>;
    }
    return <Badge variant="outline">{getDateLabel()}</Badge>;
  };

  return (
    <Card className="hover-elevate transition-all" data-testid={`card-assignment-${assignment.id}`}>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary flex-shrink-0" />
              <span className="truncate">{assignment.title}</span>
            </CardTitle>
            {showCourse && (
              <p className="text-sm text-muted-foreground mt-1">
                {assignment.course.title}
              </p>
            )}
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {assignment.description}
        </p>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            <span>{format(dueDate, "MMM d, yyyy 'at' h:mm a")}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Award className="h-4 w-4" />
            <span>{assignment.maxScore} points</span>
          </div>
        </div>
      </CardContent>
      {actionButton && (
        <CardFooter>
          {actionButton}
        </CardFooter>
      )}
    </Card>
  );
}
