import { useConfig } from "@/context/ConfigContext";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ConfigCard } from "../ui/config-card";
import { InfoCircledIcon } from "@radix-ui/react-icons";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function AdvancedStylingConfig() {
  const { config, updateConfig } = useConfig();
  
  return (
    <ConfigCard 
      title="Advanced Styling"
      description="Add custom CSS to further customize your listings"
    >
      <div className="space-y-6">
        <p className="text-sm text-slate-500">
          Use custom CSS to precisely control the appearance of elements in your directory listings
        </p>
        
        <div className="space-y-2">
          <Label htmlFor="custom-css-code" className="flex items-center gap-2">
            Custom CSS
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <InfoCircledIcon className="h-4 w-4 text-slate-500" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    Add CSS code to customize your listings beyond the standard options
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Label>
          <Textarea 
            id="custom-css-code"
            value={config.customCssCode || ""}
            onChange={(e) => updateConfig({ customCssCode: e.target.value })}
            placeholder=".product-price { display: none; }
.product-description { font-size: 16px; }
.product-title { color: #336699; }"
            className="font-mono text-sm"
            rows={8}
          />
          <p className="text-xs text-slate-500">
            Advanced: Use CSS to modify colors, fonts, sizes, and more. Changes apply to all listings.
          </p>
        </div>
      </div>
    </ConfigCard>
  );
}