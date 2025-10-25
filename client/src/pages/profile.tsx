import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-provider";
import { ArrowLeft, Upload, Key, User, Settings, BookOpen, FileText, Users, Award, Calendar, Clock, TrendingUp, Mail, Moon, Sun, Globe } from "lucide-react";
import type { User as UserType } from "@shared/schema";
import { StatCard } from "@/components/stat-card";

// Add this helper component for role-specific content
function RoleSpecificContent() {
  const { user } = useAuth();
  const { data: studentData } = useQuery({
    queryKey: ["student-profile-data"],
    queryFn: async () => {
      if (user?.role !== "student") return null;
      
      // Fetch student-specific data
      const [enrollmentsRes, assignmentsRes] = await Promise.all([
        fetch("/api/enrollments/my-courses"),
        fetch("/api/assignments/my-assignments")
      ]);
      
      const enrollments = await enrollmentsRes.json();
      const assignments = await assignmentsRes.json();
      
      return {
        enrolledCourses: enrollments.length,
        pendingAssignments: assignments.filter((a: any) => !a.submission).length,
        completedAssignments: assignments.filter((a: any) => a.submission).length,
        averageGrade: assignments && assignments.length > 0
          ? assignments
            .filter((a: any) => a.submission?.grade)
            .reduce((acc: number, a: any) => {
              const score = a.submission?.grade?.score || 0;
              const max = a.maxScore;
              return acc + (score / max) * 100;
            }, 0) / (assignments.filter((a: any) => a.submission?.grade).length || 1)
          : 0
      };
    },
    enabled: !!user?.id && user.role === "student"
  });
  
  const { data: teacherData } = useQuery({
    queryKey: ["teacher-profile-data"],
    queryFn: async () => {
      if (user?.role !== "teacher") return null;
      
      // Fetch teacher-specific data
      const [coursesRes, statsRes] = await Promise.all([
        fetch("/api/courses/my-courses"),
        fetch("/api/teacher/stats")
      ]);
      
      const courses = await coursesRes.json();
      const stats = await statsRes.json();
      
      return {
        totalCourses: courses.length,
        totalStudents: stats.totalStudents,
        totalAssignments: stats.totalAssignments,
        pendingSubmissions: stats.pendingSubmissions
      };
    },
    enabled: !!user?.id && user.role === "teacher"
  });

  if (user?.role === "student") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <StatCard
          title="Enrolled Courses"
          value={studentData?.enrolledCourses || 0}
          icon={BookOpen}
          description="Active courses"
        />
        <StatCard
          title="Pending Assignments"
          value={studentData?.pendingAssignments || 0}
          icon={FileText}
          description="Due soon"
        />
        <StatCard
          title="Completed"
          value={studentData?.completedAssignments || 0}
          icon={Award}
          description="Assignments submitted"
        />
        <StatCard
          title="Average Grade"
          value={studentData?.averageGrade !== undefined && typeof studentData.averageGrade === 'number' && !isNaN(studentData.averageGrade) ? `${Math.round(studentData.averageGrade)}%` : "N/A"}
          icon={TrendingUp}
          description="Overall performance"
        />
      </div>
    );
  }

  if (user?.role === "teacher") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <StatCard
          title="Total Courses"
          value={teacherData?.totalCourses || 0}
          icon={BookOpen}
          description="Active courses"
        />
        <StatCard
          title="Total Students"
          value={teacherData?.totalStudents || 0}
          icon={Users}
          description="Enrolled across all courses"
        />
        <StatCard
          title="Total Assignments"
          value={teacherData?.totalAssignments || 0}
          icon={FileText}
          description="Created assignments"
        />
        <StatCard
          title="Pending Reviews"
          value={teacherData?.pendingSubmissions || 0}
          icon={Clock}
          description="Awaiting grading"
        />
      </div>
    );
  }

  return null;
}

