import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import NotFound from "@/pages/not-found";
import Configuration from "@/pages/configuration";
import AppLayout from "@/components/layout/AppLayout";

// Simple protected route component that checks for user in localStorage
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [, navigate] = useLocation();
  
  useEffect(() => {
    const user = localStorage.getItem('user');
    
    if (!user) {
      console.log("No user found in localStorage, redirecting to login");
      window.location.href = "/login";
    } else {
      console.log("User authenticated from localStorage:", JSON.parse(user).email || JSON.parse(user).username);
    }
  }, [navigate]);
  
  // If we have a user in localStorage, render the children
  const user = localStorage.getItem('user');
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-lg font-medium text-gray-700">Redirecting to login...</p>
        </div>
      </div>
    );
  }
  
  return <>{children}</>;
}

function Router() {
  // Log current route for debugging
  const [location] = useLocation();
  console.log("Current route:", location);
  
  return (
    <Switch>
      {/* Public routes that don't require auth */}
      <Route path="/login">
        <Login />
      </Route>
      
      {/* Root dashboard route */}
      <Route path="/">
        <ProtectedRoute>
          <AppLayout>
            <Dashboard />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      
      {/* Configuration route */}
      <Route path="/configuration">
        <ProtectedRoute>
          <AppLayout>
            <Configuration />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      
      {/* 404 route - catch all unmatched routes */}
      <Route>
        <NotFound />
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;