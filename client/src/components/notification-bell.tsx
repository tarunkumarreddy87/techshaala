import { useState, useEffect, useRef } from "react";
import { Bell, MessageCircle, Phone, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem
} from "@/components/ui/dropdown-menu";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth-context";
import SocketClient from "@/lib/socket";

interface Notification {
  id: string;
  type: "chat_message" | "call_invite" | "assignment_due";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  relatedId?: string;
}

export function NotificationBell() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const newNotificationListener = useRef<Function | null>(null);

  // Fetch notifications
  const { data: fetchedNotifications = [], refetch } = useQuery<Notification[]>({
    queryKey: ["notifications"],
    queryFn: () => apiRequest("GET", "/api/notifications"),
    enabled: !!user,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Update notifications when fetched
  useEffect(() => {
    setNotifications(fetchedNotifications);
    setUnreadCount(fetchedNotifications.filter(n => !n.read).length);
  }, [fetchedNotifications]);

  // Initialize Socket.IO connection for real-time notifications
  useEffect(() => {
    if (!user) return;

    const initSocket = async () => {
      try {
        // Connect to Socket.IO server
        await SocketClient.connect();
        
        // Register user with the Socket.IO server
        SocketClient.emit('message', {
          type: 'REGISTER_USER',
          userId: user.id
        });

        // Listen for new notifications
        newNotificationListener.current = (notification: Notification) => {
          setNotifications(prev => [notification, ...prev]);
          setUnreadCount(prev => prev + 1);
        };
        
        SocketClient.on('new_notification', newNotificationListener.current);

      } catch (error) {
        console.error("Failed to connect to Socket.IO:", error);
      }
    };

    initSocket();

    // Clean up Socket.IO connection on unmount
    return () => {
      if (newNotificationListener.current) {
        SocketClient.off('new_notification', newNotificationListener.current);
      }
    };
  }, [user]);

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
    setUnreadCount(0);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    return date.toLocaleDateString();
  };

  const getIcon = (type: Notification["type"]) => {
    switch (type) {
      case "chat_message":
        return <MessageCircle className="h-4 w-4" />;
      case "call_invite":
        return <Phone className="h-4 w-4" />;
      case "assignment_due":
        return <Bell className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" data-testid="notification-bell">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-4 py-2">
          <DropdownMenuLabel>Notifications</DropdownMenuLabel>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              Mark all as read
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            No notifications
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            {notifications.slice(0, 10).map((notification) => (
              <DropdownMenuItem 
                key={notification.id} 
                className="flex items-start gap-3 p-4 cursor-pointer hover:bg-muted"
                onClick={() => markAsRead(notification.id)}
              >
                <div className={`mt-0.5 p-2 rounded-full ${notification.read ? 'bg-muted' : 'bg-primary/10'}`}>
                  {getIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={`text-sm font-medium ${!notification.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {notification.title}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {formatTime(notification.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {notification.message}
                  </p>
                </div>
              </DropdownMenuItem>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}