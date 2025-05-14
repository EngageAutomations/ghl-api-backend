import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { useConfig } from "@/context/ConfigContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface SaveButtonBarProps {
  title: string;
  subtitle?: string;
}

export default function SaveButtonBar({ title, subtitle }: SaveButtonBarProps) {
  const { config, hasChanges, resetChanges } = useConfig();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  
  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      // Save configuration to the server
      const response = await apiRequest("/api/config", {
        method: "POST", 
        data: config
      });
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "Configuration saved successfully",
        });
        resetChanges();
      } else {
        const data = await response.json();
        throw new Error(data.message || "Failed to save configuration");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-slate-800">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-600">{subtitle}</p>}
      </div>
      <div className="mt-4 md:mt-0">
        <Button 
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
        >
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
