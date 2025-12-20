import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import SocketClient from "@/lib/socket";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  Image as ImageIcon,
  MicOff,
  Bell,
  MessageCircle,
  Users,
  Plus,
  Loader2
} from "lucide-react";
import { VideoCallModal } from "@/components/video-call-modal";
import { CallModal } from "@/components/call-modal";
import type { MessageWithFile, User, Group } from "@shared/schema";
import { useWebRTC } from "@/hooks/useWebRTC";
import { NotificationBell } from "@/components/notification-bell";
import { CreateGroupModal } from "@/components/chat/create-group-modal";
import { format } from "date-fns";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

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
  groupId?: string;
  content: string;
  timestamp: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
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
  const [activeChat, setActiveChat] = useState<"course" | "private" | "group">("course");
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [isCalling, setIsCalling] = useState(false);
  const [callType, setCallType] = useState<'voice' | 'video' | null>(null);
  const [isSharingScreen, setIsSharingScreen] = useState(false);
  const [incomingCall, setIncomingCall] = useState<{callerId: string, callType: 'voice' | 'video'} | null>(null);
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [callError, setCallError] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Refs for socket listeners
  const socketRef = useRef<typeof SocketClient | null>(null);

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
    enabled: !!courseId && !!user
  });

  // Fetch groups
  const { data: groups = [], isLoading: groupsLoading } = useQuery<Group[]>({
    queryKey: ["/api/groups"],
    enabled: !!user
  });

  // Fetch messages based on active chat type
  const { data: messages = [], isLoading: messagesLoading } = useQuery<ChatMessage[]>({
    queryKey: ["messages", courseId, activeChat, selectedParticipant?.id, selectedGroup?.id],
    queryFn: async () => {
      let url = "";
      if (activeChat === "course") {
        url = `/api/messages/course/${courseId}`;
      } else if (activeChat === "private" && selectedParticipant) {
        url = `/api/messages/direct/${selectedParticipant.id}`;
      } else if (activeChat === "group" && selectedGroup) {
        url = `/api/messages/group/${selectedGroup.id}`;
      }
      
      if (!url) return [];

      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch messages");
      const data = await response.json();
      return data; // Return all messages, assuming pagination handles it or limits it
    },
    enabled: !!courseId && !!user && (activeChat === "course" || (activeChat === "private" && !!selectedParticipant) || (activeChat === "group" && !!selectedGroup)),
    refetchInterval: 5000, // Poll every 5 seconds as backup
  });

  // Initialize Socket.IO connection
  useEffect(() => {
    if (!user || !courseId) return;

    const initSocket = async () => {
      try {
        await SocketClient.connect();
        socketRef.current = SocketClient;
        
        // Register user
        SocketClient.emit('message', {
          type: 'REGISTER_USER',
          userId: user.id,
          courseId: courseId
        });

        // Listeners
        const onReceiveMessage = (message: ChatMessage) => {
          queryClient.invalidateQueries({ queryKey: ["messages"] });
          scrollToBottom();
        };
        const onTypingStatus = (data: { userId: string, isTyping: boolean }) => {
          if (data.userId !== user.id) {
            setTypingUser(data.isTyping ? data.userId : null);
          }
        };
        const onCallInvite = (data: any) => handleIncomingCall(data);

        SocketClient.on('receive_message', onReceiveMessage);
        SocketClient.on('typing_status', onTypingStatus);
        SocketClient.on('CALL_INVITE', onCallInvite);
        SocketClient.on('CALL_ACCEPTED', () => { setIsCalling(false); setIsCallModalOpen(true); });
        SocketClient.on('CALL_DECLINED', () => { setIsCalling(false); setCallError("Call declined"); });
        SocketClient.on('CALL_ENDED', () => { setIsCallModalOpen(false); setIsCalling(false); });

        (socketRef as any).currentListeners = { onReceiveMessage, onTypingStatus, onCallInvite };
      } catch (error) {
        console.error("Socket error:", error);
      }
    };

    initSocket();

    return () => {
      if (socketRef.current) {
        const listeners = (socketRef as any).currentListeners;
        if (listeners) {
          socketRef.current.off('receive_message', listeners.onReceiveMessage);
          socketRef.current.off('typing_status', listeners.onTypingStatus);
          socketRef.current.off('CALL_INVITE', listeners.onCallInvite);
        }
      }
    };
  }, [user, courseId, queryClient]);

  // Scroll to bottom
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, activeChat]);

  // Typing indicator logic
  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    
    if (!isTyping) {
      setIsTyping(true);
      emitTypingStatus(true);
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      emitTypingStatus(false);
    }, 2000);
  };

  const emitTypingStatus = (isTyping: boolean) => {
    if (!socketRef.current || !user) return;

    const payload: any = {
      type: 'TYPING',
      senderId: user.id,
      isTyping
    };

    if (activeChat === 'group' && selectedGroup) {
      payload.groupId = selectedGroup.id;
    } else if (activeChat === 'private' && selectedParticipant) {
      payload.receiverId = selectedParticipant.id;
    } else {
      payload.courseId = courseId;
    }

    socketRef.current.emit('message', payload);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() && !fileInputRef.current?.files?.length) return;
    if (!user || !courseId) return;

    try {
      const messagePayload: any = {
        type: 'send_message',
        senderId: user.id,
        content: newMessage,
        senderName: user.name
      };

      if (activeChat === "course") {
        messagePayload.courseId = courseId;
      } else if (activeChat === "private" && selectedParticipant) {
        messagePayload.receiverId = selectedParticipant.id;
      } else if (activeChat === "group" && selectedGroup) {
        messagePayload.groupId = selectedGroup.id;
      }

      SocketClient.emit('message', messagePayload);
      setNewMessage("");
      setIsTyping(false);
      emitTypingStatus(false);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/chat/upload', {
        method: 'POST',
        body: formData
      });
      
      if (!res.ok) throw new Error("Upload failed");
      
      const data = await res.json();
      
      // Send message with file info
      const messagePayload: any = {
        type: 'send_message',
        senderId: user?.id,
        content: file.name,
        senderName: user?.name,
        fileUrl: data.url,
        fileName: data.fileName,
        fileType: data.fileType,
        fileSize: data.fileSize
      };

      if (activeChat === "course") {
        messagePayload.courseId = courseId;
      } else if (activeChat === "private" && selectedParticipant) {
        messagePayload.receiverId = selectedParticipant.id;
      } else if (activeChat === "group" && selectedGroup) {
        messagePayload.groupId = selectedGroup.id;
      }

      SocketClient.emit('message', messagePayload);
      setShowAttachmentMenu(false);
    } catch (error) {
      console.error("File upload error:", error);
    }
  };

  // Helper to render message content (detect file links)
  const renderMessageContent = (message: ChatMessage) => {
    // Handle file attachments with new schema fields
    if (message.fileUrl) {
      const isImage = message.fileType?.startsWith('image/') || message.fileName?.match(/\.(jpeg|jpg|gif|png)$/i);
      return (
        <div className="flex flex-col gap-2">
          {isImage ? (
             <img src={message.fileUrl} alt={message.fileName} className="max-w-[200px] rounded-lg border cursor-pointer" onClick={() => window.open(message.fileUrl, '_blank')} />
          ) : (
             <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
               <FileText className="h-4 w-4" />
               <a href={message.fileUrl} target="_blank" rel="noopener noreferrer" className="underline text-blue-500 truncate max-w-[150px]">{message.fileName}</a>
             </div>
          )}
          {message.content && message.content !== message.fileName && (
             <p className="text-sm mt-1">{message.content}</p>
          )}
        </div>
      );
    }

    // Backward compatibility for existing messages using [FILE] format
    if (message.content.startsWith("[FILE]")) {
      const match = message.content.match(/\[FILE\](.*)\|(.*)\[\/FILE\]/);
      if (match) {
        const [_, url, name] = match;
        const isImage = url.match(/\.(jpeg|jpg|gif|png)$/i);
        return (
          <div className="flex flex-col gap-2">
            {isImage ? (
               <img src={url} alt={name} className="max-w-[200px] rounded-lg border" />
            ) : (
               <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                 <FileText className="h-4 w-4" />
                 <a href={url} target="_blank" rel="noopener noreferrer" className="underline text-blue-500 truncate max-w-[150px]">{name}</a>
               </div>
            )}
          </div>
        );
      }
    }
    return <p className="text-sm">{message.content}</p>;
  };

  const handleIncomingCall = (data: any) => {
    setIncomingCall({ callerId: data.callerId, callType: data.callType });
    setIsCallModalOpen(true);
  };

  const filteredParticipants = participants 
    ? [...(participants.teacher ? [participants.teacher] : []), ...participants.students]
        .filter(participant => participant.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : [];

  const getInitials = (name: string) => name.substring(0, 2).toUpperCase();

  return (
    <div className="flex h-full bg-background overflow-hidden">
      {/* Sidebar */}
      <div className="w-80 border-r flex flex-col bg-card">
        {/* Header */}
        <div className="p-4 border-b bg-muted/30">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold">Chat</h1>
            <div className="flex items-center gap-2">
              <NotificationBell />
              {user?.role === 'teacher' && <CreateGroupModal />}
            </div>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search..."
              className="pl-10 bg-background"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        {/* Chat list */}
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {/* Course Chat */}
            <div 
              className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                activeChat === "course" ? "bg-accent text-accent-foreground" : "hover:bg-muted"
              }`}
              onClick={() => { setActiveChat("course"); setSelectedParticipant(null); setSelectedGroup(null); }}
            >
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary/10 text-primary">
                  <MessageCircle className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="font-medium">Course Chat</div>
                <div className="text-xs text-muted-foreground truncate">General discussion</div>
              </div>
            </div>

            {/* Groups */}
            <div className="pt-2 pb-1 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Groups
            </div>
            {groups.map((group) => (
              <div
                key={group.id}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                  activeChat === "group" && selectedGroup?.id === group.id
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-muted"
                }`}
                onClick={() => {
                  setActiveChat("group");
                  setSelectedGroup(group);
                  setSelectedParticipant(null);
                }}
              >
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    <Users className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{group.name}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    Group
                  </div>
                </div>
              </div>
            ))}

            {/* Direct Messages */}
            <div className="pt-2 pb-1 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Direct Messages
            </div>
            {filteredParticipants.map((participant) => (
              <div
                key={participant.id}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                  activeChat === "private" && selectedParticipant?.id === participant.id
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-muted"
                }`}
                onClick={() => {
                  setActiveChat("private");
                  setSelectedParticipant(participant);
                  setSelectedGroup(null);
                }}
              >
                <Avatar className="h-10 w-10">
                  {participant.profileImage ? (
                    <AvatarImage src={participant.profileImage} />
                  ) : (
                    <AvatarFallback>
                      {getInitials(participant.name)}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate flex items-center gap-2">
                    {participant.name}
                    {participant.role === "teacher" && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                        Teacher
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <span className={`h-2 w-2 rounded-full ${participant.isOnline ? "bg-green-500" : "bg-gray-300"}`} />
                    {participant.isOnline ? "Online" : "Offline"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
      
      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#f0f2f5] dark:bg-zinc-900">
        {/* Chat Header */}
        <div className="h-16 border-b bg-background flex items-center px-4 justify-between shadow-sm z-10">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback>
                {activeChat === "course" ? <MessageCircle /> : 
                 activeChat === "group" ? <Users /> : 
                 getInitials(selectedParticipant?.name || "?")}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="font-semibold">
                {activeChat === "course" ? "Course Chat" : 
                 activeChat === "group" ? selectedGroup?.name : 
                 selectedParticipant?.name}
              </h2>
              {typingUser && (
                <p className="text-xs text-green-600 font-medium animate-pulse">Typing...</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {activeChat === "private" && (
              <>
                <Button variant="ghost" size="icon" onClick={() => startAudioCall()}>
                  <Phone className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => startVideoCall()}>
                  <Video className="h-5 w-5" />
                </Button>
              </>
            )}
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-hidden relative">
          <div className="absolute inset-0 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] opacity-5 pointer-events-none"></div>
          <ScrollArea className="h-full p-4">
            <div className="space-y-4 max-w-3xl mx-auto pb-4">
              {messages.map((message) => {
                const isMe = message.senderId === user?.id;
                return (
                  <div
                    key={message.id}
                    className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg px-4 py-2 shadow-sm ${
                        isMe
                          ? "bg-primary text-primary-foreground rounded-tr-none"
                          : "bg-background rounded-tl-none"
                      }`}
                    >
                      {!isMe && (
                        <div className="text-xs font-bold opacity-70 mb-1">
                          {message.senderName}
                        </div>
                      )}
                      <div className="break-words">
                        {renderMessageContent(message)}
                      </div>
                      <div className={`text-[10px] mt-1 text-right ${isMe ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                        {format(new Date(message.timestamp), "h:mm a")}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        </div>

        {/* Input Area */}
        <div className="p-3 bg-background border-t">
          <form 
            className="max-w-3xl mx-auto flex items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
          >
             <DropdownMenu open={showAttachmentMenu} onOpenChange={setShowAttachmentMenu}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground hover:text-foreground">
                  <Paperclip className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Photos & Videos
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                  <FileText className="h-4 w-4 mr-2" />
                  Document
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleFileUpload} 
              accept="image/*,.pdf,.doc,.docx"
            />

            <div className="flex-1 bg-muted rounded-2xl flex items-center px-4 py-2 min-h-[44px]">
              <Input
                value={newMessage}
                onChange={handleTyping}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Type a message..."
                className="border-none bg-transparent shadow-none focus-visible:ring-0 p-0 h-auto max-h-32 min-h-[24px]"
              />
            </div>

            <Button 
              type="submit"
              disabled={!newMessage.trim() && !fileInputRef.current?.files?.length}
              size="icon"
              className="shrink-0 rounded-full h-11 w-11"
            >
              <Send className="h-5 w-5" />
            </Button>
          </form>
        </div>
      </div>

      {/* Call Modals */}
      {isCallModalOpen && (
        <CallModal
          isOpen={isCallModalOpen}
          onClose={() => {
            setIsCallModalOpen(false);
            setIsCalling(false);
            endCall();
          }}
          callType={(callType === 'voice' ? 'audio' : callType === 'video' ? 'video' : 'audio')}
          participants={Object.values(peers)}
          localStream={localStream}
          isAudioEnabled={isAudioEnabled}
          isVideoEnabled={isVideoEnabled}
          onToggleAudio={toggleAudio}
          onToggleVideo={toggleVideo}
          onEndCall={() => {
            endCall();
            setIsCalling(false);
            setIsCallModalOpen(false);
          }}
        />
      )}
    </div>
  );
}
