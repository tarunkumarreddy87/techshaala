import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Search, Users, BookOpen, FileText, User, Shield, Eye, Ban, CheckCircle, XCircle, Trash2, Plus, Edit, Archive, Calendar, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { User as UserType, Course, Assignment } from "@shared/schema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [userFilter, setUserFilter] = useState<"all" | "student" | "teacher" | "admin">("all");
  const [courseFilter, setCourseFilter] = useState<"all" | "active" | "archived">("all");
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [deleteUserName, setDeleteUserName] = useState<string>("");
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [isUserDetailOpen, setIsUserDetailOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isCourseDetailOpen, setIsCourseDetailOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [isAssignmentDetailOpen, setIsAssignmentDetailOpen] = useState(false);

  const { data: users, isLoading: usersLoading, refetch: refetchUsers } = useQuery<UserType[]>({
    queryKey: ["/api/admin/users"],
    queryFn: () => apiRequest("GET", "/api/admin/users"),
  });

  const { data: courses, isLoading: coursesLoading, refetch: refetchCourses } = useQuery<Course[]>({
    queryKey: ["/api/admin/courses"],
    queryFn: () => apiRequest("GET", "/api/admin/courses"),
  });

  const { data: assignments, isLoading: assignmentsLoading, refetch: refetchAssignments } = useQuery<Assignment[]>({
    queryKey: ["/api/admin/assignments"],
    queryFn: () => apiRequest("GET", "/api/admin/assignments"),
  });

  // Block user mutation
  const blockUserMutation = useMutation({
    mutationFn: (userId: string) => apiRequest("PUT", `/api/admin/users/${userId}/block`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "User updated",
        description: "The user status has been updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user",
        variant: "destructive",
      });
    },
  });

  // Unblock user mutation
  const unblockUserMutation = useMutation({
    mutationFn: (userId: string) => apiRequest("PUT", `/api/admin/users/${userId}/unblock`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "User updated",
        description: "The user status has been updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user",
        variant: "destructive",
      });
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: (userId: string) => apiRequest("DELETE", `/api/admin/users/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "User deleted",
        description: "The user has been successfully deleted.",
      });
    },
    onError: (error: any) => {
      console.error("Delete user error:", error);
      const errorMessage = error.message || error.error || "Failed to delete user";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Archive course mutation
  const archiveCourseMutation = useMutation({
    mutationFn: (courseId: string) => apiRequest("PUT", `/api/admin/courses/${courseId}/archive`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/courses"] });
      toast({
        title: "Course updated",
        description: "The course has been archived.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to archive course",
        variant: "destructive",
      });
    },
  });

  // Unarchive course mutation
  const unarchiveCourseMutation = useMutation({
    mutationFn: (courseId: string) => apiRequest("PUT", `/api/admin/courses/${courseId}/unarchive`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/courses"] });
      toast({
        title: "Course updated",
        description: "The course has been unarchived.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to unarchive course",
        variant: "destructive",
      });
    },
  });

  // Filter users based on search term and role filter
  const filteredUsers = users?.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = userFilter === "all" || user.role === userFilter;
    return matchesSearch && matchesRole;
  }) || [];

  // Filter courses based on search term and status filter
  const filteredCourses = courses?.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      course.description.toLowerCase().includes(searchTerm.toLowerCase());
    // For now, we'll assume all courses are active
    const matchesStatus = courseFilter === "all" || courseFilter === "active";
    return matchesSearch && matchesStatus;
  }) || [];

  // Filter assignments based on search term
  const filteredAssignments = assignments?.filter(assignment => {
    const matchesSearch = assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      assignment.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  }) || [];

  // Get teacher name by ID
  const getTeacherName = (teacherId: string) => {
    const teacher = users?.find(user => user.id === teacherId && user.role === "teacher");
    return teacher ? teacher.name : "Unknown Teacher";
  };

  // Get course title by ID
  const getCourseTitle = (courseId: string) => {
    const course = courses?.find(c => c.id === courseId);
    return course ? course.title : "Unknown Course";
  };

  // Format date safely
  const formatDate = (date: Date | string | null | undefined): string => {
    if (!date) return "N/A";
    try {
      const d = new Date(date);
      return isNaN(d.getTime()) ? "Invalid Date" : d.toLocaleDateString();
    } catch {
      return "Invalid Date";
    }
  };

  // Handle delete user
  const handleDeleteUser = (userId: string, userName: string) => {
    setDeleteUserId(userId);
    setDeleteUserName(userName);
  };

  // Confirm delete user
  const confirmDeleteUser = () => {
    if (deleteUserId) {
      deleteUserMutation.mutate(deleteUserId);
      setDeleteUserId(null);
      setDeleteUserName("");
    }
  };

  // Handle block/unblock user
  const handleToggleUserStatus = (userId: string, isBlocked: boolean) => {
    if (isBlocked) {
      unblockUserMutation.mutate(userId);
    } else {
      blockUserMutation.mutate(userId);
    }
  };

  // Handle archive/unarchive course
  const handleToggleCourseStatus = (courseId: string, isArchived: boolean) => {
    if (isArchived) {
      unarchiveCourseMutation.mutate(courseId);
    } else {
      archiveCourseMutation.mutate(courseId);
    }
  };

  // View user details
  const viewUserDetails = (user: UserType) => {
    setSelectedUser(user);
    setIsUserDetailOpen(true);
  };

  // View course details
  const viewCourseDetails = (course: Course) => {
    setSelectedCourse(course);
    setIsCourseDetailOpen(true);
  };

  // View assignment details
  const viewAssignmentDetails = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setIsAssignmentDetailOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage users, courses, and assignments</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => toast({title: "Feature coming soon", description: "This feature will be available in a future update"})}>
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </Button>
          <Button onClick={() => toast({title: "Feature coming soon", description: "This feature will be available in a future update"})}>
            <Shield className="h-4 w-4 mr-2" />
            System Settings
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users?.length || 0}</div>
            <p className="text-xs text-muted-foreground">+2 from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{courses?.length || 0}</div>
            <p className="text-xs text-muted-foreground">+1 from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assignments</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignments?.length || 0}</div>
            <p className="text-xs text-muted-foreground">+3 from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Teachers</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users?.filter(u => u.role === "teacher").length || 0}
            </div>
            <p className="text-xs text-muted-foreground">+1 from last month</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users, courses, assignments..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button onClick={() => toast({title: "Feature coming soon", description: "This feature will be available in a future update"})}>
          <Plus className="h-4 w-4 mr-2" />
          Add New
        </Button>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="courses" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Courses
          </TabsTrigger>
          <TabsTrigger value="assignments" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Assignments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>View and manage all users in the system</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-sm text-muted-foreground">Filter:</Label>
                  <Select value={userFilter} onValueChange={(value: "all" | "student" | "teacher" | "admin") => setUserFilter(value)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      <SelectItem value="student">Students</SelectItem>
                      <SelectItem value="teacher">Teachers</SelectItem>
                      <SelectItem value="admin">Admins</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-muted rounded animate-pulse"></div>
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant={user.role === "admin" ? "default" : user.role === "teacher" ? "secondary" : "outline"}>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.isBlocked ? "destructive" : "default"}>
                            {user.isBlocked ? "Blocked" : "Active"}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(user.createdAt)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => viewUserDetails(user)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            {user.role !== "admin" && (
                              <>
                                <Button
                                  size="sm"
                                  variant={user.isBlocked ? "default" : "secondary"}
                                  onClick={() => handleToggleUserStatus(user.id, !!user.isBlocked)}
                                >
                                  {user.isBlocked ? (
                                    <>
                                      <CheckCircle className="h-4 w-4 mr-1" />
                                      Unblock
                                    </>
                                  ) : (
                                    <>
                                      <Ban className="h-4 w-4 mr-1" />
                                      Block
                                    </>
                                  )}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleDeleteUser(user.id, user.name)}
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Delete
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="courses" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle>Course Management</CardTitle>
                  <CardDescription>View and manage all courses in the system</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-sm text-muted-foreground">Filter:</Label>
                  <Select value={courseFilter} onValueChange={(value: "all" | "active" | "archived") => setCourseFilter(value)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Courses</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {coursesLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-muted rounded animate-pulse"></div>
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Teacher</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Students</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCourses.map((course) => (
                      <TableRow key={course.id}>
                        <TableCell className="font-medium">{course.title}</TableCell>
                        <TableCell>{course.description}</TableCell>
                        <TableCell>{course.duration}</TableCell>
                        <TableCell>
                          {getTeacherName(course.teacherId)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={course.isArchived ? "secondary" : "default"}>
                            {course.isArchived ? "Archived" : "Active"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">24 students</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => viewCourseDetails(course)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            <Button
                              size="sm"
                              variant={(course.isArchived ?? false) ? "default" : "secondary"}
                              onClick={() => handleToggleCourseStatus(course.id, !!course.isArchived)}
                            >
                              {course.isArchived ? (
                                <>
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Unarchive
                                </>
                              ) : (
                                <>
                                  <Archive className="h-4 w-4 mr-1" />
                                  Archive
                                </>
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assignments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Assignment Management</CardTitle>
              <CardDescription>View and manage all assignments in the system</CardDescription>
            </CardHeader>
            <CardContent>
              {assignmentsLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-muted rounded animate-pulse"></div>
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Max Score</TableHead>
                      <TableHead>Submissions</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAssignments.map((assignment) => (
                      <TableRow key={assignment.id}>
                        <TableCell className="font-medium">{assignment.title}</TableCell>
                        <TableCell>{assignment.description}</TableCell>
                        <TableCell>
                          {getCourseTitle(assignment.courseId)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {formatDate(assignment.dueDate)}
                          </div>
                        </TableCell>
                        <TableCell>{assignment.maxScore}</TableCell>
                        <TableCell>
                          <Badge variant="outline">18/24 submitted</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => viewAssignmentDetails(assignment)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setLocation(`/admin/assignment/${assignment.id}/edit`)}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteUserId} onOpenChange={() => setDeleteUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the user "{deleteUserName}" and remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteUser} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* User Detail Dialog */}
      <Dialog open={isUserDetailOpen} onOpenChange={setIsUserDetailOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              Detailed information about the user
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="bg-muted rounded-full w-16 h-16 flex items-center justify-center">
                  <User className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="font-semibold">{selectedUser.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Role:</span>
                  <span className="font-medium">{selectedUser.role}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge variant={selectedUser.isBlocked ? "destructive" : "default"}>
                    {selectedUser.isBlocked ? "Blocked" : "Active"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created:</span>
                  <span className="font-medium">{formatDate(selectedUser.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Login:</span>
                  <span className="font-medium">2 days ago</span>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsUserDetailOpen(false)}>
                  Close
                </Button>
                <Button onClick={() => {
                  setLocation(`/admin/user/${selectedUser.id}/edit`);
                  setIsUserDetailOpen(false);
                }}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Course Detail Dialog */}
      <Dialog open={isCourseDetailOpen} onOpenChange={setIsCourseDetailOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Course Details</DialogTitle>
            <DialogDescription>
              Detailed information about the course
            </DialogDescription>
          </DialogHeader>
          {selectedCourse && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{selectedCourse.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{selectedCourse.description}</p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration:</span>
                  <span className="font-medium">{selectedCourse.duration}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Teacher:</span>
                  <span className="font-medium">{getTeacherName(selectedCourse.teacherId)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge variant={selectedCourse.isArchived ? "secondary" : "default"}>
                    {selectedCourse.isArchived ? "Archived" : "Active"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created:</span>
                  <span className="font-medium">{formatDate(selectedCourse.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Students:</span>
                  <span className="font-medium">24 enrolled</span>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCourseDetailOpen(false)}>
                  Close
                </Button>
                <Button onClick={() => {
                  setLocation(`/admin/course/${selectedCourse.id}/edit`);
                  setIsCourseDetailOpen(false);
                }}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Assignment Detail Dialog */}
      <Dialog open={isAssignmentDetailOpen} onOpenChange={setIsAssignmentDetailOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assignment Details</DialogTitle>
            <DialogDescription>
              Detailed information about the assignment
            </DialogDescription>
          </DialogHeader>
          {selectedAssignment && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{selectedAssignment.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{selectedAssignment.description}</p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Course:</span>
                  <span className="font-medium">{getCourseTitle(selectedAssignment.courseId)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Due Date:</span>
                  <span className="font-medium">{formatDate(selectedAssignment.dueDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Max Score:</span>
                  <span className="font-medium">{selectedAssignment.maxScore}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created:</span>
                  <span className="font-medium">{formatDate(selectedAssignment.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Submissions:</span>
                  <span className="font-medium">18/24 submitted</span>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAssignmentDetailOpen(false)}>
                  Close
                </Button>
                <Button onClick={() => {
                  setLocation(`/admin/assignment/${selectedAssignment.id}/edit`);
                  setIsAssignmentDetailOpen(false);
                }}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}