export default function Profile() {
  const { user, setUser } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [name, setName] = useState(user?.name || "");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(user?.profileImage || null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  // Add state for settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const { theme, setTheme } = useTheme();

  // Update state when user changes
  useEffect(() => {
    setName(user?.name || "");
    // Ensure we're using the full URL for profile images
    if (user?.profileImage) {
      if (user.profileImage.startsWith('/')) {
        setPreviewUrl(`${window.location.origin}${user.profileImage}`);
      } else {
        setPreviewUrl(user.profileImage);
      }
    } else {
      setPreviewUrl(null);
    }
  }, [user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // For profile images, we'll allow common image formats
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Only image files are allowed for profile pictures",
          variant: "destructive",
        });
        e.target.value = ''; // Clear the input
        return;
      }
      
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Profile image must be less than 5MB",
          variant: "destructive",
        });
        e.target.value = ''; // Clear the input
        return;
      }
      
      setSelectedFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name) {
      toast({
        title: "Missing information",
        description: "Please provide your name",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Prepare form data for file upload
      const formData = new FormData();
      formData.append("name", name);
      
      if (selectedFile) {
        formData.append("profileImage", selectedFile);
      }
      
      const response = await fetch("/api/auth/profile", {
        method: "PUT",
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error("Failed to update profile");
      }
      
      const updatedUser = await response.json();
      
      // Update auth context
      setUser(updatedUser);
      
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated",
      });
      
      // Refresh the query client to update any cached data
      queryClient.invalidateQueries({ queryKey: ["student-profile-data"] });
      queryClient.invalidateQueries({ queryKey: ["teacher-profile-data"] });
    } catch (error) {
      toast({
        title: "Update failed",
        description: "Failed to update profile",
        variant: "destructive",
      });
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: "Missing information",
        description: "Please fill in all password fields",
        variant: "destructive",
      });
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "Password mismatch",
        description: "New password and confirmation do not match",
        variant: "destructive",
      });
      return;
    }
    
    if (newPassword.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to change password");
      }
      
      toast({
        title: "Password changed",
        description: "Your password has been successfully updated",
      });
      
      // Clear password fields
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast({
        title: "Password change failed",
        description: error.message || "Failed to change password",
        variant: "destructive",
      });
    }
  };

  // Toggle email notifications
  const toggleEmailNotifications = () => {
    const newStatus = !emailNotifications;
    setEmailNotifications(newStatus);
    
    // In a real implementation, you would save this to the backend
    // For now, we'll just show a toast
    toast({
      title: "Email notifications updated",
      description: newStatus 
        ? "You will now receive email notifications" 
        : "You will no longer receive email notifications"
    });
    
    // Save to backend
    fetch("/api/auth/preferences", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        emailNotifications: newStatus
      })
    }).catch(error => {
      console.error("Failed to save preferences:", error);
    });
  };

  // Toggle theme
  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    
    toast({
      title: "Theme updated",
      description: `Switched to ${newTheme} mode`
    });
    
    // Save to backend
    fetch("/api/auth/preferences", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        theme: newTheme
      })
    }).catch(error => {
      console.error("Failed to save preferences:", error);
    });
  };

  // Handle account deletion
  const handleDeleteAccount = () => {
    if (window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      toast({
        title: "Account deletion",
        description: "Account deletion functionality will be implemented in a future update",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col">
      {/* Main Content - Full Width */}
      <div className="w-full bg-white dark:bg-gray-900 p-4 sm:p-6 md:p-8 lg:p-12 flex flex-col">
        <div className="mb-6 md:mb-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profile Settings</h1>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation(user?.role === "student" ? "/student/dashboard" : "/teacher/dashboard")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>

        <div className="w-full mx-auto flex-1 overflow-y-auto">
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Manage your account settings and preferences</h2>
          </div>
          
          {/* User Profile Header */}
          <div className="flex flex-col sm:flex-row items-start gap-6 mb-8 p-6 bg-muted rounded-lg">
            <div className="relative">
              <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow">
                {previewUrl ? (
                  <img 
                    src={previewUrl} 
                    alt="Profile preview" 
                    className="w-full h-full object-cover object-center"
                  />
                ) : (
                  <div className="w-full h-full bg-primary flex items-center justify-center rounded-full">
                    <span className="text-2xl font-bold text-primary-foreground">
                      {user?.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              
              {/* Controls */}
              <div className="absolute -bottom-2 -right-2 bg-white rounded-full shadow-md p-1">
                <label 
                  htmlFor="profile-image" 
                  className="cursor-pointer text-primary hover:text-primary/80"
                >
                  <Upload className="h-5 w-5" />
                </label>
              </div>
            </div>
            
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{user?.name}</h2>
              <p className="text-muted-foreground capitalize">{user?.role}</p>
              <p className="text-sm text-muted-foreground mt-1">Member since {new Date(user?.createdAt || Date.now()).toLocaleDateString()}</p>
              
              <p className="text-sm text-muted-foreground mt-4">
                Click the upload icon to select your profile picture
              </p>
            </div>
          </div>
          
          <Input
            id="profile-image"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          
          {/* Role-specific stats */}
          <RoleSpecificContent />
          
          <Tabs defaultValue="profile" className="space-y-6 mt-8">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                Security
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="profile" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>Update your personal information and profile picture</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleUpdateProfile} className="space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Your full name"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          value={user?.email || ""}
                          disabled
                          placeholder="Your email"
                        />
                        <p className="text-sm text-muted-foreground">Email cannot be changed</p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="role">Account Role</Label>
                        <Input
                          id="role"
                          value={user?.role?.charAt(0).toUpperCase() + (user?.role?.slice(1) || "") || ""}
                          disabled
                          placeholder="Your role"
                        />
                        <p className="text-sm text-muted-foreground">Your account role</p>
                      </div>
                    </div>
                    
                    <div className="flex justify-end gap-3 pt-4">
                      <Button type="submit" className="w-full sm:w-auto">
                        Save Changes
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="security" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                  <CardDescription>Update your password to keep your account secure</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleChangePassword} className="space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="current-password">Current Password</Label>
                        <Input
                          id="current-password"
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="Enter your current password"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="new-password">New Password</Label>
                        <Input
                          id="new-password"
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Enter your new password"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirm New Password</Label>
                        <Input
                          id="confirm-password"
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirm your new password"
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-end gap-3 pt-4">
                      <Button type="submit" className="w-full sm:w-auto">
                        Change Password
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Account Security</CardTitle>
                  <CardDescription>Additional security settings for your account</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-blue-100 rounded-full">
                          <Key className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-medium">Two-Factor Authentication</h3>
                          <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
                        </div>
                      </div>
                      <Button variant="outline" disabled size="sm">Enable</Button>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-green-100 rounded-full">
                          <Calendar className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <h3 className="font-medium">Login Activity</h3>
                          <p className="text-sm text-muted-foreground">View your recent login activity</p>
                        </div>
                      </div>
                      <Button variant="outline" onClick={() => toast({title: "Feature coming soon", description: "This feature will be available in a future update"})} size="sm">View</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="settings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Account Preferences</CardTitle>
                  <CardDescription>Customize your account settings and preferences</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-purple-100 rounded-full">
                          <Mail className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <h3 className="font-medium">Email Notifications</h3>
                          <p className="text-sm text-muted-foreground">Receive email notifications for important updates</p>
                        </div>
                      </div>
                      <Button 
                        variant={emailNotifications ? "default" : "outline"} 
                        size="sm"
                        onClick={toggleEmailNotifications}
                      >
                        {emailNotifications ? "Enabled" : "Enable"}
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-orange-100 rounded-full">
                          {theme === "light" ? (
                            <Moon className="h-5 w-5 text-orange-600" />
                          ) : (
                            <Sun className="h-5 w-5 text-orange-600" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-medium">Dark Mode</h3>
                          <p className="text-sm text-muted-foreground">Switch between light and dark themes</p>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={toggleTheme}
                      >
                        {theme === "light" ? "Enable Dark Mode" : "Enable Light Mode"}
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-teal-100 rounded-full">
                          <Globe className="h-5 w-5 text-teal-600" />
                        </div>
                        <div>
                          <h3 className="font-medium">Language</h3>
                          <p className="text-sm text-muted-foreground">Select your preferred language</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => toast({title: "Feature coming soon", description: "Language selection will be available in a future update"})}>
                        English
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-destructive">
                <CardHeader>
                  <CardTitle className="text-destructive">Danger Zone</CardTitle>
                  <CardDescription>Permanently delete your account and all associated data</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border border-destructive rounded-lg">
                    <div>
                      <h3 className="font-medium text-destructive">Delete Account</h3>
                      <p className="text-sm text-muted-foreground">Once you delete your account, there is no going back</p>
                    </div>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={handleDeleteAccount}
                    >
                      Delete Account
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}