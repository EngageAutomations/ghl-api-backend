import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import NotFound from "@/pages/not-found";
import OAuthError from "@/pages/OAuthError";
import OAuthTest from "@/pages/OAuthTest";
import Listings from "@/pages/listings";
import ConfigWizardDemo from "@/pages/ConfigWizardDemo";
import ConfigWizardSlideshow from "@/pages/ConfigWizardSlideshow";
import ConfigTester from "@/pages/ConfigTester";
import ImageStorageDemo from "@/pages/ImageStorageDemo";
import DeveloperDashboard from "@/pages/DeveloperDashboard";
import DirectoryForm from "@/pages/DirectoryForm";
import DirectoriesDashboard from "@/pages/DirectoriesDashboard";
import DirectoryDetails from "@/pages/DirectoryDetails";
import ListingView from "@/pages/ListingView";
import Collections from "@/pages/Collections";
import CollectionView from "@/pages/CollectionView";
import GoogleDriveSetup from "@/pages/GoogleDriveSetup";
import AppLayout from "@/components/layout/AppLayout";
import CreateListing from "@/components/listings/CreateListing";
import EditListing from "@/components/listings/EditListing";
import { GHLProductDemo } from "@/components/GHLProductDemo";

// No authentication required - direct access
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function Router() {
  // Log current route for debugging
  const [location] = useLocation();
  console.log("Current route:", location);
  
  return (
    <Switch>
      {/* Login redirect to dashboard */}
      <Route path="/login">
        <ProtectedRoute>
          <AppLayout>
            <Dashboard />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      
      {/* OAuth error page */}
      <Route path="/oauth-error">
        <OAuthError />
      </Route>
      
      {/* OAuth test page */}
      <Route path="/oauth-test">
        <OAuthTest />
      </Route>
      
      {/* Directory Form - Public route */}
      <Route path="/form/:locationId/:directoryName">
        <DirectoryForm />
      </Route>
      
      {/* Root dashboard route */}
      <Route path="/">
        <ProtectedRoute>
          <AppLayout>
            <Dashboard />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      
      {/* Directory management routes */}
      <Route path="/directories">
        <ProtectedRoute>
          <AppLayout>
            <DirectoriesDashboard />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/directories/:directoryName">
        <ProtectedRoute>
          <AppLayout>
            <DirectoryDetails />
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
      
      {/* Collections routes */}
      <Route path="/collections">
        <ProtectedRoute>
          <AppLayout>
            <Collections />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/collections/:collectionId">
        <ProtectedRoute>
          <AppLayout>
            <CollectionView />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      
      {/* Google Drive Integration */}
      <Route path="/google-drive-setup">
        <ProtectedRoute>
          <AppLayout>
            <GoogleDriveSetup />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      
      {/* GoHighLevel Product Creation Demo */}
      <Route path="/ghl-product-demo">
        <ProtectedRoute>
          <AppLayout>
            <GHLProductDemo />
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
      
      <Route path="/listing/:slug">
        <ProtectedRoute>
          <AppLayout>
            <ListingView />
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

      {/* New Slideshow Wizard */}
      <Route path="/wizard">
        <ProtectedRoute>
          <AppLayout>
            <ConfigWizardSlideshow />
          </AppLayout>
        </ProtectedRoute>
      </Route>

      {/* Slideshow Wizard (alternative route) */}
      <Route path="/slideshow">
        <ProtectedRoute>
          <AppLayout>
            <ConfigWizardSlideshow />
          </AppLayout>
        </ProtectedRoute>
      </Route>

      {/* Config Wizard Slideshow (alternative route) */}
      <Route path="/config-wizard-slideshow">
        <ProtectedRoute>
          <AppLayout>
            <ConfigWizardSlideshow />
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
      
      {/* Developer Dashboard */}
      <Route path="/developer">
        <ProtectedRoute>
          <AppLayout>
            <DeveloperDashboard />
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