import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ConfigWizard, WizardStep } from "@/components/ui/config-wizard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion";
import { useState } from "react";

export default function ConfigWizardDemo() {
  // State for the selected opt-in type (action button or embedded form)
  const [selectedOptIn, setSelectedOptIn] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | undefined>(undefined);
  const [buttonType, setButtonType] = useState<string>("popup");
  
  // Button preview state
  const [previewColor, setPreviewColor] = useState("#4F46E5");
  const [previewTextColor, setPreviewTextColor] = useState("#FFFFFF");
  const [previewBorderRadius, setPreviewBorderRadius] = useState(4);
  const [previewButtonText, setPreviewButtonText] = useState("Contact Us");
  
  // Debug handler for color changes
  const handleTextColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    console.log("Setting text color to:", newColor);
    setPreviewTextColor(newColor);
  };
  
  // Toggle handlers
  const handleToggleActionButton = (checked: boolean) => {
    if (checked) {
      setSelectedOptIn("action-button");
    } else {
      setSelectedOptIn(null);
    }
  };
  
  const handleToggleEmbeddedForm = (checked: boolean) => {
    if (checked) {
      setSelectedOptIn("embedded-form");
    } else {
      setSelectedOptIn(null);
    }
  };
  
  return (
    <div className="container mx-auto py-8">
      <ConfigWizard 
        title="Directory Integration Setup Wizard" 
        description="Welcome to the Go HighLevel Directory Integration setup. This wizard will guide you through configuring your marketplace listings with tracking and form integration in just a few simple steps."
      >
        <WizardStep 
          title="Directory Settings" 
          description="Name your directory to get started"
        >
          <div className="space-y-6 py-8">
            <h2 className="text-lg font-bold text-center mb-8">Name your Directory to get started</h2>
            <div className="space-y-3">
              <Input 
                id="directory-name" 
                placeholder="My Marketplace Directory"
                className="text-base py-6"
              />
            </div>
          </div>
        </WizardStep>
        
        <WizardStep 
          title="Listing Opt-Ins" 
          description="Choose how visitors can engage with your listings"
        >
          <div className="space-y-6 py-8">
            <h2 className="text-lg font-bold text-center mb-8">Configure your listing opt-ins</h2>
            
            <div className="space-y-4">
              <p className="text-center text-sm text-slate-600 mb-4">
                Choose one option below for how visitors can engage with your listings
              </p>
              
              <Accordion 
                type="single" 
                collapsible 
                className="w-full space-y-5"
                value={expandedSection}
                onValueChange={setExpandedSection}
              >
                {/* Action Button Accordion Item */}
                <AccordionItem value="action-button" className="px-4 mb-5 border rounded-md">
                  <div className="flex items-center justify-between py-4">
                    {/* Left section: clickable header */}
                    <div className="flex-1 cursor-pointer" onClick={() => setExpandedSection(expandedSection === "action-button" ? undefined : "action-button")}>
                      <h3 className="text-base font-medium text-slate-800 text-left">Action Button Opt-In</h3>
                      <p className="text-sm text-slate-500 text-left">Configure a call-to-action button for listings</p>
                    </div>
                    
                    {/* Right section: toggle switch */}
                    <div className="ml-4" onClick={e => e.stopPropagation()}>
                      <Switch 
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
                            onValueChange={(value) => setButtonType(value)}
                          >
                            <SelectTrigger id="button-type">
                              <SelectValue placeholder="Select button type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="popup">Popup Form</SelectItem>
                              <SelectItem value="url">URL Link</SelectItem>
                              <SelectItem value="download">Download</SelectItem>
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-slate-500">
                            What happens when the button is clicked
                          </p>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="button-text">Button Text</Label>
                          <Input id="button-text" placeholder="Contact Us" defaultValue="Contact Us" />
                          <p className="text-xs text-slate-500">
                            Text displayed on the button
                          </p>
                        </div>
                      </div>
                      
                      {/* URL Configuration - conditional based on button type */}
                      {(buttonType === "popup" || buttonType === "url") && (
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="popup-url">
                              {buttonType === "popup" ? "Popup URL" : "Link URL"}
                            </Label>
                            <div className="flex rounded-md">
                              <Input 
                                id="popup-url"
                                placeholder="https://forms.gohighlevel.com/form?product={product_name}"
                                className="flex-1"
                              />
                            </div>
                            <p className="text-xs text-slate-500">
                              {buttonType === "popup" 
                                ? "This URL will be loaded in a popup window." 
                                : "This URL will open in a new tab."}
                              {" "}Use {"{product_name}"} to insert the product name for tracking.
                            </p>
                          </div>
                          
                          {/* Custom Field for GHL Integration */}
                          <div className="space-y-2 pt-2 border-t border-slate-100">
                            <Label htmlFor="custom-field-name-url">Tracking Field Name</Label>
                            <Input 
                              id="custom-field-name-url" 
                              placeholder="listing"
                              defaultValue="listing"
                              className="flex-1"
                            />
                            <p className="text-xs text-slate-500">
                              Create this custom field in Go HighLevel and add it as a hidden field in your form. 
                              This allows form submissions to have listing information attached.
                            </p>
                            
                            <div className="mt-3 p-3 bg-blue-50 rounded-md border border-blue-100">
                              <p className="text-xs text-blue-800">
                                <span className="font-medium">Important:</span> This field must be created in your Go HighLevel account 
                                before it can be used for tracking. The field will automatically be populated with the 
                                listing slug when visitors submit the form.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Download configuration - if button type is download */}
                      {buttonType === "download" && (
                        <div className="space-y-2">
                          <div className="p-4 bg-amber-50 rounded-md border border-amber-100">
                            <p className="text-sm text-amber-800">
                              Download buttons will be configured individually for each listing.
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {/* Button Preview section */}
                      <div className="space-y-2 pb-2">
                        <Label>Button Preview</Label>
                        <div className="border border-slate-200 rounded-md p-6 bg-slate-50 flex justify-center">
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
                      
                      {/* Button Styling Options */}
                      <div className="space-y-4 mt-6 pt-4 border-t border-slate-200">
                        <h4 className="text-base font-medium text-slate-800">Button Styling</h4>
                        
                        {/* Button Text */}
                        <div className="space-y-2">
                          <Label htmlFor="button-text-2">Button Text</Label>
                          <Input
                            id="button-text-2"
                            value={previewButtonText}
                            onChange={(e) => setPreviewButtonText(e.target.value)}
                            placeholder="Contact Us"
                          />
                        </div>
                        
                        {/* Unified Style Controls */}
                        <div className="border border-slate-200 rounded-lg p-4">
                          <div className="grid grid-cols-5 gap-0">
                            {/* Color Options - Takes up 25% of the space */}
                            <div className="col-span-1 space-y-4 pr-3">
                              {/* Removed Colors title as requested */}
                              {/* Button Color */}
                              <div>
                                <div className="flex items-center justify-between mb-1.5">
                                  <Label htmlFor="button-color" className="text-sm">Button Color</Label>
                                  <div 
                                    className="w-5 h-5 rounded border border-slate-300 cursor-pointer overflow-hidden"
                                    onClick={() => document.getElementById('button-color')?.click()}
                                  >
                                    <div className="w-full h-full" style={{ backgroundColor: previewColor }}></div>
                                  </div>
                                  <Input
                                    id="button-color"
                                    type="color"
                                    value={previewColor}
                                    onChange={(e) => setPreviewColor(e.target.value)}
                                    className="w-0 h-0 opacity-0 absolute"
                                  />
                                </div>
                              </div>
                              
                              {/* Text Color */}
                              <div>
                                <div className="flex items-center justify-between mb-1.5">
                                  <Label htmlFor="text-color" className="text-sm">Text Color</Label>
                                  <div 
                                    className="w-5 h-5 rounded border border-slate-300 cursor-pointer overflow-hidden"
                                    onClick={() => document.getElementById('text-color')?.click()}
                                  >
                                    <div className="w-full h-full" style={{ backgroundColor: previewTextColor }}></div>
                                  </div>
                                  <Input
                                    id="text-color"
                                    type="color"
                                    value={previewTextColor}
                                    onChange={handleTextColorChange}
                                    className="w-0 h-0 opacity-0 absolute"
                                  />
                                </div>
                              </div>
                            </div>
                            
                            {/* Divider - Moved 15px to the right */}
                            <div className="w-px bg-slate-200 h-full ml-4"></div>
                            
                            {/* Border Radius Slider - Takes up remaining space */}
                            <div className="col-span-3 flex flex-col justify-center">
                              <div className="w-full px-6">
                                {/* Removed Shape title as requested */}
                                <div className="flex items-center space-x-3">
                                  <Label htmlFor="border-radius" className="text-sm whitespace-nowrap">Border Radius</Label>
                                  <div className="flex-1">
                                    <input
                                      id="border-radius"
                                      type="range"
                                      min="0"
                                      max="24"
                                      value={previewBorderRadius}
                                      onChange={(e) => setPreviewBorderRadius(parseInt(e.target.value))}
                                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                                    />
                                  </div>
                                  <span className="text-xs text-slate-500 whitespace-nowrap">{previewBorderRadius}px</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                {/* Embedded Form Accordion Item */}
                <AccordionItem value="embedded-form" className="px-4 border rounded-md">
                  <div className="flex items-center justify-between py-4">
                    {/* Left section: clickable header */}
                    <div className="flex-1 cursor-pointer" onClick={() => setExpandedSection(expandedSection === "embedded-form" ? undefined : "embedded-form")}>
                      <h3 className="text-base font-medium text-slate-800 text-left">Embedded Form Opt-In</h3>
                      <p className="text-sm text-slate-500 text-left">Configure a form embedded directly on listing pages</p>
                    </div>
                    
                    {/* Right section: toggle switch */}
                    <div className="ml-4" onClick={e => e.stopPropagation()}>
                      <Switch 
                        checked={selectedOptIn === "embedded-form"}
                        onCheckedChange={handleToggleEmbeddedForm}
                      />
                    </div>
                  </div>
                  
                  <AccordionContent className="pb-4 pt-2">
                    <div className="space-y-6">
                      {/* Form URL */}
                      <div className="space-y-2">
                        <Label htmlFor="form-embed-url">Form Embed URL</Label>
                        <Input
                          id="form-embed-url"
                          placeholder="https://forms.gohighlevel.com/form-embed"
                          className="flex-1"
                        />
                        <p className="text-xs text-slate-500">
                          The URL of your Go HighLevel form to embed on listing pages
                        </p>
                      </div>
                      
                      {/* Tracking Field Name */}
                      <div className="space-y-2 pt-2 border-t border-slate-100">
                        <Label htmlFor="custom-field-name-embed">Tracking Field Name</Label>
                        <Input 
                          id="custom-field-name-embed" 
                          placeholder="listing"
                          defaultValue="listing"
                          className="flex-1"
                        />
                        <p className="text-xs text-slate-500">
                          Create this custom field in Go HighLevel to track which listing generated the lead
                        </p>
                        
                        <div className="mt-3 p-3 bg-blue-50 rounded-md border border-blue-100">
                          <p className="text-xs text-blue-800">
                            <span className="font-medium">Important:</span> You must create this field in your Go HighLevel account 
                            and enable "Capture URL Parameters" in your form settings. The field will automatically 
                            be populated with listing data when visitors submit the form.
                          </p>
                        </div>
                      </div>
                      
                      {/* Form Preview */}
                      <div className="border border-slate-200 rounded-md p-6 bg-slate-50">
                        <div className="text-center text-slate-500">
                          <div className="border-2 border-dashed border-slate-300 p-4 rounded">
                            <p className="mb-2 font-medium">Embedded Form Preview</p>
                            <p className="text-xs mb-4">Your Go HighLevel form will appear here</p>
                            <div className="w-full h-24 bg-slate-100 rounded flex items-center justify-center">
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect><line x1="3" x2="21" y1="9" y2="9"></line><line x1="9" x2="9" y1="21" y2="9"></line></svg>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </WizardStep>
        
        <WizardStep 
          title="Listing Components" 
          description="Configure which components to display on listing pages"
        >
          <div className="space-y-6 py-8">
            <h2 className="text-lg font-bold text-center mb-8">Configure Listing Components</h2>
            
            <div className="space-y-6 max-w-2xl mx-auto">
              <p className="text-sm text-slate-600 text-center mb-6">
                Choose which components to display on your listing pages
              </p>
              
              {/* Component Toggle Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Listing Price */}
                <div className="border border-slate-200 rounded-lg p-4 bg-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="bg-blue-50 p-2 rounded-md">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium">Listing Price</h3>
                        <p className="text-xs text-slate-500">Display product pricing information</p>
                      </div>
                    </div>
                    <Switch defaultChecked id="show-price" />
                  </div>
                </div>
                
                {/* Expanded Description */}
                <div className="border border-slate-200 rounded-lg p-4 bg-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="bg-indigo-50 p-2 rounded-md">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600"><line x1="21" x2="3" y1="6" y2="6" /><line x1="15" x2="3" y1="12" y2="12" /><line x1="17" x2="3" y1="18" y2="18" /></svg>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium">Expanded Description</h3>
                        <p className="text-xs text-slate-500">Show detailed product descriptions</p>
                      </div>
                    </div>
                    <Switch defaultChecked id="show-expanded-description" />
                  </div>
                </div>
                
                {/* Google Maps Widget */}
                <div className="border border-slate-200 rounded-lg p-4 bg-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="bg-green-50 p-2 rounded-md">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium">Google Maps Widget</h3>
                        <p className="text-xs text-slate-500">Display location on an interactive map</p>
                      </div>
                    </div>
                    <Switch defaultChecked id="show-google-maps" />
                  </div>
                </div>
                
                {/* Metadata Bar */}
                <div className="border border-slate-200 rounded-lg p-4 bg-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="bg-amber-50 p-2 rounded-md">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><path d="M3 9h18" /><path d="M9 21V9" /></svg>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium">Metadata Bar</h3>
                        <p className="text-xs text-slate-500">Show listing categories and tags</p>
                      </div>
                    </div>
                    <Switch defaultChecked id="show-metadata" />
                  </div>
                </div>
              </div>
              
              {/* Component Preview */}
              <div className="border border-slate-200 rounded-md p-6 bg-slate-50 mt-8">
                <h3 className="text-sm font-medium mb-4">Component Preview</h3>
                <div className="border border-dashed border-slate-300 p-4 rounded bg-white">
                  <div className="space-y-4">
                    {/* Metadata Bar Preview */}
                    <div className="bg-slate-100 px-3 py-2 rounded-sm flex gap-2 flex-wrap">
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">Software</span>
                      <span className="text-xs bg-slate-200 text-slate-800 px-2 py-0.5 rounded">Premium</span>
                      <span className="text-xs bg-slate-200 text-slate-800 px-2 py-0.5 rounded">Cloud-based</span>
                    </div>
                    
                    {/* Product Title & Price */}
                    <div className="flex justify-between items-start">
                      <h4 className="text-base font-medium">Product Name Example</h4>
                      <div className="bg-green-50 text-green-700 px-2 py-1 rounded text-sm font-medium">$99.00</div>
                    </div>
                    
                    {/* Expanded Description Preview */}
                    <div className="text-sm text-slate-600">
                      <p>This is where the expanded product description would appear, providing detailed information about features, benefits, and specifications.</p>
                    </div>
                    
                    {/* Google Maps Widget Preview */}
                    <div className="bg-slate-200 rounded w-full h-20 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </WizardStep>
        
        <WizardStep 
          title="Tracking Field" 
          description="Enter the name of your tracking field in Go HighLevel"
        >
          <div className="space-y-6 py-8">
            <h2 className="text-lg font-bold text-center mb-8">Set up Go HighLevel tracking</h2>
            
            <div className="space-y-8">
              {/* GHL Tracking Field */}
              <div className="space-y-2">
                <Label htmlFor="custom-field-name">Custom Field Name</Label>
                <Input 
                  id="custom-field-name" 
                  placeholder="listing"
                  defaultValue="listing"
                  className="flex-1"
                />
                <p className="text-xs text-slate-500">
                  This must match exactly the custom field name in your Go HighLevel account
                </p>
              </div>
              
              {/* Integration Instructions */}
              <div className="border border-slate-200 rounded-md p-6 bg-amber-50/30">
                <h3 className="text-sm font-medium mb-2">Important Integration Steps:</h3>
                <ol className="text-sm space-y-2 ml-5 list-decimal text-slate-700">
                  <li>Create a custom field in Go HighLevel with the name <span className="font-mono bg-slate-100 px-1 rounded">listing</span></li>
                  <li>Enable "Capture URL Parameters" in GHL form settings</li>
                  <li>The parameter will automatically be passed to your form</li>
                </ol>
              </div>
              
              {/* Parameter Preview */}
              <div className="border border-slate-200 rounded-md p-6 bg-slate-50">
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Parameter Preview:</h3>
                  <div className="bg-slate-100 p-3 rounded font-mono text-xs overflow-x-auto">
                    <div className="text-slate-600">https://forms.gohighlevel.com/your-form?<span className="text-green-600 font-bold">listing</span>=product-slug&utm_source=directory</div>
                  </div>
                  <p className="text-xs text-slate-500">
                    This is how parameters will appear in your form URLs
                  </p>
                </div>
              </div>
            </div>
          </div>
        </WizardStep>
        
        <WizardStep 
          title="Generate Code" 
          description="Your configuration is complete!"
        >
          <div className="space-y-6 py-6 text-center">
            <div className="rounded-full bg-green-50 w-20 h-20 flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            </div>
            
            <h3 className="text-xl font-medium text-slate-800">Your directory is ready!</h3>
            <p className="text-slate-500 max-w-md mx-auto mb-6">
              We'll generate the code to integrate with your Go HighLevel site based on your settings.
            </p>
            
            <Button size="lg" className="px-8 py-6 text-base">
              Generate Code
            </Button>
          </div>
        </WizardStep>
      </ConfigWizard>
    </div>
  );
}