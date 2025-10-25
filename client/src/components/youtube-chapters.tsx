import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { 
  Plus, 
  Trash2, 
  GripVertical, 
  Play,
  Image as ImageIcon
} from "lucide-react";
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragEndEvent
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Chapter } from "@shared/schema";

interface YouTubeChapter extends Chapter {
  thumbnail?: string;
}

interface SortableChapterItemProps {
  chapter: YouTubeChapter;
  onEdit: (id: number, field: keyof YouTubeChapter, value: string) => void;
  onDelete: (id: number) => void;
}

const SortableChapterItem = ({ chapter, onEdit, onDelete }: SortableChapterItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: chapter.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Extract YouTube ID from URL
  const extractYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  // Fetch video title and thumbnail
  useEffect(() => {
    if (chapter.youtubeId && !chapter.title) {
      const fetchVideoInfo = async () => {
        try {
          // In a real implementation, you would call the YouTube API
          // For now, we'll just set a placeholder
          const videoId = extractYouTubeId(`https://www.youtube.com/watch?v=${chapter.youtubeId}`);
          if (videoId) {
            // Set thumbnail
            onEdit(chapter.id, 'thumbnail', `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`);
          }
        } catch (error) {
          console.error("Error fetching video info:", error);
        }
      };

      fetchVideoInfo();
    }
  }, [chapter.youtubeId, chapter.title, onEdit, chapter.id]);

  return (
    <div ref={setNodeRef} style={style} className="mb-3">
      <Card>
        <CardHeader className="py-3 px-4">
          <div className="flex items-center gap-2">
            <div 
              {...attributes} 
              {...listeners} 
              className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-muted"
            >
              <GripVertical className="h-4 w-4" />
            </div>
            <CardTitle className="text-lg flex-1">Chapter {chapter.id}</CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onDelete(chapter.id)}
              className="h-8 w-8 p-0"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor={`chapter-${chapter.id}-title`}>Chapter Name</Label>
            <Input
              id={`chapter-${chapter.id}-title`}
              value={chapter.title}
              onChange={(e) => onEdit(chapter.id, 'title', e.target.value)}
              placeholder="Enter chapter name"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor={`chapter-${chapter.id}-youtube`}>YouTube Link</Label>
            <div className="flex gap-2">
              <Input
                id={`chapter-${chapter.id}-youtube`}
                value={chapter.youtubeId ? `https://www.youtube.com/watch?v=${chapter.youtubeId}` : ''}
                onChange={(e) => {
                  const videoId = extractYouTubeId(e.target.value);
                  if (videoId) {
                    onEdit(chapter.id, 'youtubeId', videoId);
                  } else {
                    onEdit(chapter.id, 'youtubeId', e.target.value);
                  }
                }}
                placeholder="https://www.youtube.com/watch?v=..."
              />
              {chapter.thumbnail && (
                <div className="relative">
                  <ImageIcon className="absolute top-2 right-2 h-4 w-4 text-white bg-black/50 rounded p-1" />
                  <img 
                    src={chapter.thumbnail} 
                    alt="Thumbnail" 
                    className="w-16 h-16 object-cover rounded border"
                  />
                </div>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor={`chapter-${chapter.id}-duration`}>Duration</Label>
            <div className="flex gap-2">
              <Input
                id={`chapter-${chapter.id}-duration`}
                value={chapter.duration}
                onChange={(e) => onEdit(chapter.id, 'duration', e.target.value)}
                placeholder="HH:MM:SS or MM:SS"
                className="flex-1"
              />
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  // In a real implementation, you would fetch the actual duration
                  // For now, we'll just set a placeholder
                  onEdit(chapter.id, 'duration', '10:30');
                }}
              >
                <Play className="h-4 w-4 mr-1" />
                Auto
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

interface YouTubeChaptersProps {
  initialChapters?: Chapter[];
  onChange: (chapters: Chapter[]) => void;
}

export function YouTubeChapters({ initialChapters = [], onChange }: YouTubeChaptersProps) {
  const [chapters, setChapters] = useState<YouTubeChapter[]>(() => {
    return initialChapters.map((chapter, index) => ({
      ...chapter,
      id: chapter.id || index + 1
    }));
  });
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Notify parent of changes
  useEffect(() => {
    onChange(chapters.map(({ thumbnail, ...chapter }) => chapter));
  }, [chapters, onChange]);

  const handleAddChapter = () => {
    const newId = chapters.length > 0 ? Math.max(...chapters.map(c => c.id)) + 1 : 1;
    setChapters([
      ...chapters,
      {
        id: newId,
        title: "",
        youtubeId: "",
        duration: ""
      }
    ]);
  };

  const handleEditChapter = (id: number, field: keyof YouTubeChapter, value: string) => {
    setChapters(chapters.map(chapter => 
      chapter.id === id ? { ...chapter, [field]: value } : chapter
    ));
  };

  const handleDeleteChapter = (id: number) => {
    setChapters(chapters.filter(chapter => chapter.id !== id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setChapters((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">YouTube Chapters</h3>
        <Button onClick={handleAddChapter} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Chapter
        </Button>
      </div>
      
      {chapters.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground">No chapters added yet</p>
          <Button onClick={handleAddChapter} variant="outline" className="mt-2">
            Add Your First Chapter
          </Button>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={chapters.map(c => c.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-0">
              {chapters.map((chapter) => (
                <SortableChapterItem
                  key={chapter.id}
                  chapter={chapter}
                  onEdit={handleEditChapter}
                  onDelete={handleDeleteChapter}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}