import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { EmptyState } from "@/components/empty-state";
import { 
  ArrowLeft, 
  BookOpen, 
  Clock, 
  User, 
  Play, 
  List, 
  CheckCircle, 
  Circle, 
  Pause, 
  RotateCcw,
  Volume2,
  Download,
  BookMarked,
  FileText,
  Link,
  Bookmark,
  Search,
  Filter,
  Star,
  Award
} from "lucide-react";
import type { CourseWithTeacher, Chapter as SchemaChapter } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { StatCard } from "@/components/stat-card";

interface Chapter {
  id: number;
  title: string;
  youtubeId: string;
  duration: string;
  completed?: boolean;
}

export default function LearningPage() {
  const { user } = useAuth();
  const [, params] = useRoute("/student/learning/:id");
  const [, setLocation] = useLocation();
  const courseId = params?.id;
  const [activeChapter, setActiveChapter] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [notes, setNotes] = useState("");
  const videoRef = useRef<HTMLIFrameElement>(null);

  const { data: course, isLoading: courseLoading } = useQuery<CourseWithTeacher>({
    queryKey: [`/api/courses/${courseId}`],
    enabled: !!courseId,
  });

  // Mock data for chapters - in a real implementation, this would come from the backend
  const [chapters, setChapters] = useState<Chapter[]>([
    { id: 1, title: "Introduction to the Course", youtubeId: "dQw4w9WgXcQ", duration: "10:30", completed: true },
    { id: 2, title: "Chapter 1: Fundamentals", youtubeId: "dQw4w9WgXcQ", duration: "15:45", completed: false },
    { id: 3, title: "Chapter 2: Advanced Concepts", youtubeId: "dQw4w9WgXcQ", duration: "22:15", completed: false },
    { id: 4, title: "Chapter 3: Practical Applications", youtubeId: "dQw4w9WgXcQ", duration: "18:20", completed: false },
    { id: 5, title: "Chapter 4: Case Studies", youtubeId: "dQw4w9WgXcQ", duration: "25:10", completed: false },
  ]);

  // Mock data for resources
  const resources = [
    { id: 1, title: "Course Syllabus", type: "PDF", size: "2.4 MB" },
    { id: 2, title: "Lecture Notes - Chapter 1", type: "PDF", size: "1.8 MB" },
    { id: 3, title: "Additional Reading Materials", type: "Link", size: "" },
    { id: 4, title: "Practice Exercises", type: "PDF", size: "3.2 MB" },
  ];

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const currentChapter = chapters.find(chapter => chapter.id === activeChapter) || chapters[0];

  // Simulate video progress
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + 1;
          setCurrentTime(Math.floor(newProgress / 100 * duration));
          if (newProgress >= 100) {
            setIsPlaying(false);
            // Mark chapter as completed
            setChapters(prevChapters => 
              prevChapters.map(ch => 
                ch.id === activeChapter ? {...ch, completed: true} : ch
              )
            );
            return 100;
          }
          return newProgress;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying, activeChapter, duration]);

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const resetVideo = () => {
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const markChapterAsCompleted = (chapterId: number) => {
    setChapters(prevChapters => 
      prevChapters.map(ch => 
        ch.id === chapterId ? {...ch, completed: true} : ch
      )
    );
  };

  const markChapterAsIncomplete = (chapterId: number) => {
    setChapters(prevChapters => 
      prevChapters.map(ch => 
        ch.id === chapterId ? {...ch, completed: false} : ch
      )
    );
  };

  const saveNotes = () => {
    // In a real implementation, this would save to the backend
    console.log("Saving notes:", notes);
  };

  // Filter chapters based on search term
  const filteredChapters = chapters.filter(chapter => 
    chapter.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (courseLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="p-6">
        <EmptyState
          icon={BookOpen}
          title="Course not found"
          description="The course you're looking for doesn't exist"
          action={{
            label: "Back to Courses",
            onClick: () => setLocation("/student/courses"),
          }}
        />
      </div>
    );
  }

  const completedChapters = chapters.filter(ch => ch.completed).length;
  const progressPercentage = Math.round((completedChapters / chapters.length) * 100);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation(`/student/course/${courseId}`)}
          className="mb-4"
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Course
        </Button>
        <div className="flex items-center gap-2">
          <BookMarked className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{progressPercentage}% Complete</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-3xl">{course.title}</CardTitle>
                  <CardDescription className="mt-3 text-base">
                    {course.description}
                  </CardDescription>
                </div>
                <BookOpen className="h-8 w-8 text-primary flex-shrink-0" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{course.duration}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs">
                      {getInitials(course.teacher.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span>{course.teacher.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span>{chapters.length} chapters</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="learning" className="space-y-6">
            <TabsList>
              <TabsTrigger value="learning" data-testid="tab-learning">
                Learning
              </TabsTrigger>
              <TabsTrigger value="resources" data-testid="tab-resources">
                Resources
              </TabsTrigger>
              <TabsTrigger value="notes" data-testid="tab-notes">
                Notes
              </TabsTrigger>
            </TabsList>

            <TabsContent value="learning" className="space-y-6">
              {/* Video Player Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Play className="h-5 w-5" />
                    {currentChapter.title}
                  </CardTitle>
                  <CardDescription>
                    Chapter {currentChapter.id} • {currentChapter.duration}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="aspect-video bg-muted rounded-lg overflow-hidden relative">
                    <iframe
                      ref={videoRef}
                      width="100%"
                      height="100%"
                      src={`https://www.youtube.com/embed/${currentChapter.youtubeId}?autoplay=${isPlaying ? 1 : 0}`}
                      title={currentChapter.title}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full"
                    ></iframe>
                    
                    {/* Video Controls Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Button 
                          size="icon" 
                          variant="secondary" 
                          onClick={togglePlayPause}
                          className="h-8 w-8"
                        >
                          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </Button>
                        <Button 
                          size="icon" 
                          variant="secondary" 
                          onClick={resetVideo}
                          className="h-8 w-8"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                        <div className="flex-1 flex items-center gap-2">
                          <div className="text-xs text-white">{formatTime(currentTime)}</div>
                          <div className="flex-1 h-1.5 bg-white/30 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-white rounded-full" 
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                          <div className="text-xs text-white">{currentChapter.duration}</div>
                        </div>
                        <Button size="icon" variant="secondary" className="h-8 w-8">
                          <Volume2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Chapter Actions */}
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-2">
                      {currentChapter.completed ? (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => markChapterAsIncomplete(currentChapter.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                          Completed
                        </Button>
                      ) : (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => markChapterAsCompleted(currentChapter.id)}
                        >
                          <Circle className="h-4 w-4 mr-2" />
                          Mark as Complete
                        </Button>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Bookmark className="h-4 w-4 mr-2" />
                        Bookmark
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="resources" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Learning Resources</CardTitle>
                  <CardDescription>
                    Download additional materials for this course
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {resources.map((resource) => (
                      <div key={resource.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          {resource.type === "Link" ? (
                            <Link className="h-5 w-5 text-blue-500" />
                          ) : (
                            <FileText className="h-5 w-5 text-red-500" />
                          )}
                          <div>
                            <h3 className="font-medium">{resource.title}</h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span>{resource.type}</span>
                              {resource.size && <span>•</span>}
                              <span>{resource.size}</span>
                            </div>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          {resource.type === "Link" ? "View" : "Download"}
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notes" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Your Notes</CardTitle>
                  <CardDescription>
                    Take notes while learning
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Textarea
                      className="w-full min-h-[200px] p-4 border rounded-lg"
                      placeholder="Start taking notes for this chapter..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                    <div className="flex justify-end">
                      <Button onClick={saveNotes}>Save Notes</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar with Chapter List and Progress */}
        <div className="space-y-6">
          {/* Progress Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Course Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <StatCard
                  title="Completed"
                  value={completedChapters}
                  icon={CheckCircle}
                  description="Chapters"
                />
                <StatCard
                  title="Remaining"
                  value={chapters.length - completedChapters}
                  icon={Clock}
                  description="Chapters"
                />
              </div>
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Overall Progress</span>
                  <span className="text-sm text-muted-foreground">{progressPercentage}%</span>
                </div>
                <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full" 
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Chapter List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <List className="h-5 w-5" />
                Course Chapters
              </CardTitle>
              <CardDescription>
                {completedChapters} of {chapters.length} chapters completed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative mb-3">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search chapters..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <ScrollArea className="h-[400px] pr-2">
                <div className="space-y-2">
                  {filteredChapters.map((chapter) => (
                    <Button
                      key={chapter.id}
                      variant={activeChapter === chapter.id ? "default" : "ghost"}
                      className={`w-full justify-between h-auto py-3 px-3 ${activeChapter === chapter.id ? "" : "hover:bg-muted"}`}
                      onClick={() => setActiveChapter(chapter.id)}
                    >
                      <div className="flex items-start gap-2">
                        {chapter.completed ? (
                          <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        ) : (
                          <Circle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                        )}
                        <div className="text-left">
                          <div className="font-medium text-sm">Chapter {chapter.id}</div>
                          <div className="text-xs text-left">{chapter.title}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge variant="secondary" className="text-xs">
                          {chapter.duration}
                        </Badge>
                        {chapter.completed && (
                          <Star className="h-3 w-3 text-yellow-500" />
                        )}
                      </div>
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}