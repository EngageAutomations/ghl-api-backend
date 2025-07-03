import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
import { initializeAuth } from "@/lib/jwt";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import NotFound from "@/pages/not-found";
import OAuthError from "@/pages/OAuthError";
import OAuthSuccess from "@/pages/OAuthSuccess";
import OAuthTest from "@/pages/OAuthTest";
import OAuthSignupTest from "@/pages/OAuthSignupTest";
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
import APIManagement from "@/pages/APIManagement";
import InstallationRequired from "@/pages/InstallationRequired";
import MarketplaceLanding from "@/pages/MarketplaceLanding";
import { LocationEnhancementSettings } from "@/pages/LocationEnhancementSettings";
import { ErrorBoundary } from "react-error-boundary";
import AppLayout from "@/components/layout/AppLayout";
import CreateListing from "@/components/listings/CreateListing";
import EditListing from "@/components/listings/EditListing";
import { GHLProductDemo } from "@/components/GHLProductDemo";
import { RailwayBackendTest } from "@/components/RailwayBackendTest";
import ProductCreationDemo from "@/components/ProductCreationDemo";
import PricingManager from "@/pages/PricingManager";
import ProductWorkflowPage from "@/pages/ProductWorkflowPage";
import WorkflowTester from "@/pages/WorkflowTester";

// No authentication required - direct access
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function Router() {
  const [location] = useLocation();
  
  // Parse installation_id from OAuth redirect and get locationId
  useEffect(() => {
    const handleOAuthRedirect = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const installationId = urlParams.get('installation_id');
      
      if (installationId) {
        console.log('OAuth redirect detected - Installation ID:', installationId);
        
        try {
          // Immediately call /api/oauth/status to get locationId
          const { checkOAuthStatus } = await import('@/lib/railwayAPI');
          const status = await checkOAuthStatus(installationId);
          console.log('OAuth status response:', status);
          
          // Store both IDs in sessionStorage
          sessionStorage.setItem('installation_id', installationId);
          
          if (status.authenticated && status.locationId) {
            sessionStorage.setItem('location_id', status.locationId);
            console.log('OAuth complete - stored installation_id and location_id');
            console.log('Installation ID:', installationId);
            console.log('Location ID:', status.locationId);
            
            // Clear URL params after successful capture
            const cleanUrl = window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);
          } else {
            console.log('OAuth incomplete - no locationId or not authenticated');
          }
        } catch (error) {
          console.log('OAuth status check failed:', error.message);
          // Still store installation_id for retry attempts
          sessionStorage.setItem('installation_id', installationId);
        }
      }
    };
    
    handleOAuthRedirect();
  }, [location]);
  
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
      
      {/* OAuth signup test page */}
      <Route path="/oauth-signup-test">
        <OAuthSignupTest />
      </Route>
      
      {/* Directory Form - Public route */}
      <Route path="/form/:locationId/:directoryName">
        <DirectoryForm />
      </Route>
      
      {/* Root marketplace landing page */}
      <Route path="/">
        <MarketplaceLanding />
      </Route>
      
      {/* Dashboard route */}
      <Route path="/dashboard">
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

      {/* Product Creation Workflow */}
      <Route path="/product-workflow">
        <ProtectedRoute>
          <AppLayout>
            <ProductWorkflowPage />
          </AppLayout>
        </ProtectedRoute>
      </Route>

      {/* Complete Workflow Tester */}
      <Route path="/workflow-tester">
        <ProtectedRoute>
          <AppLayout>
            <WorkflowTester />
          </AppLayout>
        </ProtectedRoute>
      </Route>

      {/* Railway Backend Integration Test */}
      <Route path="/product-demo">
        <ProtectedRoute>
          <AppLayout>
            <ProductCreationDemo />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      
      <Route path="/railway-test">
        <ProtectedRoute>
          <AppLayout>
            <RailwayBackendTest />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      
      {/* API Management Interface */}
      <Route path="/api-management">
        <ProtectedRoute>
          <AppLayout>
            <APIManagement />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      
      {/* Installation Required Page */}
      <Route path="/installation-required">
        <InstallationRequired />
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
      
      {/* OAuth routes */}
      <Route path="/oauth-success">
        <OAuthSuccess />
      </Route>
      
      <Route path="/oauth-error">
        <OAuthError />
      </Route>
      
      {/* Location Enhancement Settings */}
      <Route path="/location-enhancements">
        <ProtectedRoute>
          <AppLayout>
            <LocationEnhancementSettings />
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
  useEffect(() => {
    // Initialize JWT authentication on app startup
    initializeAuth();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ErrorBoundary
          fallbackRender={({ error, resetErrorBoundary }) => (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
              <div className="max-w-md mx-auto text-center">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">Something went wrong</h1>
                <p className="text-gray-600 mb-6">
                  We encountered an unexpected error. Please try refreshing the page.
                </p>
                <div className="space-x-3">
                  <button
                    onClick={resetErrorBoundary}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                  >
                    Refresh Page
                  </button>
                </div>
              </div>
            </div>
          )}
        >
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </ErrorBoundary>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;