import { ConfigCard } from "@/components/ui/config-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DirectoryNameConfigProps {
  directoryName: string;
  onChange: (value: string) => void;
}

export default function DirectoryNameConfig({ directoryName, onChange }: DirectoryNameConfigProps) {
  return (
    <ConfigCard 
      title="Directory Name Configuration"
    >
      <div className="space-y-4">
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
            onChange={(e) => onChange(e.target.value)}
            className="max-w-md"
          />
          <p className="text-sm text-slate-500">
            Use a unique name to identify this directory. Should be lowercase with no spaces (hyphens recommended).
          </p>
        </div>
      </div>
    </ConfigCard>
  );
}