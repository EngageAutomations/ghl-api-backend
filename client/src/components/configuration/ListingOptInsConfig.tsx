import { useState, useEffect } from "react";
import { useConfig } from "@/context/ConfigContext";
import { AnimatedSwitch } from "@/components/ui/animated-switch";
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ListingOptInsConfig() {
  const { config, updateConfig } = useConfig();
  const [showCustomCss, setShowCustomCss] = useState(config.buttonStyle === "custom");
  const [activeSection, setActiveSection] = useState<string | undefined>(
    config.enableActionButton ? "action-button" : 
    config.enableEmbeddedForm ? "embedded-form" : 
    undefined
  );
  const { toast } = useToast();
  
  useEffect(() => {
    setShowCustomCss(config.buttonStyle === "custom");
  }, [config.buttonStyle]);
  
  // Handle toggling of opt-in methods to ensure only one is active
  const handleToggleActionButton = (checked: boolean) => {
    if (checked) {
      // If enabling action button, disable embedded form
      updateConfig({ 
        enableActionButton: true, 
        enableEmbeddedForm: false 
      });
      setActiveSection("action-button");
      toast({
        title: "Action Button Enabled",
        description: "Embedded Form has been automatically disabled.",
      });
    } else {
      // Just disable action button
      updateConfig({ enableActionButton: false });
      setActiveSection(undefined);
    }
  };
  
  const handleToggleEmbeddedForm = (checked: boolean) => {
    if (checked) {
      // If enabling embedded form, disable action button
      updateConfig({ 
        enableEmbeddedForm: true, 
        enableActionButton: false 
      });
      setActiveSection("embedded-form");
      toast({
        title: "Embedded Form Enabled",
        description: "Action Button has been automatically disabled.",
      });
    } else {
      // Just disable embedded form
      updateConfig({ enableEmbeddedForm: false });
      setActiveSection(undefined);
    }
  };
  
  return (
    <ConfigCard 
      title="Listing Opt-Ins Configuration"
      description="Configure opt-in options that will appear on your business listings (only one method can be active at a time)"
    >
      <div className="space-y-8">
        <Accordion 
          type="single" 
          collapsible 
          className="w-full border rounded-md"
          value={activeSection}
          onValueChange={setActiveSection}
        >
          <AccordionItem value="action-button" className="border-b-0 px-4">
            <AccordionTrigger className="py-4 hover:no-underline">
              <div className="flex justify-between items-center w-full">
                <div className="flex items-center gap-4">
                  <div>
                    <h3 className="text-base font-medium text-slate-800 text-left">Action Button Opt-In</h3>
                    <p className="text-sm text-slate-500 text-left">Configure a call-to-action button for listings</p>
                  </div>
                </div>
                <AnimatedSwitch 
                  checked={config.enableActionButton || false}
                  onCheckedChange={handleToggleActionButton}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-4 pt-2">
              <div className="space-y-6">
                {/* Button Type Selector */}
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="button-type">Opt-In Type</Label>
                    <Select 
                      value={config.buttonType}
                      onValueChange={(value) => updateConfig({ buttonType: value })}
                    >
                      <SelectTrigger id="button-type">
                        <SelectValue placeholder="Select opt-in type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="popup">Popup Form</SelectItem>
                        <SelectItem value="link">External Link</SelectItem>
                        <SelectItem value="download">Resource Download</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="button-label">Button Text</Label>
                    <Input 
                      id="button-label"
                      value={config.buttonLabel}
                      onChange={(e) => updateConfig({ buttonLabel: e.target.value })}
                      placeholder="Get Updates"
                    />
                  </div>
                </div>

                {/* URL Configuration for Popup/Link */}
                <div className="space-y-2">
                  <Label htmlFor="popup-url" className="flex items-center gap-2">
                    {config.buttonType === "popup" ? "Form URL" : "Destination URL"}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <InfoCircledIcon className="h-4 w-4 text-slate-500" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">
                            Supports {"{business_name}"} token that will be replaced with actual business name for tracking.
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
                      placeholder="https://forms.example.com/signup?business={business_name}"
                      className="flex-1"
                    />
                  </div>
                  <p className="text-xs text-slate-500">
                    This URL will be loaded in a {config.buttonType === "popup" ? "popup" : "new window"}. 
                    Use {"{business_name}"} to insert the business name for tracking.
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
                          value={config.popupWidth || 600}
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
                          value={config.popupHeight || 500}
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
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <Accordion 
          type="single" 
          collapsible 
          className="w-full border rounded-md"
          value={activeSection}
          onValueChange={setActiveSection}
        >
          <AccordionItem value="embedded-form" className="border-b-0 px-4">
            <AccordionTrigger className="py-4 hover:no-underline">
              <div className="flex justify-between items-center w-full">
                <div className="flex items-center gap-4">
                  <div>
                    <h3 className="text-base font-medium text-slate-800 text-left">Embedded Form Opt-In</h3>
                    <p className="text-sm text-slate-500 text-left">Configure a form embedded directly on the listing page</p>
                  </div>
                </div>
                <AnimatedSwitch 
                  checked={config.enableEmbeddedForm || false}
                  onCheckedChange={handleToggleEmbeddedForm}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-4 pt-2">
              <div className="space-y-6">
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
                            Supports {"{business_name}"} token that will be replaced with actual business name for tracking.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </Label>
                  <Input 
                    id="form-embed-url"
                    value={config.formEmbedUrl || ""}
                    onChange={(e) => updateConfig({ formEmbedUrl: e.target.value })}
                    placeholder="https://forms.example.com/embed?business={business_name}"
                  />
                  <p className="text-xs text-slate-500">
                    This form will be embedded directly on the listing page. Use {"{business_name}"} for tracking.
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
                      <SelectItem value="Below Business Description">Below Business Description</SelectItem>
                      <SelectItem value="Above Business Description">Above Business Description</SelectItem>
                      <SelectItem value="Bottom of Page">Bottom of Page</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </ConfigCard>
  );
}