import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "@shared/schema";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth-context";
import { Link, useLocation } from "wouter";
import type { User } from "@shared/schema";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { GraduationCap } from "lucide-react";

// Define the LoginCredentials type based on the loginSchema
type LoginCredentials = z.infer<typeof loginSchema>;

export default function Login() {
  const { toast } = useToast();
  const { setUser } = useAuth();
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");

  const form = useForm<LoginCredentials>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginCredentials) => {
      console.log("Attempting login with data:", data);
      try {
        // Ensure we're using the correct URL format
        const result = await apiRequest<User>("POST", "/api/auth/login", data);
        console.log("Login successful, result:", result);
        return result;
      } catch (error) {
        console.error("Login error:", error);
        throw error;
      }
    },
    onSuccess: (user) => {
      console.log("Login mutation success, user:", user);
      // Also update localStorage to ensure consistency
      localStorage.setItem("user", JSON.stringify(user));
      setUser(user);
      toast({
        title: "Welcome back!",
        description: `Logged in as ${user.name}`,
      });
      // Redirect based on role
      if (user.role === "admin") {
        setLocation("/admin/dashboard");
      } else if (user.role === "teacher") {
        setLocation("/teacher/dashboard");
      } else {
        setLocation("/student/dashboard");
      }
    },
    onError: (error: Error) => {
      console.error("Login mutation error:", error);
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!forgotEmail) {
      toast({
        title: "Email required",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(forgotEmail)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // In a real implementation, this would send a password reset email
      // For now, we'll just show a success message
      toast({
        title: "Password reset email sent",
        description: `If an account exists for ${forgotEmail}, you will receive password reset instructions.`,
      });
      
      // Reset form and hide forgot password form
      setForgotEmail("");
      setShowForgotPassword(false);
    } catch (error) {
      toast({
        title: "Failed to send reset email",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  };

  const onSubmit = (data: LoginCredentials) => {
    loginMutation.mutate(data);
  };

  if (showForgotPassword) {
    return (
      <div className="min-h-screen w-full flex flex-col md:flex-row">
        {/* Left Panel - Image with Brand Logo */}
        <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-blue-100 to-blue-50 dark:from-gray-800 dark:to-gray-900 relative overflow-hidden">
          {/* Techshaala Brand Logo - Moved to Left Panel */}
          <div className="absolute top-6 left-6 z-10">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-yellow-400 text-yellow-900">
                <GraduationCap className="h-6 w-6" />
              </div>
              <span className="text-xl font-bold text-white">Techshaala</span>
            </div>
          </div>
          {/* Background Image */}
          <div className="absolute inset-0 flex items-center justify-center">
            <img 
              src="/45d760f5-961b-43ac-915a-a0abc076add7.png" 
              alt="Learning Management System" 
              className="w-full h-full object-cover max-w-none"
            />
          </div>
        </div>

        {/* Right Panel - Forgot Password Form */}
        <div className="w-full md:w-1/2 bg-white dark:bg-gray-900 p-4 sm:p-6 md:p-8 lg:p-12 flex flex-col justify-center">
          <div className="mb-6 md:mb-8 md:hidden">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-yellow-400 text-yellow-900">
                <GraduationCap className="h-6 w-6" />
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">Techshaala</span>
            </div>
          </div>

          <div className="max-w-md w-full mx-auto">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">Reset Your Password</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Enter your email address and we'll send you a link to reset your password.</p>

            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="forgot-email" className="text-gray-700 dark:text-gray-300">Email Address</label>
                <Input
                  id="forgot-email"
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="h-10 sm:h-11 md:h-12 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
              
              <Button
                type="submit"
                className="w-full h-10 sm:h-11 md:h-12 rounded-lg bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-semibold text-base transition-colors"
              >
                Send Reset Link
              </Button>
              
              <Button
                type="button"
                variant="ghost"
                className="w-full h-10 sm:h-11 md:h-12 rounded-lg font-semibold text-base"
                onClick={() => setShowForgotPassword(false)}
              >
                Back to Login
              </Button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row">
      {/* Left Panel - Image with Brand Logo */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-blue-100 to-blue-50 dark:from-gray-800 dark:to-gray-900 relative overflow-hidden">
        {/* Techshaala Brand Logo - Moved to Left Panel */}
        <div className="absolute top-6 left-6 z-10">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-yellow-400 text-yellow-900">
              <GraduationCap className="h-6 w-6" />
            </div>
            <span className="text-xl font-bold text-white">Techshaala</span>
          </div>
        </div>
        {/* Background Image */}
        <div className="absolute inset-0 flex items-center justify-center">
          <img 
            src="/45d760f5-961b-43ac-915a-a0abc076add7.png" 
            alt="Learning Management System" 
            className="w-full h-full object-cover max-w-none"
            onError={(e) => console.log("Image load error:", e)}
          />
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full md:w-1/2 bg-white dark:bg-gray-900 p-4 sm:p-6 md:p-8 lg:p-12 flex flex-col justify-center">
        <div className="mb-6 md:mb-8 md:hidden">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-yellow-400 text-yellow-900">
              <GraduationCap className="h-6 w-6" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">Techshaala</span>
          </div>
        </div>

        <div className="max-w-md w-full mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">Welcome back</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Sign in to continue your learning journey</p>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 md:space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 dark:text-gray-300">Email address</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="you@example.com"
                        className="h-11 md:h-12 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 dark:text-gray-300">Password</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          className="h-11 md:h-12 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white pr-12"
                          {...field}
                        />
                      </FormControl>
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5 text-gray-500" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-500" />
                        )}
                      </button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end">
                <button
                  type="button"
                  className="text-sm text-yellow-500 hover:underline"
                  onClick={() => setShowForgotPassword(true)}
                >
                  Forgot password?
                </button>
              </div>
              
              <Button
                type="submit"
                className="w-full h-11 md:h-12 rounded-lg bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-semibold text-base transition-colors"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center text-sm">
            <span className="text-gray-600 dark:text-gray-400">Don't have an account? </span>
            <Link href="/register" className="text-yellow-500 font-medium hover:underline">
              Sign up
            </Link>
          </div>

          <div className="mt-4 md:mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
            By signing in, you agree to our{" "}
            <Link href="/terms" className="text-yellow-500 hover:underline">Terms & Conditions</Link>
          </div>
        </div>
      </div>
    </div>
  );
}