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
          title="Action Button" 
          description="Would you like to add an action button to your listings?"
        >
          <div className="space-y-6 py-8">
            <h2 className="text-lg font-bold text-center mb-8">Would you like to add an action button?</h2>
            <div className="flex items-center justify-between border-b pb-6">
              <div className="space-y-1">
                <p className="text-base">
                  Show a call-to-action button on your listing pages
                </p>
              </div>
              <Switch id="enable-action-button" />
            </div>
          </div>
        </WizardStep>
        
        <WizardStep 
          title="Embedded Form" 
          description="Would you like to embed a form on your listings?"
        >
          <div className="space-y-6 py-8">
            <h2 className="text-lg font-bold text-center mb-8">Would you like to embed a form?</h2>
            <div className="flex items-center justify-between border-b pb-6">
              <div className="space-y-1">
                <p className="text-base">
                  Show a form directly on your listing pages
                </p>
              </div>
              <Switch id="enable-embedded-form" />
            </div>
          </div>
        </WizardStep>
        
        <WizardStep 
          title="Tracking Field" 
          description="Enter the name of your tracking field in Go HighLevel"
        >
          <div className="space-y-6 py-8">
            <h2 className="text-lg font-bold text-center mb-8">Name your tracking field</h2>
            <div className="space-y-3">
              <Input 
                id="custom-field-name" 
                placeholder="listing"
                defaultValue="listing"
                className="text-base py-6"
              />
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