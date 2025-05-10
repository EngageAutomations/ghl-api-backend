import { useState, useEffect } from "react";
import { useConfig } from "@/context/ConfigContext";
import { CustomSwitch } from "@/components/ui/custom-switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InfoCircledIcon, ReloadIcon, Link1Icon, ExternalLinkIcon, CheckIcon } from "@radix-ui/react-icons";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { convertToDirectDownloadLink } from "@/lib/utils";
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
  const [buttonType, setButtonType] = useState(config.buttonType ?? "popup");
  const [localUrlValue, setLocalUrlValue] = useState(config.buttonUrl ?? "");
  const [convertedUrl, setConvertedUrl] = useState("");
  const [conversionInfo, setConversionInfo] = useState<{wasConverted: boolean; provider?: string}>({wasConverted: false});
  const [isChecking, setIsChecking] = useState(false);
  const [showConversionError, setShowConversionError] = useState(false);
  
  // Button preview state
  const [previewColor, setPreviewColor] = useState(config.buttonColor ?? "#4F46E5");
  const [previewTextColor, setPreviewTextColor] = useState(config.buttonTextColor ?? "#FFFFFF");
  const [previewBorderRadius, setPreviewBorderRadius] = useState(config.buttonBorderRadius ?? 4);
  const [previewButtonText, setPreviewButtonText] = useState(config.buttonLabel ?? "Contact Us");
  
  // Keep preview in sync with config changes
  useEffect(() => {
    setPreviewColor(config.buttonColor ?? "#4F46E5");
    setPreviewTextColor(config.buttonTextColor ?? "#FFFFFF");
    setPreviewBorderRadius(config.buttonBorderRadius ?? 4);
    setPreviewButtonText(config.buttonLabel ?? "Contact Us");
  }, [config.buttonColor, config.buttonTextColor, config.buttonBorderRadius, config.buttonLabel]);
  
  // Type assertion helper for form elements
  const getConfigValue = <T extends string>(value: T | string | null | undefined, defaultValue: T): T => {
    return (value as T) || defaultValue;
  };
  
  // Single source of truth for which opt-in method is selected
  const [selectedOptIn, setSelectedOptIn] = useState<"action-button" | "embedded-form" | null>(
    config.enableActionButton ? "action-button" : 
    config.enableEmbeddedForm ? "embedded-form" : 
    null
  );
  
  // Separate state for accordion expansion
  const [expandedSection, setExpandedSection] = useState<string | undefined>(undefined);
  const { toast } = useToast();
  
  useEffect(() => {
    setShowCustomCss(config.buttonStyle === "custom");
  }, [config.buttonStyle]);
  
  // Update buttonType and localUrl state when config changes
  useEffect(() => {
    setButtonType(config.buttonType ?? "popup");
    console.log("Updated buttonType from config:", config.buttonType);
    
    // Clear conversion state when changing away from download type
    if (config.buttonType !== "download") {
      setConvertedUrl("");
      setConversionInfo({ wasConverted: false });
    }
  }, [config.buttonType]);
  
  // Update local URL value when config.buttonUrl changes
  useEffect(() => {
    setLocalUrlValue(config.buttonUrl ?? "");
  }, [config.buttonUrl]);
  
  // Completely disable auto-checking to avoid issues with user input
  // This effect has been intentionally disabled to prevent interference with text input
  // Users will need to manually click the button to convert URLs
  useEffect(() => {
    // This auto-check feature is now disabled
    // It was causing conflicts with user input
    return;
  }, [buttonType, config.buttonUrl, convertedUrl, isChecking]);
  
  // Sync with config once on load and clear any example URLs
  useEffect(() => {
    // Set initial expanded section based on what's enabled
    if (config.enableActionButton) {
      setExpandedSection("action-button");
    } else if (config.enableEmbeddedForm) {
      setExpandedSection("embedded-form");
    }
    
    // Clear any default or example URLs that might be saved
    if (config.buttonUrl && (
      config.buttonUrl.includes("example.com") || 
      config.buttonUrl.includes("{product_name}")
    )) {
      updateConfig({ buttonUrl: "" });
      setLocalUrlValue("");
    }
    
    if (config.formEmbedUrl && config.formEmbedUrl.includes("example.com")) {
      updateConfig({ formEmbedUrl: "" });
    }
  }, [config.buttonUrl, config.formEmbedUrl, updateConfig]);
  
  // Effect to sync the selectedOptIn state with the config
  useEffect(() => {
    // Update the config when selectedOptIn changes
    if (selectedOptIn === "action-button") {
      updateConfig({ 
        enableActionButton: true, 
        enableEmbeddedForm: false 
      });
    } else if (selectedOptIn === "embedded-form") {
      updateConfig({ 
        enableActionButton: false, 
        enableEmbeddedForm: true 
      });
    } else if (selectedOptIn === null) {
      updateConfig({ 
        enableActionButton: false, 
        enableEmbeddedForm: false 
      });
    }
  }, [selectedOptIn, updateConfig]);
  
  // Simple toggle handlers - just change selectedOptIn state
  const handleToggleActionButton = (checked: boolean) => {
    console.log("Action Button toggle:", checked);
    if (checked) {
      setSelectedOptIn("action-button");
      // Only expand if user explicitly clicks on the header, not the toggle
      // setExpandedSection("action-button");
      toast({
        title: "Action Button Enabled",
        description: "Embedded Form has been automatically disabled.",
      });
    } else {
      setSelectedOptIn(null);
      // setExpandedSection(undefined);
    }
  };
  
  const handleToggleEmbeddedForm = (checked: boolean) => {
    console.log("Embedded Form toggle:", checked);
    if (checked) {
      setSelectedOptIn("embedded-form");
      // Only expand if user explicitly clicks on the header, not the toggle
      // setExpandedSection("embedded-form");
      toast({
        title: "Embedded Form Enabled",
        description: "Action Button has been automatically disabled.",
      });
    } else {
      setSelectedOptIn(null);
      // setExpandedSection(undefined);
    }
  };
  
  // Function to handle download link conversion
  const handleCheckDownloadLink = () => {
    const url = localUrlValue;
    if (!url) {
      toast({
        title: "No URL to Check",
        description: "Please enter a URL first.",
      });
      return;
    }
    
    setIsChecking(true);
    
    try {
      const result = convertToDirectDownloadLink(url);
      console.log('Conversion result:', result);
      setConvertedUrl(result.convertedUrl);
      setConversionInfo({
        wasConverted: result.wasConverted,
        provider: result.provider
      });
      
      if (result.wasConverted) {
        // Update local state first
        setLocalUrlValue(result.convertedUrl);
        // Then update the global config
        updateConfig({ buttonUrl: result.convertedUrl });
        toast({
          title: "Link Converted Successfully",
          description: `Your ${result.provider} link has been optimized for direct download. Check console for details.`,
        });
      } else if (result.provider) {
        // For non-supported providers, we'll still mark as "converted" to allow saving
        setConversionInfo({
          wasConverted: true,
          provider: result.provider
        });
        toast({
          title: "Link Accepted",
          description: `We'll use your ${result.provider} link as-is. This provider is not optimized for direct downloads, but we'll still allow it.`,
        });
      } else {
        // For direct links or unknown providers, mark as "converted" to allow saving
        setConversionInfo({
          wasConverted: true,
          provider: "Unknown"
        });
        toast({
          title: "Link Accepted",
          description: "This appears to be a direct URL. We'll use it as-is.",
        });
      }
    } catch (error) {
      toast({
        title: "Link Check Failed",
        description: "There was a problem verifying your download link.",
        variant: "destructive"
      });
    } finally {
      setIsChecking(false);
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
          value={expandedSection}
          onValueChange={setExpandedSection}
        >
          <AccordionItem value="action-button" className="border-b-0 px-4">
            <div className="flex items-center justify-between py-4">
              {/* Left section: clickable header */}
              <div className="flex-1 cursor-pointer" onClick={() => setExpandedSection(expandedSection === "action-button" ? undefined : "action-button")}>
                <h3 className="text-base font-medium text-slate-800 text-left">Action Button Opt-In</h3>
                <p className="text-sm text-slate-500 text-left">Configure a call-to-action button for listings</p>
              </div>
              
              {/* Right section: toggle switch (outside accordion trigger) */}
              <div className="ml-4" onClick={e => e.stopPropagation()}>
                <CustomSwitch 
                  checked={selectedOptIn === "action-button"}
                  onCheckedChange={handleToggleActionButton}
                />
              </div>
            </div>
            <AccordionContent className="pb-4 pt-2">
              <div className="space-y-6">
                {/* Button Type Selector */}
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="button-type">Opt-In Type</Label>
                    <Select 
                      value={buttonType}
                      onValueChange={(value) => {
                        console.log("Button type changed to:", value);
                        setButtonType(value);
                        updateConfig({ buttonType: value });
                      }}
                    >
                      <SelectTrigger id="button-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="popup">Pop Up Embed</SelectItem>
                        <SelectItem value="link">Website Link</SelectItem>
                        <SelectItem value="download">Direct Download</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="button-label">Button Text</Label>
                    <Input 
                      id="button-label"
                      value={previewButtonText}
                      onChange={(e) => {
                        const value = e.target.value;
                        updateConfig({ buttonLabel: value });
                        setPreviewButtonText(value);
                      }}
                      placeholder="Get Updates"
                    />
                  </div>
                </div>

                {/* URL Configuration for Popup/Link */}
                <div className="space-y-2">
                  <Label htmlFor="popup-url" className="flex items-center gap-2">
                    {buttonType === "popup" ? "Embed Code" : 
                     buttonType === "download" ? "Download Link" :
                     "URL"}
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
                  
                  {/* Input with button for download link conversion */}
                  <div className={`flex ${buttonType === "popup" ? "flex-col" : "rounded-md"} ${buttonType === "download" ? "mb-1" : ""}`}>
                    {buttonType === "popup" ? (
                      <Textarea 
                        id="popup-url"
                        value={localUrlValue}
                        onChange={(e) => {
                          const newValue = e.target.value;
                          setLocalUrlValue(newValue);
                        }}
                        placeholder="Paste your embed code here (HTML, iFrame, etc.)"
                        className="flex-1 min-h-[120px] font-mono text-xs"
                      />
                    ) : (
                      <Input 
                        id="popup-url"
                        value={localUrlValue}
                        onChange={(e) => {
                          const newValue = e.target.value;
                          console.log("URL changed to:", newValue);
                          setLocalUrlValue(newValue);
                          // Reset conversion info when URL changes
                          if (convertedUrl && newValue !== convertedUrl) {
                            setConvertedUrl("");
                            setConversionInfo({ wasConverted: false });
                            // Hide any existing error when user starts typing a new URL
                            setShowConversionError(false);
                          }
                        }}
                        placeholder={buttonType === "download" ? "Paste link here - click Convert button to process before saving" : "Enter URL here"}
                        onKeyDown={(e) => {
                          // Add Enter key handling for download link testing
                          if (e.key === 'Enter' && buttonType === 'download') {
                            e.preventDefault();
                            handleCheckDownloadLink();
                          }
                        }}
                        className="flex-1"
                      />
                    )}
                    
                    {/* Only show conversion button for download links */}
                    {buttonType === "download" && (
                      <Button
                        variant="default"
                        size="sm"
                        type="button"
                        onClick={handleCheckDownloadLink}
                        disabled={isChecking}
                        className="ml-2 flex-shrink-0"
                        title="Convert to direct download link"
                      >
                        {isChecking ? (
                          <ReloadIcon className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <Link1Icon className="h-4 w-4 mr-1" />
                        )}
                        Convert
                      </Button>
                    )}
                  </div>
                  
                  {/* Download link conversion status */}
                  {buttonType === "download" && (
                    <>
                      {conversionInfo.wasConverted && (
                        <div className="rounded-md bg-slate-50 p-2 text-xs text-slate-700 border border-slate-200">
                          <div className="flex items-center gap-1 font-medium text-green-600 mb-1">
                            <CheckIcon className="h-3 w-3" />
                            <span>Link ready for use</span>
                          </div>
                          {/* Used only for Google Drive, Dropbox, etc. with actual conversion */}
                          {localUrlValue !== convertedUrl && convertedUrl && (
                            <p>Original {conversionInfo.provider} link has been converted to a direct download URL.</p>
                          )}
                          {/* Used for other provider types without conversion */}
                          {(localUrlValue === convertedUrl || !convertedUrl) && (
                            <p>{conversionInfo.provider} link will be used as-is.</p>
                          )}
                        </div>
                      )}
                    </>
                  )}
                  
                  <p className="text-xs text-slate-500">
                    {buttonType === "popup" ? 
                      "This embed code will be shown in a popup window when the button is clicked." :
                     buttonType === "download" ? 
                      "You must click the Convert button before saving. For cloud storage links (Google Drive, Dropbox, etc.), we'll optimize them for direct download. For other links, we'll use them as-is." :
                      "This URL will open in a new window when the button is clicked."}
                    {buttonType !== "download" && " Use {\"business_name\"} to insert the business name for tracking."}
                  </p>
                </div>

                {/* Popup Size Configuration */}
                {buttonType === "popup" && (
                  <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="popup-width">Popup Width</Label>
                      <div className="flex rounded-md">
                        <Input 
                          id="popup-width"
                          type="number"
                          min="300"
                          max="1200"
                          value={config.popupWidth ?? 600}
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
                          value={config.popupHeight ?? 500}
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
                <div className="space-y-6 pt-2">

                  {/* Button Preview */}
                  <div className="space-y-2 pb-2">
                    <Label>Button Preview</Label>
                    <div className="border border-slate-200 rounded-md p-4 bg-slate-50 flex justify-center">
                      <div 
                        className="py-2 px-4 inline-flex items-center justify-center text-sm font-medium"
                        style={{ 
                          backgroundColor: previewColor,
                          color: previewTextColor,
                          borderRadius: `${previewBorderRadius}px`,
                          transitionProperty: "all",
                          transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
                          transitionDuration: "150ms",
                        }}
                      >
                        {previewButtonText || "Contact Us"}
                      </div>
                    </div>
                  </div>

                  {/* Button Border Radius */}
                  <div className="space-y-2">
                    <Label htmlFor="button-border-radius">Button Border Radius</Label>
                    <div className="relative rounded-md">
                      <Input 
                        id="button-border-radius"
                        type="number"
                        min="0"
                        max="20"
                        value={previewBorderRadius}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 0;
                          updateConfig({ buttonBorderRadius: value });
                          setPreviewBorderRadius(value);
                        }}
                        className="flex-1 pr-8"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-slate-500 text-sm">
                        px
                      </div>
                    </div>
                    <p className="text-xs text-slate-500">
                      Controls how rounded the button corners are (0 = square corners)
                    </p>
                  </div>

                  {/* Button Background Color */}
                  <div className="space-y-2">
                    <Label htmlFor="button-color">Button Background Color</Label>
                    <div className="flex rounded-md overflow-hidden">
                      <div className="flex items-center justify-center">
                        <Input 
                          id="button-color-picker"
                          type="color"
                          value={previewColor}
                          onChange={(e) => {
                            const value = e.target.value;
                            updateConfig({ buttonColor: value });
                            setPreviewColor(value);
                          }}
                          className="w-16 h-10 p-0 m-0 cursor-pointer border-slate-300"
                        />
                      </div>
                      <Input 
                        id="button-color"
                        type="text"
                        value={previewColor}
                        onChange={(e) => {
                          const value = e.target.value;
                          updateConfig({ buttonColor: value });
                          setPreviewColor(value);
                        }}
                        className="flex-1"
                        placeholder="#4F46E5"
                      />
                    </div>
                    <p className="text-xs text-slate-500">
                      The background color for the button
                    </p>
                  </div>
                  
                  {/* Button Text Color */}
                  <div className="space-y-2">
                    <Label htmlFor="button-text-color">Button Text Color</Label>
                    <div className="flex rounded-md overflow-hidden">
                      <div className="flex items-center justify-center">
                        <Input 
                          id="button-text-color-picker"
                          type="color"
                          value={previewTextColor}
                          onChange={(e) => {
                            const value = e.target.value;
                            updateConfig({ buttonTextColor: value });
                            setPreviewTextColor(value);
                          }}
                          className="w-16 h-10 p-0 m-0 cursor-pointer border-slate-300"
                        />
                      </div>
                      <Input 
                        id="button-text-color"
                        type="text"
                        value={previewTextColor}
                        onChange={(e) => {
                          const value = e.target.value;
                          updateConfig({ buttonTextColor: value });
                          setPreviewTextColor(value);
                        }}
                        className="flex-1"
                        placeholder="#FFFFFF"
                      />
                    </div>
                    <p className="text-xs text-slate-500">
                      The text color for the button
                    </p>
                  </div>

                  {/* Custom CSS */}
                  {showCustomCss && (
                    <div className="space-y-2">
                      <Label htmlFor="custom-css">Custom CSS Classes</Label>
                      <Input 
                        id="custom-css"
                        value={config.customCss ?? ""}
                        onChange={(e) => updateConfig({ customCss: e.target.value })}
                        placeholder="e.g. my-custom-button text-lg"
                      />
                      <p className="text-xs text-slate-500">
                        Add your own custom CSS classes for the button
                      </p>
                    </div>
                  )}
                </div>
                
                {/* Save Button */}
                <div className="mt-6 flex justify-end flex-col">
                  {buttonType === "download" && showConversionError && !conversionInfo.wasConverted && (
                    <div className="mb-2 text-xs text-red-600">
                      You must convert your link using the Convert button before saving
                    </div>
                  )}
                  <div className="flex justify-end">
                    <Button 
                      size="sm"
                      onClick={() => {
                        // For download type, validate that the link has been converted
                        if (buttonType === "download" && !conversionInfo.wasConverted) {
                          setShowConversionError(true);
                          toast({
                            title: "Link Not Converted",
                            description: "You must convert your link using the Convert button before saving",
                            variant: "destructive"
                          });
                          return;
                        }
                        
                        // Update the global config with local URL value
                        updateConfig({ buttonUrl: localUrlValue });
                        
                        // Trigger a customCssCode update by updating it with itself
                        // This will force the AdvancedStylingConfig to regenerate the CSS
                        updateConfig({ 
                          customCssCode: config.customCssCode 
                        });
                        
                        toast({
                          title: "Action Button configuration saved!",
                          description: "Your changes have been applied and CSS code has been updated"
                        });
                        
                        // Reset any error messages
                        setShowConversionError(false);
                      }}
                    >
                      Save
                    </Button>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <Accordion 
          type="single" 
          collapsible 
          className="w-full border rounded-md"
          value={expandedSection}
          onValueChange={setExpandedSection}
        >
          <AccordionItem value="embedded-form" className="border-b-0 px-4">
            <div className="flex items-center justify-between py-4">
              {/* Left section: clickable header */}
              <div className="flex-1 cursor-pointer" onClick={() => setExpandedSection(expandedSection === "embedded-form" ? undefined : "embedded-form")}>
                <h3 className="text-base font-medium text-slate-800 text-left">Embedded Form Opt-In</h3>
                <p className="text-sm text-slate-500 text-left">Configure a form embedded directly on the listing page</p>
              </div>
              
              {/* Right section: toggle switch (outside accordion trigger) */}
              <div className="ml-4" onClick={e => e.stopPropagation()}>
                <CustomSwitch 
                  checked={selectedOptIn === "embedded-form"}
                  onCheckedChange={handleToggleEmbeddedForm}
                />
              </div>
            </div>
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
                    value={config.formEmbedUrl ?? ""}
                    onChange={(e) => updateConfig({ formEmbedUrl: e.target.value })}
                    placeholder="Enter your embed code here"
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
                    value={config.formFallback ?? ""}
                    onChange={(e) => updateConfig({ formFallback: e.target.value })}
                    placeholder="Enter a fallback message to show if the form fails to load"
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
                    value={getConfigValue(config.formPosition, "Below Business Description")}
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
                
                {/* Save Button for Embedded Form */}
                <div className="mt-6 flex justify-end">
                  <Button 
                    size="sm"
                    onClick={() => {
                      // Trigger a customCssCode update by updating it with itself
                      // This will force the AdvancedStylingConfig to regenerate the CSS
                      updateConfig({ 
                        customCssCode: config.customCssCode 
                      });
                      
                      toast({
                        title: "Embedded Form configuration saved!",
                        description: "Your changes have been applied and CSS code has been updated"
                      });
                    }}
                  >
                    Save
                  </Button>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        

      </div>
    </ConfigCard>
  );
}