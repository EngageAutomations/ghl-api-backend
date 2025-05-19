import { useState } from "react";
import { ConfigCard } from "@/components/ui/config-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useConfig } from "@/context/ConfigContext";
import { Button } from "@/components/ui/button";
import { Check, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function DirectoryNameConfig() {
  const { config, updateConfig } = useConfig();
  const [directoryName, setDirectoryName] = useState(config.directoryName || "");
  const [isSaved, setIsSaved] = useState(false);
  
  const handleSave = () => {
    updateConfig({
      directoryName
    });
    setIsSaved(true);
    
    // Reset the saved indicator after 2 seconds
    setTimeout(() => {
      setIsSaved(false);
    }, 2000);
  };
  
  return (
    <ConfigCard 
      title="Directory Name Configuration" 
      description="Set the directory name that will be used across all listings in this directory"
    >
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="directory-name">Directory Name</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-slate-400" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    This name is used as an identifier for this directory. It will be stored 
                    with each listing to track which directory the listing belongs to.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Input
            id="directory-name"
            placeholder="Enter a name for this directory (e.g. software-tools)"
            value={directoryName}
            onChange={(e) => setDirectoryName(e.target.value)}
            className="max-w-md"
          />
          <p className="text-sm text-slate-500">
            Use a unique name to identify this directory. Should be lowercase with no spaces (hyphens recommended).
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            onClick={handleSave}
            disabled={!directoryName.trim() || isSaved}
            className="min-w-[100px]"
          >
            {isSaved ? (
              <span className="flex items-center gap-2">
                <Check className="h-4 w-4" />
                Saved
              </span>
            ) : (
              "Save"
            )}
          </Button>
          
          {isSaved && (
            <span className="text-green-600 text-sm">
              Directory name saved successfully!
            </span>
          )}
        </div>
      </div>
    </ConfigCard>
  );
}