import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { DesignerConfig } from "@shared/schema";
import { useAuth } from "./AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Default configuration values
const defaultConfig: DesignerConfig = {
  id: 0,
  userId: 0,
  enableActionButton: false,
  buttonType: "popup",
  buttonLabel: "Contact Us",
  buttonUrl: "https://forms.example.com/contact?product={product_name}",
  popupWidth: 600,
  popupHeight: 500,
  buttonStyle: "primary",
  buttonBorderRadius: 4,
  buttonColor: "#4F46E5",
  buttonTextColor: "#FFFFFF",
  customCss: "",
  enableEmbeddedForm: false,
  formEmbedUrl: "https://forms.example.com/embed?product={product_name}",
  formFallback: "Unable to load the form. Please try again later or contact us directly.",
  formPosition: "Below Product Description",
  customFormFieldName: "product_slug",
  customFormFieldLabel: "Source Listing",
  customFormFieldType: "hidden",
  createCustomFieldInGHL: false,
  popupParamName: "listing_id",
  formParamName: "listing_id",
  hidePrice: false,
  hideCartIcon: false,
  hideAddToCartButton: false,
  enableDownloadButton: false,
  customCssCode: "",
  portalSubdomain: "",
  domainVerified: false,
};

interface ConfigContextType {
  config: DesignerConfig;
  updateConfig: (updates: Partial<DesignerConfig>) => void;
  hasChanges: boolean;
  resetChanges: () => void;
  loading: boolean;
  error: string | null;
}

const ConfigContext = createContext<ConfigContextType>({
  config: defaultConfig,
  updateConfig: () => {},
  hasChanges: false,
  resetChanges: () => {},
  loading: false,
  error: null,
});

export function ConfigProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [config, setConfig] = useState<DesignerConfig>(defaultConfig);
  const [originalConfig, setOriginalConfig] = useState<DesignerConfig>(defaultConfig);
  const [hasChanges, setHasChanges] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch user's configuration when authenticated
  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    
    const fetchConfig = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/config/${user.id}`, {
          credentials: "include",
        });
        
        if (response.ok) {
          const data = await response.json();
          setConfig(data);
          setOriginalConfig(data);
        } else if (response.status === 404) {
          // Create new config with user ID
          const newConfig = { ...defaultConfig, userId: user.id };
          setConfig(newConfig);
          setOriginalConfig(newConfig);
        } else {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to fetch configuration");
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : "Unknown error");
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to load configuration",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchConfig();
  }, [user, toast]);
  
  // Update configuration and track changes
  const updateConfig = (updates: Partial<DesignerConfig>) => {
    setConfig(prevConfig => {
      const newConfig = { ...prevConfig, ...updates };
      setHasChanges(JSON.stringify(newConfig) !== JSON.stringify(originalConfig));
      return newConfig;
    });
  };
  
  // Reset changes to original config
  const resetChanges = () => {
    setConfig(originalConfig);
    setHasChanges(false);
  };
  
  return (
    <ConfigContext.Provider value={{ 
      config, 
      updateConfig, 
      hasChanges, 
      resetChanges,
      loading,
      error
    }}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  return useContext(ConfigContext);
}
