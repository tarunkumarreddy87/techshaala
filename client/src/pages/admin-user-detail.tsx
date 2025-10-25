import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, User, Calendar, Mail, Phone, MapPin, BookOpen, FileText } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { User as UserType } from "@shared/schema";

export default function AdminUserDetail() {
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  console.log("AdminUserDetail component rendered with ID:", id);

  // Fetch user data
  const { data, isLoading, isError, error: queryError } = useQuery<UserType>({
    queryKey: [`/api/admin/users/${id}`],
    queryFn: () => {
      console.log("Making API request to:", `/api/admin/users/${id}`);
      return apiRequest("GET", `/api/admin/users/${id}`);
    },
    enabled: !!id,
  });

  useEffect(() => {
    console.log("Data effect triggered:", data);
    if (data) {
      setUser(data);
      setLoading(false);
    }
  }, [data]);

  useEffect(() => {
    console.log("Error effect triggered:", isError, queryError);
    if (isError) {
      setError(queryError?.message || "Failed to load user data");
      setLoading(false);
    }
  }, [isError, queryError]);

  const formatDate = (date: Date | string | null | undefined): string => {
    if (!date) return "N/A";
    try {
      const d = new Date(date);
      return isNaN(d.getTime()) ? "Invalid Date" : d.toLocaleDateString();
    } catch {
      return "Invalid Date";
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>User Information</CardTitle>
              <CardDescription>Basic details about the user</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-36" />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Activity</CardTitle>
              <CardDescription>User activity and statistics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-40" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error || "User not found"}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Details</h1>
          <p className="text-muted-foreground mt-1">View detailed information about {user.name}</p>
        </div>
        <Button onClick={() => window.history.back()}>Back to Users</Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>User Information</CardTitle>
            <CardDescription>Basic details about the user</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="bg-muted rounded-full p-3">
                <User className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold">{user.name}</h3>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Role</p>
                <Badge variant={user.role === "admin" ? "default" : user.role === "teacher" ? "secondary" : "outline"}>
                  {user.role}
                </Badge>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">Member Since</p>
                <p className="text-sm">{formatDate(user.createdAt)}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">User ID</p>
                <p className="text-sm font-mono">{user.id}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Activity</CardTitle>
            <CardDescription>User activity and statistics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="bg-muted rounded-full p-2">
                <Calendar className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium">Account Created</p>
                <p className="text-sm text-muted-foreground">{formatDate(user.createdAt)}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="bg-muted rounded-full p-2">
                <BookOpen className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium">Courses Enrolled</p>
                <p className="text-sm text-muted-foreground">N/A</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="bg-muted rounded-full p-2">
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium">Assignments Submitted</p>
                <p className="text-sm text-muted-foreground">N/A</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}