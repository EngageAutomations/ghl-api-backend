import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ConfigWizard, WizardStep } from "@/components/ui/config-wizard";

export default function ConfigWizardDemo() {
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
          <div className="space-y-6 py-4">
            <div className="space-y-3">
              <Label htmlFor="directory-name" className="text-base font-medium">Directory Name</Label>
              <Input 
                id="directory-name" 
                placeholder="My Marketplace Directory"
                className="text-base py-6"
              />
              <p className="text-sm text-muted-foreground mt-2">
                This name will be used in tracking parameters and reporting to identify your directory
              </p>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-md mt-8 border border-blue-100">
              <h3 className="text-sm font-medium text-blue-800 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                Why is this important?
              </h3>
              <p className="mt-2 text-sm text-blue-700">
                Your directory name helps identify traffic sources in Go HighLevel analytics and reports. 
                It will be included in UTM parameters for accurate tracking of leads and conversions.
              </p>
            </div>
          </div>
        </WizardStep>
        
        <WizardStep 
          title="Action Button Configuration" 
          description="Configure the call-to-action button that appears on listing pages"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="enable-action-button">Enable Action Button</Label>
                <p className="text-sm text-muted-foreground">
                  Show a call-to-action button on listing pages
                </p>
              </div>
              <Switch id="enable-action-button" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="button-label">Button Label</Label>
              <Input 
                id="button-label" 
                placeholder="Contact Us"
              />
              <p className="text-sm text-muted-foreground">
                The text displayed on the action button
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="button-url">Button URL</Label>
              <Input 
                id="button-url" 
                placeholder="https://forms.gohighlevel.com/your-form"
              />
              <p className="text-sm text-muted-foreground">
                Where the button should link to (typically your GHL form)
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="button-color">Button Color</Label>
                <Input 
                  id="button-color" 
                  type="color" 
                  defaultValue="#4F46E5"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="button-text-color">Text Color</Label>
                <Input 
                  id="button-text-color" 
                  type="color" 
                  defaultValue="#FFFFFF"
                />
              </div>
            </div>
          </div>
        </WizardStep>
        
        <WizardStep 
          title="Embedded Form Configuration" 
          description="Configure forms that appear directly on listing pages"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="enable-embedded-form">Enable Embedded Form</Label>
                <p className="text-sm text-muted-foreground">
                  Show a form directly on the product listing page
                </p>
              </div>
              <Switch id="enable-embedded-form" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="form-embed-url">Form Embed URL</Label>
              <Input 
                id="form-embed-url" 
                placeholder="https://forms.gohighlevel.com/form-embed"
              />
              <p className="text-sm text-muted-foreground">
                The URL of your Go HighLevel form to embed
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="form-fallback">Form Fallback Text</Label>
              <Input 
                id="form-fallback" 
                placeholder="Unable to load the form. Please try again later."
              />
              <p className="text-sm text-muted-foreground">
                Text to display if the form cannot be loaded
              </p>
            </div>
          </div>
        </WizardStep>
        
        <WizardStep 
          title="Go HighLevel Integration" 
          description="Configure how listing information is passed to Go HighLevel"
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="custom-field-name">Custom Field Name</Label>
              <Input 
                id="custom-field-name" 
                placeholder="listing"
                defaultValue="listing"
              />
              <p className="text-sm text-muted-foreground">
                The name of the field in GHL that will store the listing ID
              </p>
            </div>
            
            <div className="p-4 bg-blue-50 rounded-md border border-blue-100">
              <h3 className="text-sm font-medium text-blue-800">Important:</h3>
              <ul className="mt-2 space-y-1 text-sm text-blue-700 list-disc list-inside">
                <li>Create a custom field in GHL with this exact name</li>
                <li>Enable "Capture URL Parameters" in GHL form settings</li>
                <li>This will allow your forms to track which listing the visitor came from</li>
              </ul>
            </div>
            
            <div className="mt-4">
              <Button variant="outline" className="w-full">
                View GHL Integration Documentation
              </Button>
            </div>
          </div>
        </WizardStep>
        
        <WizardStep 
          title="Review & Generate" 
          description="Review your settings and generate your integration code"
        >
          <div className="space-y-6">
            <div className="rounded-md bg-slate-50 p-4 border border-slate-200">
              <h3 className="font-medium text-slate-800 mb-2">Configuration Summary</h3>
              <ul className="space-y-2 text-sm">
                <li><span className="font-medium">Directory Name:</span> My Marketplace Directory</li>
                <li><span className="font-medium">Action Button:</span> Enabled</li>
                <li><span className="font-medium">Embedded Form:</span> Enabled</li>
                <li><span className="font-medium">Custom Field Name:</span> listing</li>
              </ul>
            </div>
            
            <div className="p-4 bg-green-50 rounded-md border border-green-100">
              <h3 className="font-medium text-green-800 mb-2">Your configuration is ready!</h3>
              <p className="text-sm text-green-700">
                Click the button below to generate your integration code. This will generate CSS and JavaScript that you can copy into your Go HighLevel site.
              </p>
            </div>
            
            <div className="flex gap-3">
              <Button className="flex-1" variant="outline">Preview</Button>
              <Button className="flex-1">Generate Code</Button>
            </div>
          </div>
        </WizardStep>
      </ConfigWizard>
    </div>
  );
}