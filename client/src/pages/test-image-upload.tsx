import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";

export default function TestImageUpload() {
  const { user, setUser } = useAuth();
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Only image files are allowed",
          variant: "destructive",
        });
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "File must be less than 5MB",
          variant: "destructive",
        });
        return;
      }
      
      setSelectedFile(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select an image file to upload",
        variant: "destructive",
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append("name", user?.name || "");
      formData.append("profileImage", selectedFile);
      
      const response = await fetch("/api/auth/profile", {
        method: "PUT",
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error("Failed to upload image");
      }
      
      const updatedUser = await response.json();
      setUser(updatedUser);
      
      toast({
        title: "Success",
        description: "Profile image uploaded successfully",
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload profile image",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Test Image Upload</h1>
      
      <div className="mb-4">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="mb-4"
        />
        
        {previewUrl && (
          <div className="mb-4">
            <h2 className="text-lg font-semibold mb-2">Preview:</h2>
            <img 
              src={previewUrl} 
              alt="Preview" 
              className="w-32 h-32 rounded-full object-cover border-2 border-gray-300"
            />
          </div>
        )}
        
        <button
          onClick={handleUpload}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Upload Image
        </button>
      </div>
      
      {user?.profileImage && (
        <div>
          <h2 className="text-lg font-semibold mb-2">Current Profile Image:</h2>
          <img 
            src={user.profileImage.startsWith('/') ? `${window.location.origin}${user.profileImage}` : user.profileImage} 
            alt="Current Profile" 
            className="w-32 h-32 rounded-full object-cover border-2 border-gray-300"
          />
        </div>
      )}
    </div>
  );
}