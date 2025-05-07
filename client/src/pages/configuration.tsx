import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import TabNavigation from "@/components/configuration/TabNavigation";
import ListingOptInsConfig from "@/components/configuration/ListingOptInsConfig";
import AdvancedStylingConfig from "@/components/configuration/AdvancedStylingConfig";
import PortalDomainConfig from "@/components/configuration/PortalDomainConfig";
import SaveButtonBar from "@/components/shared/SaveButtonBar";
import { useConfig } from "@/context/ConfigContext";

export default function Configuration() {
  const [location] = useLocation();
  const { loading } = useConfig();
  const [activeTab, setActiveTab] = useState("action-buttons");
  
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
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Step 1: Choose your opt in type</h2>
            <ListingOptInsConfig />
            
            <h2 className="text-lg font-semibold text-slate-800 mt-8 mb-4">Step 2: Add our code to the web builder's styling section</h2>
            <AdvancedStylingConfig />
          </div>
        </>
      )}
      
      {activeTab === "portal-domains" && (
        <PortalDomainConfig />
      )}
    </div>
  );
}
