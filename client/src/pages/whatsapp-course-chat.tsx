import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import SocketClient from "@/lib/socket";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Search, 
  Send, 
  Phone, 
  Video, 
  MoreVertical, 
  Check, 
  Paperclip, 
  Smile, 
  Mic, 
  ScreenShare, 
  FileText,
  Image,
  MicOff,
  Bell,
  MessageCircle
} from "lucide-react";
import { VideoCallModal } from "@/components/video-call-modal";
import { CallModal } from "@/components/call-modal";
import type { MessageWithFile, User } from "@shared/schema";
import { useWebRTC } from "@/hooks/useWebRTC";
import { NotificationBell } from "@/components/notification-bell";

interface Participant {
  id: string;
  name: string;
  role: string;
  profileImage?: string;
  isOnline?: boolean;
}

interface ParticipantsData {
  teacher: Participant | null;
  students: Participant[];
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  courseId?: string;
  receiverId?: string;
  content: string;
  timestamp: string;
}

export default function WhatsAppCourseChat() {
  const { user } = useAuth();
  const [location] = useLocation();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [activeChat, setActiveChat] = useState<"course" | "private">("course");
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [isCalling, setIsCalling] = useState(false);
  const [callType, setCallType] = useState<'voice' | 'video' | null>(null);
  const [isSharingScreen, setIsSharingScreen] = useState(false);
  const [incomingCall, setIncomingCall] = useState<{callerId: string, callType: 'voice' | 'video'} | null>(null);
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [callError, setCallError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Refs for socket listeners
  const receiveMessageListener = useRef<Function | null>(null);
  const messageSentListener = useRef<Function | null>(null);
  const receivePrivateMessageListener = useRef<Function | null>(null);
  const privateMessageSentListener = useRef<Function | null>(null);
  const callInviteListener = useRef<Function | null>(null);
  const callAcceptListener = useRef<Function | null>(null);
  const callDeclineListener = useRef<Function | null>(null);
  const callEndListener = useRef<Function | null>(null);
  const errorListener = useRef<Function | null>(null);

  // Extract courseId from the location path
  const extractCourseId = () => {
    const pathParts = location.split('/');
    if (pathParts.length >= 4 && (pathParts[1] === 'student' || pathParts[1] === 'teacher') && pathParts[2] === 'course-chat') {
      return pathParts[3];
    }
    return null;
  };

  const courseId = extractCourseId();
  
  // Initialize WebRTC only if we have the required data
  const webRTC = courseId && user ? useWebRTC(courseId, user.id, user.name) : null;
  const {
    peers,
    localStream,
    isCallActive,
    callType: webRTCCallType,
    isAudioEnabled,
    isVideoEnabled,
    startAudioCall,
    startVideoCall,
    startScreenShare,
    toggleAudio,
    toggleVideo,
    endCall
  } = webRTC || {
    peers: {},
    localStream: null,
    isCallActive: false,
    callType: null,
    isAudioEnabled: true,
    isVideoEnabled: true,
    startAudioCall: async () => {},
    startVideoCall: async () => {},
    startScreenShare: async () => {},
    toggleAudio: () => {},
    toggleVideo: () => {},
    endCall: () => {}
  };

  // Debugging: log the location and extracted courseId
  useEffect(() => {
    console.log("Current location:", location);
    console.log("Extracted courseId:", courseId);
  }, [location, courseId]);

  // If courseId is not provided, show an error message
  if (!courseId) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Course Not Found</h2>
          <p className="text-muted-foreground mb-4">Please access the course chat from a specific course page.</p>
          <Button onClick={() => window.location.href = user?.role === "student" ? "/student/courses" : "/teacher/courses"}>
            Back to Courses
          </Button>
        </div>
      </div>
    );
  }

  // Fetch course participants
  const { data: participants, isLoading: participantsLoading } = useQuery<ParticipantsData>({
    queryKey: [`/api/courses/${courseId}/participants`],
    queryFn: async () => {
      const response = await fetch(`/api/courses/${courseId}/participants`);
      if (!response.ok) {
        throw new Error("Failed to fetch participants");
      }
      return await response.json();
    },
    enabled: !!courseId && !!user
  });

  // Fetch messages based on active chat type
  const { data: messages = [], isLoading: messagesLoading } = useQuery<ChatMessage[]>({
    queryKey: ["messages", courseId, activeChat, selectedParticipant?.id, user?.id],
    queryFn: async () => {
      if (activeChat === "course") {
        // Fetch course messages
        const response = await fetch(`/api/messages/course/${courseId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch course messages");
        }
        const messages = await response.json();
        // Return only the last 50 messages for performance
        return messages.slice(-50);
      } else if (activeChat === "private" && selectedParticipant && user) {
        // Fetch private messages between current user and selected participant
        const response = await fetch(`/api/messages/between/${user.id}/${selectedParticipant.id}`);
        if (!response.ok) {
          throw new Error("Failed to fetch private messages");
        }
        const messages = await response.json();
        // Return only the last 50 messages for performance
        return messages.slice(-50);
      }
      return [];
    },
    enabled: !!courseId && !!user && (activeChat === "course" || (activeChat === "private" && !!selectedParticipant)),
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  // Initialize Socket.IO connection
  useEffect(() => {
    if (!user || !courseId) return;

    const initSocket = async () => {
      try {
        // Connect to Socket.IO server
        await SocketClient.connect();
        
        // Register user with the Socket.IO server
        SocketClient.emit('message', {
          type: 'REGISTER_USER',
          userId: user.id,
          courseId: courseId
        });

        // Listen for new messages
        receiveMessageListener.current = (message: ChatMessage) => {
          // Add new message to the query cache
          queryClient.setQueryData<ChatMessage[]>(
            ["messages", courseId, "course", undefined, user?.id], 
            (oldMessages = []) => {
              // Check if message already exists to avoid duplicates
              if (!oldMessages.some(msg => msg.id === message.id)) {
                return [...oldMessages, message];
              }
              return oldMessages;
            }
          );
          
          // Scroll to bottom if we're in the course chat
          if (activeChat === "course") {
            scrollToBottom();
          }
        };
        SocketClient.on('receive_message', receiveMessageListener.current);

        // Listen for message sent confirmation
        messageSentListener.current = (message: ChatMessage) => {
          // Add sent message to the query cache
          queryClient.setQueryData<ChatMessage[]>(
            ["messages", courseId, "course", undefined, user?.id], 
            (oldMessages = []) => {
              // Check if message already exists to avoid duplicates
              if (!oldMessages.some(msg => msg.id === message.id)) {
                return [...oldMessages, message];
              }
              return oldMessages;
            }
          );
          
          // Clear input
          setNewMessage("");
          
          // Scroll to bottom if we're in the course chat
          if (activeChat === "course") {
            scrollToBottom();
          }
        };
        SocketClient.on('message_sent', messageSentListener.current);

        // Listen for private messages
        receivePrivateMessageListener.current = (message: ChatMessage) => {
          // Only process if we're in a private chat with the sender
          if (activeChat === "private" && selectedParticipant && 
              (message.senderId === selectedParticipant.id || message.senderId === user?.id)) {
            // Add new private message to the query cache
            queryClient.setQueryData<ChatMessage[]>(
              ["messages", courseId, "private", selectedParticipant.id, user?.id], 
              (oldMessages = []) => {
                // Check if message already exists to avoid duplicates
                if (!oldMessages.some(msg => msg.id === message.id)) {
                  return [...oldMessages, message];
                }
                return oldMessages;
              }
            );
            
            // Scroll to bottom
            scrollToBottom();
          }
        };
        SocketClient.on('receive_private_message', receivePrivateMessageListener.current);

        // Listen for private message sent confirmation
        privateMessageSentListener.current = (message: ChatMessage) => {
          // Only process if we're in a private chat with the receiver
          if (activeChat === "private" && selectedParticipant && 
              message.senderId === user?.id && message.receiverId === selectedParticipant.id) {
            // Add sent private message to the query cache
            queryClient.setQueryData<ChatMessage[]>(
              ["messages", courseId, "private", selectedParticipant.id, user?.id], 
              (oldMessages = []) => {
                // Check if message already exists to avoid duplicates
                if (!oldMessages.some(msg => msg.id === message.id)) {
                  return [...oldMessages, message];
                }
                return oldMessages;
              }
            );
            
            // Clear input
            setNewMessage("");
            
            // Scroll to bottom
            scrollToBottom();
          }
        };
        SocketClient.on('private_message_sent', privateMessageSentListener.current);

        // Listen for call invitations
        callInviteListener.current = (data: any) => {
          handleIncomingCall(data);
        };
        SocketClient.on('CALL_INVITE', callInviteListener.current);

        // Listen for call acceptance
        callAcceptListener.current = (data: any) => {
          handleCallAccepted(data);
        };
        SocketClient.on('CALL_ACCEPTED', callAcceptListener.current);

        // Listen for call decline
        callDeclineListener.current = (data: any) => {
          handleCallDeclined(data);
        };
        SocketClient.on('CALL_DECLINED', callDeclineListener.current);

        // Listen for call ended
        callEndListener.current = () => {
          handleCallEnded();
        };
        SocketClient.on('CALL_ENDED', callEndListener.current);

        // Listen for errors
        errorListener.current = (error: { message: string }) => {
          console.error("Socket.IO error:", error.message);
        };
        SocketClient.on('error', errorListener.current);

      } catch (error) {
        console.error("Failed to connect to Socket.IO:", error);
      }
    };

    initSocket();

    // Clean up Socket.IO connection on unmount
    return () => {
      if (receiveMessageListener.current) SocketClient.off('receive_message', receiveMessageListener.current);
      if (messageSentListener.current) SocketClient.off('message_sent', messageSentListener.current);
      if (receivePrivateMessageListener.current) SocketClient.off('receive_private_message', receivePrivateMessageListener.current);
      if (privateMessageSentListener.current) SocketClient.off('private_message_sent', privateMessageSentListener.current);
      if (callInviteListener.current) SocketClient.off('CALL_INVITE', callInviteListener.current);
      if (callAcceptListener.current) SocketClient.off('CALL_ACCEPTED', callAcceptListener.current);
      if (callDeclineListener.current) SocketClient.off('CALL_DECLINED', callDeclineListener.current);
      if (callEndListener.current) SocketClient.off('CALL_ENDED', callEndListener.current);
      if (errorListener.current) SocketClient.off('error', errorListener.current);
    };
  }, [user, courseId, queryClient, activeChat, selectedParticipant]);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Filter participants based on search term
  const filteredParticipants = participants 
    ? [...(participants.teacher ? [participants.teacher] : []), ...participants.students]
        .filter(participant => 
          participant.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
    : [];

  // Function to start a private chat with a participant
  const startPrivateChat = (participant: Participant) => {
    setActiveChat("private");
    setSelectedParticipant(participant);
    setSearchTerm(""); // Clear search term
  };

  // Function to go back to course chat
  const goToCourseChat = () => {
    setActiveChat("course");
    setSelectedParticipant(null);
  };

  const getInitials = (name: string | undefined | null) => {
    if (!name) return "??";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user || !courseId) return;

    try {
      if (activeChat === "course") {
        // Send group message through Socket.IO
        SocketClient.emit('message', {
          type: 'send_message',
          senderId: user.id,
          courseId: courseId,
          content: newMessage,
          senderName: user.name
        });
      } else if (activeChat === "private" && selectedParticipant) {
        // Send private message through Socket.IO
        SocketClient.emit('message', {
          type: 'send_private_message',
          senderId: user.id,
          receiverId: selectedParticipant.id,
          content: newMessage,
          senderName: user.name
        });
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleIncomingCall = (data: any) => {
    setIncomingCall({
      callerId: data.callerId,
      callType: data.callType
    });
    setIsCallModalOpen(true);
  };

  const handleCallAccepted = (data: any) => {
    setIsCalling(false);
    setIsCallModalOpen(true);
  };

  const handleCallDeclined = (data: any) => {
    setIsCalling(false);
    setCallError("Call was declined");
    setTimeout(() => setCallError(null), 3000);
  };

  const handleCallEnded = () => {
    setIsCallModalOpen(false);
    setIsCalling(false);
  };

  const startCall = async (type: 'voice' | 'video') => {
    if (!selectedParticipant) return;
    
    setCallType(type);
    setIsCalling(true);
    
    // Send call invite through Socket.IO
    SocketClient.emit('message', {
      type: 'CALL_INVITE',
      callerId: user?.id,
      calleeId: selectedParticipant.id,
      callType: type,
      callerName: user?.name
    });
    
    // Send notification
    SocketClient.emit('message', {
      type: 'NEW_NOTIFICATION',
      notification: {
        type: 'call_invite',
        title: `${type === 'video' ? 'Video' : 'Voice'} Call`,
        message: `Incoming call from ${user?.name}`,
        callerId: user?.id,
        calleeId: selectedParticipant.id,
        callType: type
      }
    });
  };

  return (
    <div className="flex h-full bg-background">
      {/* Sidebar */}
      <div className="w-1/3 border-r flex flex-col">
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold">Chat</h1>
            <div className="flex items-center gap-2">
              <NotificationBell />
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </div>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search or start new chat"
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        {/* Chat list */}
        <ScrollArea className="flex-1">
          {participantsLoading ? (
            <div className="space-y-2 p-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3 p-3">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Course chat */}
              <div 
                className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-muted ${
                  activeChat === "course" ? "bg-muted" : ""
                }`}
                onClick={goToCourseChat}
              >
                <Avatar>
                  <AvatarFallback>
                    <MessageCircle className="h-6 w-6" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-medium">Course Chat</div>
                  <div className="text-sm text-muted-foreground truncate">
                    Group discussion
                  </div>
                </div>
              </div>
              
              {/* Private chats */}
              {filteredParticipants.map((participant) => (
                <div 
                  key={participant.id}
                  className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-muted ${
                    activeChat === "private" && selectedParticipant?.id === participant.id ? "bg-muted" : ""
                  }`}
                  onClick={() => startPrivateChat(participant)}
                >
                  <Avatar>
                    <AvatarFallback>{getInitials(participant.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{participant.name}</div>
                    <div className="text-sm text-muted-foreground truncate">
                      {participant.role}
                    </div>
                  </div>
                  {participant.isOnline && (
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  )}
                </div>
              ))}
            </>
          )}
        </ScrollArea>
      </div>
      
      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
        {/* Chat header */}
        <div className="p-4 border-b flex items-center justify-between">
          {activeChat === "course" ? (
            <>
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback>
                    <MessageCircle className="h-6 w-6" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-semibold">Course Chat</div>
                  <div className="text-sm text-muted-foreground">
                    {participants?.students.length || 0} participants
                  </div>
                </div>
              </div>
            </>
          ) : selectedParticipant ? (
            <>
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback>{getInitials(selectedParticipant.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-semibold">{selectedParticipant.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {selectedParticipant.role}
                    {selectedParticipant.isOnline && (
                      <span className="ml-2 text-green-500">● Online</span>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div>Select a chat</div>
          )}
          
          {activeChat === "private" && selectedParticipant && (
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => startCall('voice')}
              >
                <Phone className="h-5 w-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => startCall('video')}
              >
                <Video className="h-5 w-5" />
              </Button>
            </div>
          )}
        </div>
        
        {/* Messages */}
        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
          {messagesLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-end gap-2">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div 
                  key={message.id} 
                  className={`flex items-end gap-2 ${
                    message.senderId === user?.id ? "justify-end" : ""
                  }`}
                >
                  {message.senderId !== user?.id && (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{getInitials(message.senderName)}</AvatarFallback>
                    </Avatar>
                  )}
                  <div 
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                      message.senderId === user?.id 
                        ? "bg-primary text-primary-foreground rounded-br-sm" 
                        : "bg-muted rounded-bl-sm"
                    }`}
                  >
                    {message.senderId !== user?.id && (
                      <div className="text-xs font-medium mb-1">{message.senderName}</div>
                    )}
                    <div>{message.content}</div>
                    <div 
                      className={`text-xs mt-1 ${
                        message.senderId === user?.id ? "text-primary-foreground/70" : "text-muted-foreground"
                      }`}
                    >
                      {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  {message.senderId === user?.id && (
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>
        
        {/* Message input */}
        <div className="p-4 border-t">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
            >
              <Paperclip className="h-5 w-5" />
            </Button>
            
            <div className="flex-1 relative">
              <Input
                placeholder="Type a message"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <Button 
                variant="ghost" 
                size="icon"
                className="absolute right-2 top-1/2 transform -translate-y-1/2"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              >
                <Smile className="h-5 w-5" />
              </Button>
            </div>
            
            {newMessage.trim() ? (
              <Button size="icon" onClick={handleSendMessage}>
                <Send className="h-5 w-5" />
              </Button>
            ) : isRecording ? (
              <Button 
                size="icon" 
                variant="destructive"
                onClick={() => setIsRecording(false)}
              >
                <MicOff className="h-5 w-5" />
              </Button>
            ) : (
              <Button 
                size="icon" 
                variant="ghost"
                onClick={() => setIsRecording(true)}
              >
                <Mic className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* Video Call Modal */}
      {isCallModalOpen && selectedParticipant && (
        <VideoCallModal
          isOpen={isCallModalOpen}
          onClose={() => {
            setIsCallModalOpen(false);
            setIsCalling(false);
          }}
          callerName={selectedParticipant?.name || "Unknown"}
          callType={callType || 'video'}
          calleeId={selectedParticipant.id}
          onCallEnd={() => {
            // Handle call end
            setIsCallModalOpen(false);
            setIsCalling(false);
          }}
          isCaller={true}
          callerId={user?.id || ""}
        />
      )}
      
      {/* Call Modal for active calls */}
      {isCallActive && webRTCCallType && (
        <CallModal
          isOpen={isCallActive}
          onClose={() => {
            endCall();
            // Notify others that call has ended
            SocketClient.emit('message', {
              type: 'CALL_ENDED',
              userId: user?.id
            });
          }}
          callType={webRTCCallType}
          participants={Object.keys(peers).map(socketId => ({ socketId, userName: 'Participant' }))}
          localStream={localStream}
          isAudioEnabled={isAudioEnabled}
          isVideoEnabled={isVideoEnabled}
          onToggleAudio={toggleAudio}
          onToggleVideo={toggleVideo}
          onEndCall={() => {
            endCall();
            // Notify others that call has ended
            SocketClient.emit('message', {
              type: 'CALL_ENDED',
              userId: user?.id
            });
          }}
        />
      )}
      
      {/* Call error message */}
      {callError && (
        <div className="fixed bottom-4 right-4 bg-destructive text-destructive-foreground px-4 py-2 rounded-lg shadow-lg">
          {callError}
        </div>
      )}
    </div>
  );
}