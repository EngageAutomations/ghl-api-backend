import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import TabNavigation from "@/components/configuration/TabNavigation";
import ListingOptInsConfig from "@/components/configuration/ListingOptInsConfig";
import AdvancedStylingConfig from "@/components/configuration/AdvancedStylingConfig";
import PortalDomainConfig from "@/components/configuration/PortalDomainConfig";
import DirectoryNameConfig from "@/components/configuration/DirectoryNameConfig";
import SaveButtonBar from "@/components/shared/SaveButtonBar";
import { useConfig } from "@/context/ConfigContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { ConfigCard } from "@/components/ui/config-card";

export default function Configuration() {
  const [location] = useLocation();
  const { config, updateConfig, loading, hasChanges, resetChanges } = useConfig();
  const [activeTab, setActiveTab] = useState("action-buttons");
  const { toast } = useToast();
  
  // Local state for form values
  const [directoryName, setDirectoryName] = useState(config.directoryName || "");
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  
  // Parse URL parameters to set initial active tab
  useEffect(() => {
    const url = new URL(window.location.href);
    const tabParam = url.searchParams.get("tab");
    
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [location]);
  
  // Update URL when tab changes
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    
    const url = new URL(window.location.href);
    url.searchParams.set("tab", tab);
    window.history.replaceState({}, "", url.toString());
  };

  // Handle saving all settings
  const handleSaveDirectoryProfile = async () => {
    try {
      setIsSaving(true);
      
      // Update all configuration settings
      await updateConfig({
        directoryName
      });
      
      // Show success feedback
      setIsSaved(true);
      toast({
        title: "Success!",
        description: "Directory profile saved successfully.",
      });
      
      // Reset saved state after delay
      setTimeout(() => {
        setIsSaved(false);
      }, 3000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save directory configuration. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  if (loading) {
    return (
      <div className="p-6 flex justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8">
      <SaveButtonBar 
        title="Directory Configuration" 
        subtitle="Configure your eCommerce directory extension settings"
      />
      
      <TabNavigation activeTab={activeTab} onTabChange={handleTabChange} />
      
      {activeTab === "action-buttons" && (
        <>
          <div className="space-y-8">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Step 1: Configure your directory</h2>
            <DirectoryNameConfig 
              directoryName={directoryName} 
              onChange={setDirectoryName} 
            />
            
            <h2 className="text-lg font-semibold text-slate-800 mt-8 mb-4">Step 2: Choose your opt-in type</h2>
            <ListingOptInsConfig />
            
            <h2 className="text-lg font-semibold text-slate-800 mt-8 mb-4">Step 3: Save your directory profile</h2>
            <ConfigCard 
              title="Save Directory Configuration" 
              description="Save your directory settings to apply them to all listings in this directory"
            >
              <div className="space-y-4">
                <p className="text-sm text-slate-600">
                  Click the button below to save your directory configuration. 
                  This will store your settings and generate the necessary code for your GHL marketplace extension.
                </p>
                
                <div className="flex items-center gap-3">
                  <Button 
                    className="px-5"
                    size="lg" 
                    onClick={handleSaveDirectoryProfile}
                    disabled={isSaving || isSaved || !directoryName.trim()}
                  >
                    {isSaving ? 'Saving...' : isSaved ? (
                      <span className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        Saved
                      </span>
                    ) : 'Save Directory Profile'}
                  </Button>
                  
                  {!directoryName.trim() && (
                    <span className="text-amber-600 text-sm">
                      Please complete Step 1 before saving
                    </span>
                  )}
                </div>
                
                {isSaved && (
                  <div className="bg-green-50 text-green-700 p-3 rounded-md border border-green-200 text-sm">
                    Directory profile saved successfully! Your configuration is ready to use with all listings in this directory.
                  </div>
                )}
              </div>
            </ConfigCard>
          </div>
        </>
      )}
      
      {activeTab === "portal-domains" && (
        <PortalDomainConfig />
      )}
    </div>
  );
}
