import { Home, BookOpen, FileText, Award, LogOut, User, MessagesSquare } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { useAuth } from "@/lib/auth-context";
import { useLocation } from "wouter";
import { AppLogo } from "./app-logo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export function AppSidebar() {
  const { user, setUser } = useAuth();
  const [location, setLocation] = useLocation();

  const studentItems = [
    { title: "Dashboard", url: "/student/dashboard", icon: Home },
    { title: "My Courses", url: "/student/courses", icon: BookOpen },
    { title: "Assignments", url: "/student/assignments", icon: FileText },
    { title: "Course Chat", url: "/student/course-chat", icon: MessagesSquare },
    { title: "Profile", url: "/student/profile", icon: User },
  ];

  const teacherItems = [
    { title: "Dashboard", url: "/teacher/dashboard", icon: Home },
    { title: "My Courses", url: "/teacher/courses", icon: BookOpen },
    { title: "Assignments", url: "/teacher/assignments", icon: FileText },
    { title: "Course Chat", url: "/teacher/course-chat", icon: MessagesSquare },
    { title: "Profile", url: "/teacher/profile", icon: User },
  ];

  const adminItems = [
    { title: "Dashboard", url: "/admin/dashboard", icon: Home },
    { title: "Profile", url: "/admin/profile", icon: User },
  ];

  const items = user?.role === "student" 
    ? studentItems 
    : user?.role === "teacher" 
      ? teacherItems 
      : adminItems;

  const handleLogout = () => {
    setUser(null);
    setLocation("/login");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b">
        <AppLogo />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    data-testid={`link-${item.title.toLowerCase().replace(" ", "-")}`}
                  >
                    <a href={item.url} onClick={(e) => {
                      e.preventDefault();
                      setLocation(item.url);
                    }}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t">
        <div 
          className="flex items-center gap-3 mb-3 cursor-pointer hover:bg-muted p-2 rounded-md transition-colors"
          onClick={() => {
            const profileUrl = user?.role === "student" 
              ? "/student/profile" 
              : user?.role === "teacher" 
                ? "/teacher/profile" 
                : "/admin/profile";
            setLocation(profileUrl);
          }}
        >
          <Avatar className="h-10 w-10 rounded-full">
            {user?.profileImage ? (
              <AvatarImage 
                src={user.profileImage.startsWith('/') ? `${window.location.origin}${user.profileImage}` : user.profileImage} 
                alt={user.name} 
                className="object-cover rounded-full"
              />
            ) : (
              <AvatarFallback className="bg-primary text-primary-foreground rounded-full">
                {user ? getInitials(user.name) : "U"}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.name}</p>
            <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={handleLogout}
          data-testid="button-logout"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}