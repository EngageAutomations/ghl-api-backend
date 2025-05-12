import { useState, useEffect } from "react";
import { useConfig } from "@/context/ConfigContext";
import { CustomSwitch } from "@/components/ui/custom-switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
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
import { cssUpdateEmitter } from "@/lib/events";

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

                {/* URL Configuration for Popup/Link - only shown for popup and URL types */}
                {buttonType !== "download" && (
                  <div className="space-y-2">
                    <Label htmlFor="popup-url" className="flex items-center gap-2">
                      {buttonType === "popup" ? "Embed Code" : "URL"}
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
                    
                    {/* Input for popup/URL configuration */}
                    <div className={buttonType === "popup" ? "flex flex-col" : "rounded-md"}>
                      {buttonType === "popup" ? (
                        <>
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
                          
                          {/* UTM Parameter Tracking for Popup Embed */}
                          <div className="space-y-4 mt-6 pt-4 border-t border-slate-200">
                            <h4 className="text-sm font-medium text-slate-800">Popup UTM Parameter Tracking</h4>
                            <p className="text-xs text-slate-500">
                              Configure how listing data is tracked in your popup iframe source URL
                            </p>
                            
                            {/* Custom Field Name */}
                            <div className="space-y-2">
                              <Label htmlFor="popup-param-name">Parameter Name</Label>
                              <Input 
                                id="popup-param-name"
                                value={config.popupParamName ?? ""}
                                onChange={(e) => updateConfig({ popupParamName: e.target.value })}
                                placeholder="e.g., listing_id"
                              />
                              <p className="text-xs text-slate-500">
                                Enter the URL parameter name that will be added to your popup iframe src
                              </p>
                            </div>
                            
                            <div className="p-4 bg-slate-50 rounded-md border border-slate-200 mt-2">
                              <h5 className="text-sm font-medium flex items-center gap-1.5 text-slate-800">
                                <InfoCircledIcon className="h-4 w-4 text-blue-500" />
                                How popup iframe tracking works
                              </h5>
                              <ol className="text-xs text-slate-600 space-y-1.5 mt-2 list-decimal pl-4">
                                <li>The system will look for an iframe in your embed code</li>
                                <li>It will automatically add the listing slug as a parameter to the iframe src URL</li>
                                <li>Example: If your iframe src is "https://example.com/form" and parameter name is "listing_id"</li>
                                <li>The result will be "https://example.com/form?listing_id=your-listing-slug"</li>
                                <li>This allows your form to capture which listing the submission came from</li>
                              </ol>
                            </div>
                          </div>
                        </>
                      ) : (
                        <Input 
                          id="popup-url"
                          value={localUrlValue}
                          onChange={(e) => {
                            const newValue = e.target.value;
                            console.log("URL changed to:", newValue);
                            setLocalUrlValue(newValue);
                          }}
                          placeholder="Enter URL here"
                          className="flex-1"
                        />
                      )}
                    </div>
                    
                    <p className="text-xs text-slate-500">
                      {buttonType === "popup" 
                        ? "This embed code will be shown in a popup window when the button is clicked." 
                        : "This URL will open in a new window when the button is clicked."}
                      {" Use {\"business_name\"} to insert the business name for tracking."}
                    </p>
                  </div>
                )}
                
                {/* Download Link Information - shown for download type */}
                {buttonType === "download" && (
                  <div className="space-y-2">
                    <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-800 border border-blue-100">
                      <div className="flex items-start gap-2">
                        <InfoCircledIcon className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium mb-1">Download links moved to listing form</p>
                          <p className="text-xs text-blue-700">
                            Download links are now configured directly in each listing's form. This allows for unique download files per listing with automatic link conversion.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-xs text-slate-500">
                      When you select "download" as the button type, each listing can have its own download file. Configure this when editing individual listings.
                    </p>
                  </div>
                )}

                {/* Popup Close Button Configuration */}
                {buttonType === "popup" && (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="close-button-type">Close Button Type</Label>
                      <Select 
                        value={config.closeButtonType ?? "x"}
                        onValueChange={(value) => updateConfig({ closeButtonType: value })}
                      >
                        <SelectTrigger id="close-button-type">
                          <SelectValue placeholder="Select button type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="x">X Symbol</SelectItem>
                          <SelectItem value="text">Text Button</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-slate-500">
                        Choose between an X symbol or a text button to close the popup
                      </p>
                    </div>
                    
                    {config.closeButtonType === "text" && (
                      <div className="space-y-2">
                        <Label htmlFor="close-button-text">Close Button Text</Label>
                        <Input 
                          id="close-button-text"
                          value={config.closeButtonText ?? "Close"}
                          onChange={(e) => updateConfig({ closeButtonText: e.target.value })}
                          placeholder="e.g., Close"
                        />
                        <p className="text-xs text-slate-500">
                          Text to display on the close button
                        </p>
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <Label htmlFor="close-button-position">Position</Label>
                      <Select 
                        value={config.closeButtonPosition ?? "top-right"}
                        onValueChange={(value) => updateConfig({ closeButtonPosition: value })}
                      >
                        <SelectTrigger id="close-button-position">
                          <SelectValue placeholder="Select position" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="top-right">Top Right</SelectItem>
                          <SelectItem value="top-left">Top Left</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-slate-500">
                        Where to position the close button on the popup
                      </p>
                    </div>
                    
                    {/* Close Button Background Color */}
                    <div className="space-y-2">
                      <Label htmlFor="close-button-bg-color">Background Color</Label>
                      <div className="flex rounded-md overflow-hidden">
                        <div className="flex items-center justify-center">
                          <Input 
                            id="close-button-bg-color-picker"
                            type="color"
                            value={config.closeButtonBgColor ?? "#333333"}
                            onChange={(e) => updateConfig({ closeButtonBgColor: e.target.value })}
                            className="w-16 h-10 p-0 m-0 cursor-pointer border-slate-300"
                          />
                        </div>
                        <Input 
                          id="close-button-bg-color"
                          type="text"
                          value={config.closeButtonBgColor ?? "#333333"}
                          onChange={(e) => updateConfig({ closeButtonBgColor: e.target.value })}
                          className="flex-1"
                          placeholder="#333333"
                        />
                      </div>
                      <p className="text-xs text-slate-500">
                        {config.closeButtonType === "x" ? "Circle background color for the X" : "Background color for the close button"}
                      </p>
                    </div>
                    
                    {/* Close Button Text Color */}
                    <div className="space-y-2">
                      <Label htmlFor="close-button-text-color">Text Color</Label>
                      <div className="flex rounded-md overflow-hidden">
                        <div className="flex items-center justify-center">
                          <Input 
                            id="close-button-text-color-picker"
                            type="color"
                            value={config.closeButtonTextColor ?? "#FFFFFF"}
                            onChange={(e) => updateConfig({ closeButtonTextColor: e.target.value })}
                            className="w-16 h-10 p-0 m-0 cursor-pointer border-slate-300"
                          />
                        </div>
                        <Input 
                          id="close-button-text-color"
                          type="text"
                          value={config.closeButtonTextColor ?? "#FFFFFF"}
                          onChange={(e) => updateConfig({ closeButtonTextColor: e.target.value })}
                          className="flex-1"
                          placeholder="#FFFFFF"
                        />
                      </div>
                      <p className="text-xs text-slate-500">
                        {config.closeButtonType === "x" ? "Color of the X symbol" : "Text color for the close button"}
                      </p>
                    </div>
                    
                    {/* Close Button Preview */}
                    <div className="space-y-2 pb-2">
                      <Label>Close Button Preview</Label>
                      <div className="border border-slate-200 rounded-md p-4 bg-slate-50 flex justify-center">
                        {config.closeButtonType === "x" ? (
                          <div 
                            className="h-8 w-8 rounded-full flex items-center justify-center text-sm"
                            style={{ 
                              backgroundColor: config.closeButtonBgColor || "#333333",
                              color: config.closeButtonTextColor || "#FFFFFF"
                            }}
                          >
                            ×
                          </div>
                        ) : (
                          <div 
                            className="py-1.5 px-3 rounded-md inline-flex items-center justify-center text-sm"
                            style={{ 
                              backgroundColor: config.closeButtonBgColor || "#333333",
                              color: config.closeButtonTextColor || "#FFFFFF"
                            }}
                          >
                            {config.closeButtonText || "Close"}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="p-4 bg-amber-50 rounded-md border border-amber-200">
                      <div className="flex items-start">
                        <InfoCircledIcon className="h-5 w-5 text-amber-500 mt-0.5 mr-2 flex-shrink-0" />
                        <p className="text-xs text-amber-800">
                          The popup will automatically size to match the iframe content exactly, 
                          with just enough margin to fit the close button. No need to set 
                          specific dimensions.
                        </p>
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
                        // The URL/embed code is only relevant for non-download types
                        if (buttonType !== "download") {
                          // Update the global config with local URL value
                          updateConfig({ buttonUrl: localUrlValue });
                        } else {
                          // For download type, just clear the URL since it's handled by listing forms
                          updateConfig({ buttonUrl: "" });
                        }
                        
                        // Immediately save the enableActionButton flag to ensure it's true
                        // when other components observe changes
                        updateConfig({ 
                          enableActionButton: true,
                          enableEmbeddedForm: false
                        });
                        
                        // Collect the current configuration after updates
                        const updatedConfig = {
                          ...config,
                          enableActionButton: true,
                          enableEmbeddedForm: false,
                          buttonType: buttonType,
                          buttonUrl: buttonType !== "download" ? localUrlValue : "",
                          buttonLabel: previewButtonText,
                          buttonColor: previewColor,
                          buttonTextColor: previewTextColor,
                          buttonBorderRadius: previewBorderRadius,
                          closeButtonType: config.closeButtonType || "x",
                          closeButtonText: config.closeButtonText || "Close",
                          closeButtonPosition: config.closeButtonPosition || "top-right",
                          closeButtonBgColor: config.closeButtonBgColor || "#333333",
                          closeButtonTextColor: config.closeButtonTextColor || "#FFFFFF"
                        };
                        
                        // Directly trigger CSS update with the new config
                        console.log("Emitting CSS update event from Action Button save with:", updatedConfig);
                        cssUpdateEmitter.emit(updatedConfig);
                        
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

                {/* Form Tracking Configuration */}
                <div className="space-y-4 mt-6 pt-4 border-t border-slate-200">
                  <h4 className="text-sm font-medium text-slate-800">Form Tracking Configuration</h4>
                  <p className="text-xs text-slate-500">
                    Configure tracking for both form fields and iframe parameters
                  </p>
                  
                  {/* Custom Field Name */}
                  <div className="space-y-2">
                    <Label htmlFor="custom-field-name" className="flex items-center gap-2">
                      Form Field Name
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <InfoCircledIcon className="h-4 w-4 text-slate-500" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">
                              Used for hidden fields in HTML forms
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </Label>
                    <Input 
                      id="custom-field-name"
                      value={config.customFormFieldName ?? ""}
                      onChange={(e) => updateConfig({ customFormFieldName: e.target.value })}
                      placeholder="e.g., product_slug"
                    />
                    <p className="text-xs text-slate-500">
                      Enter the exact field name you created in Go HighLevel to track listing data
                    </p>
                  </div>
                  
                  {/* Iframe Parameter Name */}
                  <div className="space-y-2 mt-4">
                    <Label htmlFor="form-param-name" className="flex items-center gap-2">
                      Iframe URL Parameter
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <InfoCircledIcon className="h-4 w-4 text-slate-500" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">
                              Used for URL parameters in iframe src attributes
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </Label>
                    <Input 
                      id="form-param-name"
                      value={config.formParamName ?? ""}
                      onChange={(e) => updateConfig({ formParamName: e.target.value })}
                      placeholder="e.g., listing_id"
                    />
                    <p className="text-xs text-slate-500">
                      Parameter name that will be added to iframe URLs in embedded forms
                    </p>
                  </div>
                  
                  <div className="p-4 bg-slate-50 rounded-md border border-slate-200 mt-2">
                    <h5 className="text-sm font-medium flex items-center gap-1.5 text-slate-800">
                      <InfoCircledIcon className="h-4 w-4 text-blue-500" />
                      How tracking works
                    </h5>
                    <ol className="text-xs text-slate-600 space-y-1.5 mt-2 list-decimal pl-4">
                      <li>For HTML forms: hidden fields are added with your configured field name</li>
                      <li>For iframes: URL parameters are added to the src attribute</li>
                      <li>Both methods will capture the listing slug for analytics</li>
                      <li>Additional data like timestamps are also included</li>
                    </ol>
                    <p className="text-xs mt-3 text-slate-600">
                      This dual-tracking approach ensures that regardless of form implementation method,
                      you'll always capture which listing the form submission came from.
                    </p>
                  </div>
                </div>
                
                {/* Save Button for Embedded Form */}
                <div className="mt-6 flex justify-end">
                  <Button 
                    size="sm"
                    onClick={() => {
                      // Immediately save the enableEmbeddedForm flag to ensure it's true
                      // when other components observe changes
                      updateConfig({ 
                        enableEmbeddedForm: true,
                        enableActionButton: false
                      });
                      
                      // Collect the current configuration after updates
                      const updatedConfig = {
                        ...config,
                        enableEmbeddedForm: true,
                        enableActionButton: false,
                        formEmbedUrl: config.formEmbedUrl || ""
                      };
                      
                      // Directly trigger CSS update with the new config
                      console.log("Emitting CSS update event from Embedded Form save with:", updatedConfig);
                      cssUpdateEmitter.emit(updatedConfig);
                      
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