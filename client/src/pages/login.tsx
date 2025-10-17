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
import { Eye, EyeOff, Apple, Chrome } from "lucide-react";
import { useState } from "react";

// Define the LoginCredentials type based on the loginSchema
type LoginCredentials = z.infer<typeof loginSchema>;

export default function Login() {
  const { toast } = useToast();
  const { setUser } = useAuth();
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginCredentials>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginCredentials) => {
      const result = await apiRequest<User>("POST", "/api/auth/login", data);
      return result;
    },
    onSuccess: (user) => {
      // Also update localStorage to ensure consistency
      localStorage.setItem("user", JSON.stringify(user));
      setUser(user);
      toast({
        title: "Welcome back!",
        description: `Logged in as ${user.name}`,
      });
      setLocation(user.role === "student" ? "/student/dashboard" : "/teacher/dashboard");
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LoginCredentials) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row">
      {/* Left Panel - Image with Brand Logo */}
      <div className="hidden md:block md:w-1/2 bg-gradient-to-br from-blue-100 to-blue-50 dark:from-gray-800 dark:to-gray-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('@assets/45d760f5-961b-43ac-915a-a0abc076add7.png')] bg-cover bg-center bg-no-repeat"></div>
        {/* Crextio Brand Logo - Moved to Left Panel */}
        <div className="absolute top-6 left-6 z-10">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-yellow-400 text-yellow-900">
              <span className="text-lg font-bold">C</span>
            </div>
            <span className="text-xl font-bold text-white">Crextio</span>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full md:w-1/2 bg-white dark:bg-gray-900 p-6 sm:p-8 md:p-12 flex flex-col justify-center">
        <div className="mb-8 md:mb-10 md:hidden">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-yellow-400 text-yellow-900">
              <span className="text-lg font-bold">C</span>
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">Crextio</span>
          </div>
        </div>

        <div className="max-w-md w-full mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">Welcome back</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6 md:mb-8">Sign in to continue your learning journey</p>

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
              <Button
                type="submit"
                className="w-full h-11 md:h-12 rounded-lg bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-semibold text-base transition-colors"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </Form>

          <div className="my-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400">
                  Or continue with
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="h-11 md:h-12 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <Apple className="h-5 w-5 mr-2" />
              Apple
            </Button>
            <Button
              variant="outline"
              className="h-11 md:h-12 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <Chrome className="h-5 w-5 mr-2" />
              Google
            </Button>
          </div>

          <div className="mt-6 md:mt-8 text-center text-sm">
            <span className="text-gray-600 dark:text-gray-400">Don't have an account? </span>
            <Link href="/register" className="text-yellow-500 font-medium hover:underline">
              Sign up
            </Link>
          </div>

          <div className="mt-4 md:mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
            By signing in, you agree to our{" "}
            <a href="#" className="text-yellow-500 hover:underline">Terms & Conditions</a>
          </div>
        </div>
      </div>
    </div>
  );
}