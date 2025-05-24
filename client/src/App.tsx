import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import NotFound from "@/pages/not-found";
import Listings from "@/pages/listings";
import ConfigWizardDemo from "@/pages/ConfigWizardDemo";
import ConfigTester from "@/pages/ConfigTester";
import ImageStorageDemo from "@/pages/ImageStorageDemo";
import DeveloperDashboard from "@/pages/DeveloperDashboard";
import AppLayout from "@/components/layout/AppLayout";
import CreateListing from "@/components/listings/CreateListing";
import EditListing from "@/components/listings/EditListing";

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
      
      {/* Listings routes */}
      <Route path="/listings">
        <ProtectedRoute>
          <AppLayout>
            <Listings />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/create-listing">
        <ProtectedRoute>
          <AppLayout>
            <CreateListing />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/edit-listing/:id">
        <ProtectedRoute>
          <AppLayout>
            <EditListing />
          </AppLayout>
        </ProtectedRoute>
      </Route>

      {/* Config Wizard Demo */}
      <Route path="/config-wizard">
        <ProtectedRoute>
          <AppLayout>
            <ConfigWizardDemo />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      
      {/* Config Tester Page */}
      <Route path="/config-tester">
        <ProtectedRoute>
          <AppLayout>
            <ConfigTester />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      
      {/* Redirects for removed pages */}
      <Route path="/configuration">
        <ProtectedRoute>
          <AppLayout>
            <div className="flex flex-col items-center justify-center py-16">
              <h2 className="text-2xl font-bold text-slate-700 mb-4">Configuration Page Moved</h2>
              <p className="text-slate-600 mb-6">The configuration page has been replaced with our new wizard interface.</p>
              <button 
                onClick={() => window.location.href = "/config-wizard"} 
                className="inline-flex items-center px-5 py-2.5 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
              >
                Go to Config Wizard
              </button>
            </div>
          </AppLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/domains">
        <ProtectedRoute>
          <AppLayout>
            <div className="flex flex-col items-center justify-center py-16">
              <h2 className="text-2xl font-bold text-slate-700 mb-4">Domain Settings Integrated</h2>
              <p className="text-slate-600 mb-6">Domain settings have been integrated into the main configuration wizard.</p>
              <button 
                onClick={() => window.location.href = "/config-wizard"} 
                className="inline-flex items-center px-5 py-2.5 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
              >
                Go to Config Wizard
              </button>
            </div>
          </AppLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/analytics">
        <ProtectedRoute>
          <AppLayout>
            <div className="flex flex-col items-center justify-center py-16">
              <h2 className="text-2xl font-bold text-slate-700 mb-4">Analytics Coming Soon</h2>
              <p className="text-slate-600 mb-6">Analytics features are currently being integrated into the dashboard.</p>
              <button 
                onClick={() => window.location.href = "/"} 
                className="inline-flex items-center px-5 py-2.5 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
              >
                Go to Dashboard
              </button>
            </div>
          </AppLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/ghl-integration">
        <ProtectedRoute>
          <AppLayout>
            <div className="flex flex-col items-center justify-center py-16">
              <h2 className="text-2xl font-bold text-slate-700 mb-4">GHL Integration Settings Updated</h2>
              <p className="text-slate-600 mb-6">GHL Integration settings are now configured through the wizard interface.</p>
              <button 
                onClick={() => window.location.href = "/config-wizard"} 
                className="inline-flex items-center px-5 py-2.5 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
              >
                Go to Config Wizard
              </button>
            </div>
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