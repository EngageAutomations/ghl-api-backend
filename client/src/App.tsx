import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Configuration from "@/pages/configuration";
import AppLayout from "@/components/layout/AppLayout";
import { useAuth } from "@/context/AuthContext";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  
  // Add debug logging for authentication state
  useEffect(() => {
    console.log("AUTH DEBUG - Protected Route");
    console.log("Loading:", loading);
    console.log("User state:", user);
    console.log("localStorage user:", localStorage.getItem('user'));
    
    if (!loading) {
      if (!user) {
        console.log("User not authenticated, redirecting to login...");
        navigate("/login");
      } else {
        console.log("User is authenticated:", user.email || user.username);
      }
    }
  }, [user, loading, navigate]);
  
  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-lg font-medium text-gray-700">Loading authentication...</p>
        </div>
      </div>
    );
  }
  
  // Show redirect message if no user
  if (!user) {
    // Force redirect
    navigate("/login");
    
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-lg font-medium text-gray-700">Not logged in, redirecting...</p>
        </div>
      </div>
    );
  }
  
  // User is authenticated, render children
  console.log("Rendering protected content for user:", user.email || user.username);
  return <>{children}</>;
}

function Router() {
  // Add location tracking for debugging
  const [location] = useLocation();
  console.log("Current location:", location);
  
  // This component defines all routes for the application
  return (
    <Switch>
      {/* Public routes that don't require auth */}
      <Route path="/login">
        <Login />
      </Route>
      
      {/* Root dashboard route (must come after more specific routes) */}
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
