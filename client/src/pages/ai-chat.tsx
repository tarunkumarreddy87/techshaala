import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Image as ImageIcon, Bot, User, Loader2, BrainCircuit, X, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Course, AiPrompt } from "@shared/schema";

interface Message {
  role: "user" | "model";
  content: string;
  image?: string; // local preview url
}

export default function AiChat() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "model",
      content: "Hello! I'm your AI learning assistant. How can I help you with your studies today?",
    }
  ]);
  const [input, setInput] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string>("general");
  const [selectedPrompt, setSelectedPrompt] = useState<string>("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Fetch courses to use as subjects
  const { data: courses } = useQuery<Course[]>({ 
    queryKey: ["/api/courses"],
  });

  // Fetch prompts for selected subject
  const { data: prompts } = useQuery<AiPrompt[]>({
    queryKey: ["/api/prompts", selectedSubject],
    queryFn: async () => {
        if (selectedSubject === "general") return [];
        const res = await apiRequest("GET", `/api/prompts?subject=${encodeURIComponent(selectedSubject)}`);
        return res.json();
    },
    enabled: selectedSubject !== "general",
  });

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const chatMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await apiRequest("POST", "/api/ai/chat", data);
      return res.json();
    },
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        { role: "model", content: data.response }
      ]);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to get response from AI.",
        variant: "destructive",
      });
    },
  });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith("image/")) {
        toast({
            title: "Invalid file",
            description: "Please upload an image file.",
            variant: "destructive"
        });
        return;
      }
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  const handlePromptSelect = (promptId: string) => {
    const prompt = prompts?.find(p => p.id === promptId);
    if (prompt) {
        setSelectedPrompt(promptId);
        // We don't set input here, we send the system instruction with the message
        toast({
            title: "Prompt Selected",
            description: `Using prompt: ${prompt.title}`,
        });
    }
  };

  const handleSend = () => {
    if ((!input.trim() && !selectedImage) || chatMutation.isPending) return;

    const userMessage: Message = {
      role: "user",
      content: input,
      image: imagePreview || undefined
    };

    setMessages((prev) => [...prev, userMessage]);
    
    // Prepare history for backend (exclude current message, and format correctly)
    const history = messages.map(m => ({
        role: m.role,
        parts: m.content
    }));

    const formData = new FormData();
    formData.append("message", input);
    formData.append("history", JSON.stringify(history));
    if (selectedImage) {
      formData.append("image", selectedImage);
    }
    
    // Add system instruction if a prompt is selected
    if (selectedPrompt && prompts) {
        const prompt = prompts.find(p => p.id === selectedPrompt);
        if (prompt) {
            formData.append("systemInstruction", prompt.content);
        }
    }

    setInput("");
    clearImage();
    chatMutation.mutate(formData);
  };

  return (
    <div className="container mx-auto p-4 h-[calc(100vh-4rem)] flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BrainCircuit className="h-6 w-6 text-primary" />
            AI Assistant
          </h1>
          <p className="text-muted-foreground text-sm">
            Ask questions, upload images for analysis, or get help with your studies.
          </p>
        </div>
        
        <div className="flex gap-2 w-full sm:w-auto">
            <Select value={selectedSubject} onValueChange={(val) => {
                setSelectedSubject(val);
                setSelectedPrompt(""); // Reset prompt when subject changes
            }}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select Subject" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="general">General Chat</SelectItem>
                    {courses?.map(course => (
                        <SelectItem key={course.id} value={course.title}>
                            {course.title}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {selectedSubject !== "general" && (
                <Select value={selectedPrompt} onValueChange={handlePromptSelect}>
                    <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Select Prompt Template" />
                    </SelectTrigger>
                    <SelectContent>
                        {prompts?.length === 0 ? (
                            <SelectItem value="none" disabled>No prompts available</SelectItem>
                        ) : (
                            prompts?.map(prompt => (
                                <SelectItem key={prompt.id} value={prompt.id}>
                                    {prompt.title}
                                </SelectItem>
                            ))
                        )}
                    </SelectContent>
                </Select>
            )}
        </div>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden shadow-md">
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 ${
                  msg.role === "user" ? "flex-row-reverse" : "flex-row"
                }`}
              >
                <Avatar className="h-8 w-8 mt-1">
                  {msg.role === "user" ? (
                    <>
                        <AvatarImage src={user?.profileImage || undefined} />
                        <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                    </>
                  ) : (
                    <AvatarFallback className="bg-primary text-primary-foreground">
                        <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  )}
                </Avatar>
                
                <div
                  className={`flex flex-col gap-2 max-w-[80%] ${
                    msg.role === "user" ? "items-end" : "items-start"
                  }`}
                >
                  <div
                    className={`rounded-lg p-3 text-sm whitespace-pre-wrap ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    {msg.image && (
                        <div className="mb-2">
                            <img src={msg.image} alt="User upload" className="rounded-md max-w-full max-h-[200px] object-cover" />
                        </div>
                    )}
                    {msg.content}
                  </div>
                </div>
              </div>
            ))}
            {chatMutation.isPending && (
              <div className="flex gap-3">
                 <Avatar className="h-8 w-8 mt-1">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                        <Bot className="h-4 w-4" />
                    </AvatarFallback>
                </Avatar>
                <div className="bg-muted rounded-lg p-3 flex items-center">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        <div className="p-4 bg-background border-t">
            {imagePreview && (
                <div className="mb-2 relative inline-block">
                    <img src={imagePreview} alt="Preview" className="h-20 w-20 object-cover rounded-md border" />
                    <button 
                        onClick={clearImage}
                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 shadow-sm hover:bg-destructive/90"
                    >
                        <X className="h-3 w-3" />
                    </button>
                </div>
            )}
          <div className="flex gap-2">
            <div className="relative">
                <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id="image-upload"
                    onChange={handleImageSelect}
                />
                <Button
                    variant="outline"
                    size="icon"
                    className="shrink-0"
                    onClick={() => document.getElementById("image-upload")?.click()}
                >
                    <ImageIcon className="h-4 w-4 text-muted-foreground" />
                </Button>
            </div>
            
            <Input
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              className="flex-1"
            />
            
            <Button onClick={handleSend} disabled={(!input.trim() && !selectedImage) || chatMutation.isPending}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
