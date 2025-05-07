import { useState, useEffect } from "react";
import { useConfig } from "@/context/ConfigContext";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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

export default function ActionButtonsConfig() {
  const { config, updateConfig } = useConfig();
  const [showCustomCss, setShowCustomCss] = useState(config.buttonStyle === "custom");
  
  useEffect(() => {
    setShowCustomCss(config.buttonStyle === "custom");
  }, [config.buttonStyle]);
  
  return (
    <ConfigCard 
      title="Action Button Configuration"
      description="Configure the action button that will appear on your product listings"
    >
      <div className="space-y-6">
        {/* Button Enable Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-medium text-slate-800">Enable Action Button</h3>
            <p className="text-sm text-slate-500">Show a custom action button on product listings</p>
          </div>
          <Switch 
            checked={config.enableActionButton} 
            onCheckedChange={(checked) => updateConfig({ enableActionButton: checked })}
          />
        </div>

        {/* Button Type Selector */}
        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="button-type">Button Type</Label>
            <Select 
              value={config.buttonType}
              onValueChange={(value) => updateConfig({ buttonType: value })}
            >
              <SelectTrigger id="button-type">
                <SelectValue placeholder="Select button type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popup">Popup</SelectItem>
                <SelectItem value="link">Link</SelectItem>
                <SelectItem value="download">Download</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="button-label">Button Label</Label>
            <Input 
              id="button-label"
              value={config.buttonLabel}
              onChange={(e) => updateConfig({ buttonLabel: e.target.value })}
              placeholder="Contact Us"
            />
          </div>
        </div>

        {/* URL Configuration for Popup/Link */}
        <div className="space-y-2">
          <Label htmlFor="popup-url" className="flex items-center gap-2">
            {config.buttonType === "popup" ? "Popup URL" : "Link URL"}
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
          <div className="flex rounded-md">
            <Input 
              id="popup-url"
              value={config.buttonUrl || ""}
              onChange={(e) => updateConfig({ buttonUrl: e.target.value })}
              placeholder="https://forms.example.com/contact?product={product_name}"
              className="flex-1"
            />
          </div>
          <p className="text-xs text-slate-500">
            This URL will be loaded in a {config.buttonType === "popup" ? "popup" : "new window"}. 
            Use {"{product_name}"} to insert the product name for UTM tracking.
          </p>
        </div>

        {/* Popup Size Configuration */}
        {config.buttonType === "popup" && (
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="popup-width">Popup Width</Label>
              <div className="flex rounded-md">
                <Input 
                  id="popup-width"
                  type="number"
                  min="300"
                  max="1200"
                  value={config.popupWidth}
                  onChange={(e) => updateConfig({ popupWidth: parseInt(e.target.value) || 600 })}
                  className="flex-1"
                />
                <div className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-slate-300 bg-slate-50 text-slate-500 text-sm">
                  px
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="popup-height">Popup Height</Label>
              <div className="flex rounded-md">
                <Input 
                  id="popup-height"
                  type="number"
                  min="300"
                  max="1000"
                  value={config.popupHeight}
                  onChange={(e) => updateConfig({ popupHeight: parseInt(e.target.value) || 500 })}
                  className="flex-1"
                />
                <div className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-slate-300 bg-slate-50 text-slate-500 text-sm">
                  px
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Button Style Configuration */}
        <div className="space-y-2">
          <Label htmlFor="button-style">Button Style</Label>
          <Select 
            value={config.buttonStyle}
            onValueChange={(value) => {
              updateConfig({ buttonStyle: value });
              setShowCustomCss(value === "custom");
            }}
          >
            <SelectTrigger id="button-style">
              <SelectValue placeholder="Select button style" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="primary">Primary</SelectItem>
              <SelectItem value="secondary">Secondary</SelectItem>
              <SelectItem value="outline">Outline</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Custom CSS */}
        {showCustomCss && (
          <div className="space-y-2">
            <Label htmlFor="custom-css">Custom CSS Classes</Label>
            <Input 
              id="custom-css"
              value={config.customCss || ""}
              onChange={(e) => updateConfig({ customCss: e.target.value })}
              placeholder="e.g. my-custom-button text-lg"
            />
            <p className="text-xs text-slate-500">
              Add your own custom CSS classes for the button
            </p>
          </div>
        )}
      </div>
    </ConfigCard>
  );
}
