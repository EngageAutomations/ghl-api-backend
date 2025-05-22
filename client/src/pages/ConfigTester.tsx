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
    
    // Determine if action button is enabled
    const enableActionButton = randomBool();
    
    // Create the random configuration
    const newConfig: any = {
      directoryName: randomText("Directory", 8),
      enableActionButton,
      // Only include button options if action button is enabled
      ...(enableActionButton ? {
        buttonType: ["popup", "url", "download"][randomNumber(0, 2)],
        buttonLabel: ["Contact Us", "Learn More", "Get Started", "Download"][randomNumber(0, 3)],
        buttonColor: randomColor(),
        buttonTextColor: randomBool() ? "#FFFFFF" : "#000000",
        buttonBorderRadius: randomNumber(0, 20),
        formEmbedUrl: "https://forms.gohighlevel.com/" + randomText("form", 10),
        customFormFieldName: ["listing", "product", "service"][randomNumber(0, 2)],
      } : {}),
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
      customFormFieldName,
      collections
    } = config;
    
    // Get a random collection if available
    const randomCollection = collections && collections.length > 0 
      ? collections[Math.floor(Math.random() * collections.length)]
      : { name: "Sample Collection", slug: "sample-collection" };
    
    // Sample listing data
    const sampleListing = {
      title: "Sample Product Listing",
      subtitle: "Premium quality product",
      description: "This is a detailed description of the product highlighting all of its features and benefits. This text would be longer in a real listing.",
      price: "$99.99",
      address: "123 Main Street, Anytown, USA",
      company: "Sample Company, Inc.",
      image: "https://via.placeholder.com/400x300/4F46E5/FFFFFF?text=Product+Image",
      collection: randomCollection.name,
      slug: "sample-product-listing",
      metadata: metadataLabels.map((label: string) => ({
        label,
        value: randomText(label + "-value", 5)
      }))
    };
    
    // Build the HTML for the listing card preview
    const html = `
      <div class="listing-card" style="font-family: system-ui, -apple-system, sans-serif; max-width: 100%;">
        <!-- Listing Image -->
        <div style="width: 100%; height: 200px; overflow: hidden; border-radius: 8px; margin-bottom: 16px; position: relative;">
          <img 
            src="${sampleListing.image}" 
            alt="${sampleListing.title}" 
            style="width: 100%; height: 100%; object-fit: cover;"
          />
          ${collections && collections.length > 0 ? 
            `<div style="position: absolute; top: 12px; left: 12px; background-color: rgba(0,0,0,0.6); color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
              ${sampleListing.collection}
            </div>` : ''
          }
        </div>
        
        <!-- Listing Content -->
        <div style="padding: 0 4px;">
          <h2 style="margin: 0 0 8px 0; font-size: 20px; font-weight: 600; color: #1f2937;">${sampleListing.title}</h2>
          <div style="margin-bottom: 8px; font-size: 14px; color: #4b5563;">${sampleListing.subtitle}</div>
          
          ${enablePriceDisplay ? 
            `<div style="margin-bottom: 12px; font-size: 18px; font-weight: 600; color: #4F46E5;">${sampleListing.price}</div>` : 
            ''}
          
          ${enableExpandedDescription ? 
            `<div style="margin-bottom: 16px; font-size: 14px; color: #6b7280; line-height: 1.5;">
              ${sampleListing.description}
            </div>` : 
            `<div style="margin-bottom: 16px; font-size: 14px; color: #6b7280; line-height: 1.5;">
              ${sampleListing.description.substring(0, 100)}... <a href="#" style="color: #4F46E5; text-decoration: none;">Read more</a>
            </div>`
          }
          
          <div style="margin-bottom: 12px; font-size: 14px; color: #374151; font-weight: 500;">
            ${sampleListing.company}
          </div>
          
          ${enableLocationMap ? 
            `<div style="margin-bottom: 16px;">
              <div style="font-size: 14px; color: #6b7280; margin-bottom: 8px;">
                <strong>Location:</strong> ${sampleListing.address}
              </div>
              <div style="background-color: #f3f4f6; height: 120px; border-radius: 6px; display: flex; align-items: center; justify-content: center; color: #9ca3af; font-size: 14px;">
                Map would appear here
              </div>
            </div>` : 
            ''}
          
          ${enableMetadataDisplay && metadataLabels.length > 0 ? 
            `<div style="margin-bottom: 16px; border-top: 1px solid #e5e7eb; padding-top: 12px;">
              <h4 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 500; color: #374151;">Additional Information</h4>
              <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 8px;">
                ${sampleListing.metadata.map((item: any) => 
                  `<div style="font-size: 13px;">
                    <span style="font-weight: 500; color: #4b5563;">${item.label}:</span>
                    <span style="color: #6b7280;"> ${item.value}</span>
                  </div>`
                ).join('')}
              </div>
            </div>` : 
            ''}
          
          ${config.enableActionButton ? 
            `<!-- Action Button -->
            <button 
              style="width: 100%; background-color: ${buttonColor}; color: ${buttonTextColor}; border-radius: ${buttonBorderRadius}px; padding: 10px 16px; border: none; cursor: pointer; font-size: 16px; font-weight: 500; margin-top: 8px; transition: opacity 0.2s;"
              onmouseover="this.style.opacity='0.9'"
              onmouseout="this.style.opacity='1'"
            >
              ${buttonLabel}
            </button>` 
            : ''
          }
          
          ${config.enableActionButton ? 
            `<!-- Tracking Information (Development Only) -->
            <div style="margin-top: 16px; padding-top: 12px; border-top: 1px dashed #e5e7eb; font-size: 12px; color: #9ca3af;">
              <div><strong>Tracking Field:</strong> ${customFormFieldName || "listing"}</div>
              <div><strong>Tracking Value:</strong> ${sampleListing.slug}</div>
            </div>` 
            : ''
          }
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
          
          {/* Listing Preview */}
          <div>
            <h2 className="text-xl font-bold mb-4">Listing Preview</h2>
            <div className="border rounded-md p-6 bg-white">
              <div 
                className="listing-preview"
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