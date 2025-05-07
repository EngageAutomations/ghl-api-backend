import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useConfig } from "@/context/ConfigContext";
import { Settings, List, Globe, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { config, loading } = useConfig();
  const [user, setUser] = useState(null);
  
  // Load user from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);
  
  if (loading) {
    return (
      <div className="p-6 flex justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-heading font-bold text-slate-800">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-600">
          Welcome back, {user?.displayName || user?.username || user?.email || "User"}! Manage your HighLevel Directory settings.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center">
              <Settings className="w-4 h-4 mr-2 text-primary" />
              Configuration Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Action Button</span>
                <span className={config.enableActionButton ? "text-green-500" : "text-slate-400"}>
                  {config.enableActionButton ? "Enabled" : "Disabled"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Embedded Form</span>
                <span className={config.enableEmbeddedForm ? "text-green-500" : "text-slate-400"}>
                  {config.enableEmbeddedForm ? "Enabled" : "Disabled"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Custom Styling</span>
                <span className={config.customCssCode ? "text-green-500" : "text-slate-400"}>
                  {config.customCssCode ? "Configured" : "Default"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Portal Domain</span>
                <span className={config.domainVerified ? "text-green-500" : "text-amber-500"}>
                  {config.domainVerified ? "Verified" : config.portalSubdomain ? "Pending" : "Not Configured"}
                </span>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-slate-100">
              <Link href="/configuration">
                <Button variant="ghost" size="sm" className="w-full justify-between">
                  <span>Manage Configuration</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center">
              <List className="w-4 h-4 mr-2 text-primary" />
              Listings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500 mb-4">
              Manage your product listings and customize how they appear in the directory.
            </p>
            
            <div className="mt-4 pt-4 border-t border-slate-100">
              <Link href="/listings">
                <Button variant="ghost" size="sm" className="w-full justify-between">
                  <span>View Listings</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium flex items-center">
              <Globe className="w-4 h-4 mr-2 text-primary" />
              Domain Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500 mb-4">
              Configure your custom portal subdomain to personalize your directory.
            </p>
            
            {config.portalSubdomain && (
              <div className="text-sm bg-slate-50 p-2 rounded border border-slate-200 mb-4">
                <span className="font-medium">{config.portalSubdomain}</span>.yourdomain.com
                <span className="ml-2 px-1.5 py-0.5 text-xs rounded-full bg-amber-100 text-amber-800">
                  {config.domainVerified ? "Active" : "Pending"}
                </span>
              </div>
            )}
            
            <div className="mt-4 pt-4 border-t border-slate-100">
              <Link href="/configuration?tab=portal-domains">
                <Button variant="ghost" size="sm" className="w-full justify-between">
                  <span>Manage Domains</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h2 className="text-xl font-heading font-semibold text-slate-800 mb-4">Getting Started</h2>
        
        <div className="space-y-4">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-primary-100 text-primary font-medium">
              1
            </div>
            <div className="ml-4">
              <h3 className="text-base font-medium text-slate-900">Configure Action Button</h3>
              <p className="mt-1 text-sm text-slate-500">
                Set up custom action buttons on your product listings to enable contact forms, downloads or links.
              </p>
            </div>
          </div>
          
          <div className="flex">
            <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-primary-100 text-primary font-medium">
              2
            </div>
            <div className="ml-4">
              <h3 className="text-base font-medium text-slate-900">Customize Appearance</h3>
              <p className="mt-1 text-sm text-slate-500">
                Modify the styling of your listings by hiding standard eCommerce elements and adding custom CSS.
              </p>
            </div>
          </div>
          
          <div className="flex">
            <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-primary-100 text-primary font-medium">
              3
            </div>
            <div className="ml-4">
              <h3 className="text-base font-medium text-slate-900">Set Up Portal Domain</h3>
              <p className="mt-1 text-sm text-slate-500">
                Configure a custom subdomain for your user portal to create a professional branded experience.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}