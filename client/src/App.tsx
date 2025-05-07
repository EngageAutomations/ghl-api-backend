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
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      console.log("User not authenticated, redirecting to login...");
      
      // Short timeout to allow state to settle
      setTimeout(() => {
        navigate("/login");
      }, 50);
    }
  }, [user, loading, navigate]);
  
  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-lg font-medium text-gray-700">Loading...</p>
        </div>
      </div>
    );
  }
  
  // Show redirect message if no user
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
  
  // User is authenticated, render children
  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/login">
        <Login />
      </Route>
      
      {/* Protected routes */}
      <Route path="/" exact>
        <ProtectedRoute>
          <AppLayout>
            <Dashboard />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/configuration">
        <ProtectedRoute>
          <AppLayout>
            <Configuration />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      
      {/* 404 route */}
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
