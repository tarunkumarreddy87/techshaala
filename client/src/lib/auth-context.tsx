import { createContext, useContext, useState, useEffect } from "react";
import type { User } from "@shared/schema";
import { apiRequest } from "./queryClient";

type AuthContextType = {
  user: User | null;
  setUser: (user: User | null) => void;
  isLoading: boolean;
  refreshAuth: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshAuth = async () => {
    try {
      // Try to get current user from backend
      const currentUser = await apiRequest<User>("GET", "/api/auth/me");
      
      // Ensure profile image URLs are absolute if they're relative
      if (currentUser && currentUser.profileImage) {
        if (currentUser.profileImage.startsWith('/')) {
          currentUser.profileImage = `${window.location.origin}${currentUser.profileImage}`;
        }
      }
      
      setUser(currentUser);
    } catch (error: any) {
      // If there's an error (likely 401), clear user data
      console.log("Auth check failed:", error.message);
      setUser(null);
      localStorage.removeItem("user");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshAuth();
  }, []);

  useEffect(() => {
    if (user) {
      // Ensure profile image URLs are absolute if they're relative
      const userToStore = { ...user };
      if (userToStore.profileImage && userToStore.profileImage.startsWith('/')) {
        userToStore.profileImage = `${window.location.origin}${userToStore.profileImage}`;
      }
      localStorage.setItem("user", JSON.stringify(userToStore));
    } else {
      localStorage.removeItem("user");
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, setUser, isLoading, refreshAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}