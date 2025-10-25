import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response, text: string) {
  if (!res.ok) {
    throw new Error(`${res.status}: ${text || res.statusText}`);
  }
}

export async function apiRequest<T = any>(
  method: string,
  url: string,
  data?: unknown | undefined,
  headers?: Record<string, string>
): Promise<T> {
  // Ensure the URL starts with /api or is a full URL
  const fullUrl = url.startsWith('/api') ? url : `/api${url}`;
  
  const isFormData = data instanceof FormData;
  
  const res = await fetch(fullUrl, {
    method,
    headers: isFormData ? headers || {} : data ? { "Content-Type": "application/json", ...headers } : headers || {},
    body: isFormData ? data as FormData : data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  // Check if response is HTML (which would indicate a routing issue)
  const responseText = await res.text();
  if (responseText.startsWith('<!DOCTYPE') || responseText.startsWith('<html')) {
    throw new Error('Received HTML response instead of JSON. This usually indicates a routing issue.');
  }
  
  // Try to parse as JSON
  try {
    const jsonData = JSON.parse(responseText);
    await throwIfResNotOk(res, responseText);
    return jsonData;
  } catch (e: any) {
    throw new Error(`Failed to parse response as JSON: ${e.message}`);
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    const text = await res.text();
    
    // Check if response is HTML (which would indicate a routing issue)
    if (text.startsWith('<!DOCTYPE') || text.startsWith('<html')) {
      throw new Error('Received HTML response instead of JSON. This usually indicates a routing issue.');
    }
    
    await throwIfResNotOk(res, text);
    return JSON.parse(text);
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: 1,
      refetchOnMount: true,
    },
    mutations: {
      retry: false,
    },
  },
});