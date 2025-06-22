import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorMessage;
    try {
      // Try to parse as JSON first
      const errorData = await res.json();
      errorMessage = errorData.message || res.statusText;
    } catch (e) {
      // If it's not JSON, use text
      const text = await res.text() || res.statusText;
      errorMessage = text;
    }
    console.error(`API Error (${res.status}):`, errorMessage);
    throw new Error(`${res.status}: ${errorMessage}`);
  }
}

export async function apiRequest(
  url: string,
  options?: { 
    method?: string;
    data?: unknown;
  }
): Promise<Response> {
  const method = options?.method || 'GET';
  const data = options?.data;
  
  console.log(`Making ${method} request to ${url}`, data);
  
  // Use relative URLs for Vite proxy in development
  const baseURL = import.meta.env.DEV ? '' : 'https://dir.engageautomations.com';
  const fullUrl = url.startsWith('/') ? `${baseURL}${url}` : url;
  try {
    const res = await fetch(url, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });
    
    // For login/auth endpoints, don't throw an error so we can handle it in the login function
    if (url.includes('/api/auth/')) {
      return res;
    }
    
    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    console.error("API request failed:", error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
