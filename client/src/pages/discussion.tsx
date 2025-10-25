import { useState } from "react";
import { useAuth } from "../lib/auth-context";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { ChatDiscussion } from "../components/chat-discussion";
import { PrivateChat } from "../components/private-chat";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { ScrollArea } from "../components/ui/scroll-area";
import { Search, MessageCircle, User, Send } from "lucide-react";

interface User {
  id: string;
  name: string;
  role: string;
}

export default function Discussion() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newPost, setNewPost] = useState("");
  const [isPrivateChatOpen, setIsPrivateChatOpen] = useState(false);

  // Mock users data
  const users: User[] = [
    { id: "1", name: "John Doe", role: "student" },
    { id: "2", name: "Jane Smith", role: "teacher" },
    { id: "3", name: "Bob Johnson", role: "student" },
    { id: "4", name: "Alice Brown", role: "student" },
  ];

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreatePost = () => {
    if (!newPost.trim()) return;
    // In a real app, you would send this to the backend
    console.log("Creating post:", newPost);
    setNewPost("");
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Discussion Forum</h1>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              className="pl-8 w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Dialog open={isPrivateChatOpen} onOpenChange={setIsPrivateChatOpen}>
            <DialogTrigger asChild>
              <Button>
                <MessageCircle className="h-4 w-4 mr-2" />
                Private Chat
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Private Chat</DialogTitle>
              </DialogHeader>
              {selectedUser ? (
                <PrivateChat userId={selectedUser.id} userName={selectedUser.name} />
              ) : (
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users..."
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <ScrollArea className="h-64">
                    {filteredUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center gap-3 p-3 hover:bg-muted rounded-lg cursor-pointer"
                        onClick={() => {
                          setSelectedUser(user);
                        }}
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>
                            {user.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-muted-foreground capitalize">
                            {user.role}
                          </p>
                        </div>
                      </div>
                    ))}
                  </ScrollArea>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Create Post */}
          <Card>
            <CardHeader>
              <CardTitle>Create a Post</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>
                    {user?.name?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-3">
                  <Textarea
                    placeholder="What's on your mind?"
                    value={newPost}
                    onChange={(e) => setNewPost(e.target.value)}
                    rows={3}
                  />
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-muted-foreground">
                      Share your thoughts with the class
                    </div>
                    <Button onClick={handleCreatePost}>
                      <Send className="h-4 w-4 mr-2" />
                      Post
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Course Discussion */}
          <ChatDiscussion courseId="course-123" />
        </div>

        {/* Users List */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Class Participants</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-2 hover:bg-muted rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {user.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{user.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {user.role}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedUser(user);
                        setIsPrivateChatOpen(true);
                      }}
                    >
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}