import { useConfig } from "@/context/ConfigContext";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InfoCircledIcon } from "@radix-ui/react-icons";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ConfigCard } from "../ui/config-card";

export default function EmbeddedFormConfig() {
  const { config, updateConfig } = useConfig();
  
  return (
    <ConfigCard 
      title="Embedded Form Configuration"
      description="Configure a form to embed directly on your product listing pages"
    >
      <div className="space-y-6">
        {/* Form Enable Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-medium text-slate-800">Enable Embedded Form</h3>
            <p className="text-sm text-slate-500">Show a form directly on the product listing page</p>
          </div>
          <Switch 
            checked={config.enableEmbeddedForm} 
            onCheckedChange={(checked) => updateConfig({ enableEmbeddedForm: checked })}
          />
        </div>

        {/* Form URL Configuration */}
        <div className="space-y-2">
          <Label htmlFor="form-embed-url" className="flex items-center gap-2">
            Form Embed URL
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <InfoCircledIcon className="h-4 w-4 text-slate-500" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    Supports {"{product_name}"} token that will be replaced with actual product name for UTM tracking.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Label>
          <Input 
            id="form-embed-url"
            value={config.formEmbedUrl || ""}
            onChange={(e) => updateConfig({ formEmbedUrl: e.target.value })}
            placeholder="https://forms.example.com/embed?product={product_name}"
          />
          <p className="text-xs text-slate-500">
            This form will be embedded directly on the product page. Use {"{product_name}"} for UTM tracking.
          </p>
        </div>

        {/* Fallback Message Configuration */}
        <div className="space-y-2">
          <Label htmlFor="form-fallback">Fallback Message</Label>
          <Textarea 
            id="form-fallback"
            value={config.formFallback || ""}
            onChange={(e) => updateConfig({ formFallback: e.target.value })}
            placeholder="Unable to load the form. Please try again later or contact us directly."
            rows={3}
          />
          <p className="text-xs text-slate-500">
            This message will be shown if the form fails to load
          </p>
        </div>

        {/* Form Position Configuration */}
        <div className="space-y-2">
          <Label htmlFor="form-position">Form Position</Label>
          <Select 
            value={config.formPosition}
            onValueChange={(value) => updateConfig({ formPosition: value })}
          >
            <SelectTrigger id="form-position">
              <SelectValue placeholder="Select form position" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Below Product Description">Below Product Description</SelectItem>
              <SelectItem value="Above Product Description">Above Product Description</SelectItem>
              <SelectItem value="Bottom of Page">Bottom of Page</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </ConfigCard>
  );
}
