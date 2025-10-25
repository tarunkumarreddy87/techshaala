import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Send } from "lucide-react";
import { useAuth } from "../lib/auth-context";

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
}

interface PrivateChatProps {
  userId: string;
  userName: string;
}

export function PrivateChat({ userId, userName }: PrivateChatProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState("");

  // Fetch private messages
  const { data: messages = [], isLoading } = useQuery<Message[]>({
    queryKey: ["private-messages", userId],
    queryFn: async () => {
      const response = await fetch(`/api/messages/between/${user?.id}/${userId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch messages");
      }
      return response.json();
    },
    enabled: !!user?.id && !!userId,
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          senderId: user.id,
          receiverId: userId,
          content: newMessage,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const newMessageData = await response.json();
      
      // Update the query cache with the new message
      queryClient.setQueryData<Message[]>(
        ["private-messages", userId],
        (oldMessages = []) => [...oldMessages, newMessageData]
      );

      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (isLoading) {
    return <div>Loading messages...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Chat with {userName}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <ScrollArea className="h-64 rounded-md border p-4">
            {messages.length === 0 ? (
              <p className="text-center text-muted-foreground">No messages yet. Start a conversation!</p>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div 
                    key={message.id} 
                    className={`flex gap-3 ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.senderId !== user?.id && (
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {message.senderName?.charAt(0).toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div className={`max-w-xs rounded-lg px-3 py-2 ${
                      message.senderId === user?.id 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted'
                    }`}>
                      <p className="text-sm">{message.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(message.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    {message.senderId === user?.id && (
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {message.senderName?.charAt(0).toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                    )}

                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
          <div className="flex gap-2">
            <Input
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <Button onClick={handleSendMessage} size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}