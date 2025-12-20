import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Circle, ListTodo, Plus, Trash2, AlertCircle } from "lucide-react";
import type { Task } from "@shared/schema";
import { format } from "date-fns";

export default function StudentTasks() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newTaskTitle, setNewTaskTitle] = useState("");

  const { data: tasks, isLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const createTaskMutation = useMutation({
    mutationFn: async (title: string) => {
      const res = await apiRequest("POST", "/api/tasks", { title });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      setNewTaskTitle("");
      toast({
        title: "Task added",
        description: "New task has been added to your list",
      });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, isCompleted }: { id: string; isCompleted: boolean }) => {
      const res = await apiRequest("PATCH", `/api/tasks/${id}`, { isCompleted });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    },
  });

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    createTaskMutation.mutate(newTaskTitle);
  };

  const handleToggleTask = (id: string, currentStatus: boolean | null) => {
    updateTaskMutation.mutate({ id, isCompleted: !currentStatus });
  };

  // Demo initialization logic
  const seedDemoTasks = async () => {
    if (tasks && tasks.length > 0) return;

    const demoTasks = [
      { title: "Complete Module 1 Assignment", isCompleted: true },
      { title: "Review Study Notes for Chapter 2", isCompleted: true },
      { title: "Submit Project Proposal", isCompleted: true },
      { title: "Attend Virtual Workshop", isCompleted: true },
      { title: "Update Profile Information", isCompleted: true },
      { title: "Prepare for Mid-term Exam", isCompleted: false }, // Pending
      { title: "Group Discussion Preparation", isCompleted: false }, // Pending
    ];

    try {
      for (const task of demoTasks) {
        // We can't batch create easily with current API, so we'll loop
        // In a real app, we'd add a bulk create endpoint
        const res = await apiRequest("POST", "/api/tasks", { title: task.title });
        const createdTask = await res.json();
        if (task.isCompleted) {
          await apiRequest("PATCH", `/api/tasks/${createdTask.id}`, { isCompleted: true });
        }
      }
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Demo Tasks Loaded",
        description: "Added 7 tasks (5 completed, 2 pending)",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to seed demo tasks",
        variant: "destructive",
      });
    }
  };

  const completedCount = tasks?.filter(t => t.isCompleted).length || 0;
  const totalCount = tasks?.length || 0;
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Tasks</h1>
          <p className="text-muted-foreground mt-1">
            Track your learning progress and pending activities
          </p>
        </div>
        {totalCount === 0 && !isLoading && (
          <Button variant="outline" onClick={seedDemoTasks}>
            Load Demo Tasks
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Progress Overview Card */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Progress Overview</CardTitle>
            <CardDescription>Your task completion status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center py-4">
              <div className="relative flex items-center justify-center w-32 h-32 rounded-full border-8 border-muted">
                 {/* Simple circular representation using CSS or just text */}
                 <div className="absolute inset-0 flex items-center justify-center flex-col">
                    <span className="text-3xl font-bold">{Math.round(progressPercentage)}%</span>
                    <span className="text-xs text-muted-foreground">Completed</span>
                 </div>
                 <svg className="absolute inset-0 w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                    <circle
                      className="text-primary transition-all duration-1000 ease-out"
                      strokeWidth="8"
                      strokeDasharray={`${progressPercentage * 2.51} 251`}
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="transparent"
                      r="40"
                      cx="50"
                      cy="50"
                    />
                 </svg>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Completed</span>
                <span className="font-medium">{completedCount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Pending</span>
                <span className="font-medium">{totalCount - completedCount}</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Task List Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListTodo className="h-5 w-5" />
              Task List
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleCreateTask} className="flex gap-2">
              <Input
                placeholder="Add a new task..."
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="flex-1"
              />
              <Button type="submit" disabled={!newTaskTitle.trim() || createTaskMutation.isPending}>
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </form>

            <div className="space-y-2">
              {isLoading ? (
                 <div className="space-y-2">
                   {[1, 2, 3].map((i) => (
                     <div key={i} className="h-12 bg-muted rounded animate-pulse" />
                   ))}
                 </div>
              ) : tasks?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No tasks yet. Add one above or load demo tasks.
                </div>
              ) : (
                tasks?.map((task) => (
                  <div
                    key={task.id}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                      task.isCompleted ? "bg-muted/50" : "bg-card hover:bg-muted/20 border-l-4 border-l-primary"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id={`task-${task.id}`}
                        checked={!!task.isCompleted}
                        onCheckedChange={() => handleToggleTask(task.id, task.isCompleted)}
                      />
                      <div className="grid gap-1">
                        <Label
                          htmlFor={`task-${task.id}`}
                          className={`text-base font-medium cursor-pointer ${
                            task.isCompleted ? "line-through text-muted-foreground" : ""
                          }`}
                        >
                          {task.title}
                        </Label>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(task.createdAt || new Date()), "MMM d, h:mm a")}
                        </span>
                      </div>
                    </div>
                    {!task.isCompleted && (
                       <Badge variant="outline" className="ml-auto bg-yellow-50 text-yellow-700 border-yellow-200">
                         Pending
                       </Badge>
                    )}
                    {task.isCompleted && (
                       <Badge variant="outline" className="ml-auto bg-green-50 text-green-700 border-green-200">
                         Done
                       </Badge>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
