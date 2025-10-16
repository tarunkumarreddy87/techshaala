import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Clock, User } from "lucide-react";
import type { CourseWithTeacher } from "@shared/schema";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface CourseCardProps {
  course: CourseWithTeacher;
  actionButton?: React.ReactNode;
  onClick?: () => void;
}

export function CourseCard({ course, actionButton, onClick }: CourseCardProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card
      className="hover-elevate transition-all cursor-pointer"
      onClick={onClick}
      data-testid={`card-course-${course.id}`}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-xl truncate">{course.title}</CardTitle>
            <CardDescription className="mt-2 line-clamp-2">
              {course.description}
            </CardDescription>
          </div>
          <BookOpen className="h-5 w-5 text-primary flex-shrink-0" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" />
            <span>{course.duration}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Avatar className="h-5 w-5">
              <AvatarFallback className="text-xs">
                {getInitials(course.teacher.name)}
              </AvatarFallback>
            </Avatar>
            <span>{course.teacher.name}</span>
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
