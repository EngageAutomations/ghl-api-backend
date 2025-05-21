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
                className="w-full border rounded-md space-y-5"
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
                              backgroundColor: "#4F46E5",
                              color: "#FFFFFF",
                              borderRadius: "4px",
                              transitionProperty: "all",
                              transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
                              transitionDuration: "150ms",
                            }}
                          >
                            Contact Us
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
                      
                      {/* Form Position */}
                      <div className="space-y-2">
                        <Label htmlFor="form-position">Form Position</Label>
                        <Select defaultValue="below">
                          <SelectTrigger id="form-position">
                            <SelectValue placeholder="Select position" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="below">Below Product Description</SelectItem>
                            <SelectItem value="aside">Alongside Product Details</SelectItem>
                            <SelectItem value="bottom">Bottom of Page</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-slate-500">
                          Where to position the form on listing pages
                        </p>
                      </div>
                      
                      {/* Form Height */}
                      <div className="space-y-2">
                        <Label htmlFor="form-height">Form Height</Label>
                        <div className="flex rounded-md">
                          <Input
                            id="form-height"
                            type="number"
                            defaultValue="600"
                            min="300"
                            max="1200"
                            className="flex-1"
                          />
                          <div className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-slate-300 bg-slate-50 text-slate-500 text-sm">
                            px
                          </div>
                        </div>
                        <p className="text-xs text-slate-500">
                          Height of the embedded form iframe
                        </p>
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