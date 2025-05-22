import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { v4 as uuidv4 } from "uuid";
import { Collection } from "@/components/ui/collection-manager";
import { useToast } from "@/hooks/use-toast";

export default function ConfigTester() {
  const { toast } = useToast();
  const [config, setConfig] = useState<any>(null);
  const [previewFormHtml, setPreviewFormHtml] = useState<string>("");
  
  // Generate a random color in hex format
  const randomColor = () => {
    const letters = "0123456789ABCDEF";
    let color = "#";
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };
  
  // Generate random boolean
  const randomBool = () => Math.random() > 0.5;
  
  // Generate random text
  const randomText = (prefix: string, length: number = 8) => {
    const letters = "abcdefghijklmnopqrstuvwxyz";
    let text = prefix + "-";
    for (let i = 0; i < length; i++) {
      text += letters[Math.floor(Math.random() * letters.length)];
    }
    return text;
  };
  
  // Generate random number within range
  const randomNumber = (min: number, max: number) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };
  
  // Generate a random collection
  const generateRandomCollection = (): Collection => {
    const name = randomText("Collection", 6);
    return {
      id: uuidv4(),
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      image: `https://via.placeholder.com/150/` + randomColor().substring(1),
      seo: {
        title: name,
        description: randomText("Description for", 20)
      }
    };
  };
  
  // Generate a random configuration
  const generateRandomConfig = () => {
    // Generate random collections
    const collections: Collection[] = [];
    const numCollections = randomNumber(1, 5);
    for (let i = 0; i < numCollections; i++) {
      collections.push(generateRandomCollection());
    }
    
    // Generate random metadata fields
    const metadataLabels = ["Category", "Location", "Type", "Brand", "Version"]
      .slice(0, randomNumber(1, 5));
      
    const metadataFields = metadataLabels.map((label, index) => ({
      id: index + 1,
      label,
      enabled: randomBool()
    }));
    
    // Generate form fields configuration
    const formFields = {
      title: randomBool(),
      subtitle: randomBool(),
      description: randomBool(),
      price: randomBool(),
      address: randomBool(),
      company: randomBool()
    };
    
    // Create the random configuration
    const newConfig = {
      directoryName: randomText("Directory", 8),
      enableActionButton: randomBool(),
      buttonType: ["popup", "url", "download"][randomNumber(0, 2)],
      buttonLabel: ["Contact Us", "Learn More", "Get Started", "Download"][randomNumber(0, 3)],
      buttonColor: randomColor(),
      buttonTextColor: randomBool() ? "#FFFFFF" : "#000000",
      buttonBorderRadius: randomNumber(0, 20),
      formEmbedUrl: "https://forms.gohighlevel.com/" + randomText("form", 10),
      customFormFieldName: ["listing", "product", "service"][randomNumber(0, 2)],
      collections,
      enablePriceDisplay: randomBool(),
      enableExpandedDescription: randomBool(),
      enableLocationMap: randomBool(),
      enableMetadataDisplay: randomBool(),
      metadataFields,
      metadataLabels,
      metadataCount: metadataLabels.length,
      formFields,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    setConfig(newConfig);
    generateFormPreview(newConfig);
    
    // Show success message
    toast({
      title: "Random Configuration Generated",
      description: `Created with ${collections.length} collections and ${metadataLabels.length} metadata fields`
    });
  };
  
  // Generate HTML for form preview based on config
  const generateFormPreview = (config: any) => {
    // Extract values from config
    const {
      buttonColor, 
      buttonTextColor, 
      buttonBorderRadius, 
      buttonLabel,
      enablePriceDisplay,
      enableExpandedDescription,
      enableLocationMap,
      enableMetadataDisplay,
      metadataLabels,
      customFormFieldName
    } = config;
    
    // Sample listing data
    const sampleListing = {
      title: "Sample Product Listing",
      subtitle: "Premium quality product",
      description: "This is a detailed description of the product highlighting all of its features and benefits. This text would be longer in a real listing.",
      price: "$99.99",
      address: "123 Main Street, Anytown, USA",
      company: "Sample Company, Inc.",
      metadata: metadataLabels.map((label: string) => ({
        label,
        value: randomText(label + "-value", 5)
      }))
    };
    
    // Build the HTML for the form preview
    const html = `
      <div class="listing-preview">
        <h2 class="listing-title">${sampleListing.title}</h2>
        <div class="listing-subtitle">${sampleListing.subtitle}</div>
        
        ${enablePriceDisplay ? 
          `<div class="listing-price">${sampleListing.price}</div>` : 
          ''}
        
        ${enableExpandedDescription ? 
          `<div class="listing-description">${sampleListing.description}</div>` : 
          `<div class="listing-description-short">${sampleListing.description.substring(0, 50)}...</div>`}
        
        <div class="listing-company">${sampleListing.company}</div>
        
        ${enableLocationMap ? 
          `<div class="listing-address">
            <div>Location: ${sampleListing.address}</div>
            <div class="map-placeholder" style="background-color: #f0f0f0; height: 100px; margin: 10px 0; display: flex; align-items: center; justify-content: center;">
              Map would appear here
            </div>
          </div>` : 
          ''}
        
        ${enableMetadataDisplay && metadataLabels.length > 0 ? 
          `<div class="listing-metadata">
            <h4>Additional Information</h4>
            <ul>
              ${sampleListing.metadata.map((item: any) => 
                `<li><strong>${item.label}:</strong> ${item.value}</li>`
              ).join('')}
            </ul>
          </div>` : 
          ''}
        
        <button 
          class="listing-button" 
          style="background-color: ${buttonColor}; color: ${buttonTextColor}; border-radius: ${buttonBorderRadius}px; padding: 8px 16px; border: none; cursor: pointer; margin-top: 15px;"
        >
          ${buttonLabel}
        </button>
        
        <div class="listing-tracking-info" style="margin-top: 15px; font-size: 12px; color: #666;">
          <div>Tracking Field: ${customFormFieldName}</div>
          <div>Tracking Value: sample-product-slug-123</div>
        </div>
      </div>
    `;
    
    setPreviewFormHtml(html);
  };
  
  // Copy config to clipboard
  const copyConfigToClipboard = () => {
    if (!config) return;
    
    const configString = JSON.stringify(config, null, 2);
    navigator.clipboard.writeText(configString).then(() => {
      toast({
        title: "Configuration Copied",
        description: "JSON configuration copied to clipboard"
      });
    });
  };
  
  // Download config as JSON file
  const downloadConfig = () => {
    if (!config) return;
    
    const configString = JSON.stringify(config, null, 2);
    const blob = new Blob([configString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement("a");
    a.href = url;
    a.download = "random_directory_config.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  return (
    <div className="container mx-auto py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">Directory Configuration Tester</h1>
        <p className="text-slate-600 mt-2">
          Generate random configurations to test form rendering and functionality
        </p>
        
        <Button 
          onClick={generateRandomConfig} 
          size="lg"
          className="mt-4"
        >
          Generate Random Configuration
        </Button>
      </div>
      
      {config && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Configuration JSON */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Configuration JSON</h2>
              <div className="space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={copyConfigToClipboard}
                >
                  Copy
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={downloadConfig}
                >
                  Download
                </Button>
              </div>
            </div>
            
            <div className="bg-slate-100 p-4 rounded-md overflow-auto max-h-[600px]">
              <pre className="text-xs">{JSON.stringify(config, null, 2)}</pre>
            </div>
          </div>
          
          {/* Form Preview */}
          <div>
            <h2 className="text-xl font-bold mb-4">Form Preview</h2>
            <div className="border rounded-md p-6 bg-white">
              <div 
                className="form-preview"
                dangerouslySetInnerHTML={{ __html: previewFormHtml }}
              />
            </div>
            
            <div className="mt-6">
              <h3 className="font-medium mb-2">Configuration Summary</h3>
              {config && (
                <div className="space-y-2 text-sm">
                  <div><strong>Directory Name:</strong> {config.directoryName}</div>
                  <div><strong>Action Button:</strong> {config.enableActionButton ? 'Enabled' : 'Disabled'}</div>
                  <div><strong>Button Type:</strong> {config.buttonType}</div>
                  <div><strong>Collections:</strong> {config.collections.length}</div>
                  <div><strong>Form Field Name:</strong> {config.customFormFieldName}</div>
                  <div>
                    <strong>Visible Components:</strong> 
                    <ul className="list-disc pl-5 mt-1">
                      {config.enablePriceDisplay && <li>Price</li>}
                      {config.enableExpandedDescription && <li>Full Description</li>}
                      {config.enableLocationMap && <li>Location Map</li>}
                      {config.enableMetadataDisplay && <li>Metadata Fields</li>}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}