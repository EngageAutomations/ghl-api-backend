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
  
  // Generate listing creation form HTML based on config
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
      collections,
      formFields
    } = config;
    
    // Build the HTML for the listing creation form
    const html = `
      <div class="listing-form" style="font-family: system-ui, -apple-system, sans-serif; max-width: 100%;">
        <form style="display: flex; flex-direction: column; gap: 16px;">
          <!-- Company Logo -->
          <div style="text-align: center; margin-bottom: 12px;">
            <div style="display: inline-flex; justify-content: center; align-items: center; height: 60px; width: 60px; background-color: ${buttonColor || '#4F46E5'}; border-radius: 8px; margin: 0 auto 12px auto;">
              <span style="color: white; font-weight: bold; font-size: 18px;">DE</span>
            </div>
            <div style="font-size: 14px; color: #6b7280;">Directory Engine</div>
          </div>
          
          <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #1f2937; text-align: center;">Create New Listing</h2>
          
          <!-- Main fields - always required -->
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <label style="font-weight: 500; font-size: 14px; color: #374151;">
              Title <span style="color: #ef4444;">*</span>
              <input type="text" name="title" required 
                style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; margin-top: 4px; font-size: 14px;"
                placeholder="Product or service title"
              />
            </label>
          </div>
          
          <!-- Subtitle field -->
          ${formFields?.subtitle ? `
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <label style="font-weight: 500; font-size: 14px; color: #374151;">
              Subtitle
              <input type="text" name="subtitle"
                style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; margin-top: 4px; font-size: 14px;"
                placeholder="Brief description or tagline"
              />
            </label>
          </div>
          ` : ''}
          
          <!-- Price field - conditionally shown -->
          ${enablePriceDisplay ? `
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <label style="font-weight: 500; font-size: 14px; color: #374151;">
              Price
              <div style="display: flex; align-items: center; margin-top: 4px;">
                <span style="padding: 8px; background-color: #f3f4f6; border: 1px solid #d1d5db; border-right: none; border-radius: 6px 0 0 6px; color: #6b7280;">$</span>
                <input type="text" name="price"
                  style="flex: 1; padding: 8px; border: 1px solid #d1d5db; border-radius: 0 6px 6px 0; font-size: 14px;"
                  placeholder="99.99"
                />
              </div>
            </label>
          </div>
          ` : ''}
          
          <!-- Description field -->
          ${formFields?.description ? `
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <label style="font-weight: 500; font-size: 14px; color: #374151;">
              Description ${enableExpandedDescription ? '<span style="color: #ef4444;">*</span>' : ''}
              <textarea name="description" ${enableExpandedDescription ? 'required' : ''}
                style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; margin-top: 4px; min-height: 120px; font-size: 14px; resize: vertical;"
                placeholder="Detailed description of the product or service"
              ></textarea>
            </label>
          </div>
          ` : ''}
          
          <!-- Company field -->
          ${formFields?.company ? `
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <label style="font-weight: 500; font-size: 14px; color: #374151;">
              Company
              <input type="text" name="company"
                style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; margin-top: 4px; font-size: 14px;"
                placeholder="Company or business name"
              />
            </label>
          </div>
          ` : ''}
          
          <!-- Address/Location fields - conditionally shown -->
          ${enableLocationMap && formFields?.address ? `
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <label style="font-weight: 500; font-size: 14px; color: #374151;">
              Address
              <input type="text" name="address"
                style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; margin-top: 4px; font-size: 14px;"
                placeholder="Street address"
              />
            </label>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
              <label style="font-weight: 500; font-size: 14px; color: #374151;">
                City
                <input type="text" name="city"
                  style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; margin-top: 4px; font-size: 14px;"
                  placeholder="City"
                />
              </label>
              
              <label style="font-weight: 500; font-size: 14px; color: #374151;">
                State/Province
                <input type="text" name="state"
                  style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; margin-top: 4px; font-size: 14px;"
                  placeholder="State"
                />
              </label>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
              <label style="font-weight: 500; font-size: 14px; color: #374151;">
                ZIP/Postal Code
                <input type="text" name="postal_code"
                  style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; margin-top: 4px; font-size: 14px;"
                  placeholder="ZIP Code"
                />
              </label>
              
              <label style="font-weight: 500; font-size: 14px; color: #374151;">
                Country
                <input type="text" name="country"
                  style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; margin-top: 4px; font-size: 14px;"
                  placeholder="Country"
                />
              </label>
            </div>
          </div>
          ` : ''}
          
          <!-- Collection selection dropdown - if collections exist -->
          ${collections && collections.length > 0 ? `
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <label style="font-weight: 500; font-size: 14px; color: #374151;">
              Collection
              <select name="collection_id"
                style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; margin-top: 4px; font-size: 14px; background-color: white;"
              >
                <option value="">Select a collection</option>
                ${collections.map((collection: any) => `
                  <option value="${collection.id}">${collection.name}</option>
                `).join('')}
              </select>
            </label>
          </div>
          ` : ''}
          
          <!-- Metadata fields - conditionally shown -->
          ${enableMetadataDisplay && metadataLabels.length > 0 ? `
          <div style="margin-top: 8px; border-top: 1px solid #e5e7eb; padding-top: 16px;">
            <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 500; color: #374151;">Additional Information</h3>
            
            <div style="display: grid; gap: 12px;">
              ${metadataLabels.map((label: string, index: number) => `
                <label style="font-weight: 500; font-size: 14px; color: #374151;">
                  ${label}
                  <input type="text" name="metadata_${index}"
                    style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; margin-top: 4px; font-size: 14px;"
                    placeholder="${label} value"
                  />
                </label>
              `).join('')}
            </div>
          </div>
          ` : ''}
          
          <!-- Image upload field -->
          <div style="margin-top: 8px; border-top: 1px solid #e5e7eb; padding-top: 16px;">
            <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 500; color: #374151;">Listing Images</h3>
            
            <div style="border: 2px dashed #d1d5db; border-radius: 6px; padding: 20px; text-align: center; background-color: #f9fafb;">
              <div style="margin-bottom: 12px; color: #6b7280;">
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin: 0 auto 8px auto;"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                <p style="margin: 0; font-size: 14px;">Drag and drop images here, or click to browse</p>
                <p style="margin: 4px 0 0 0; font-size: 12px; color: #9ca3af;">Accepts JPG, PNG, WEBP (Max: 5MB each)</p>
              </div>
              
              <button type="button"
                style="padding: 6px 12px; background-color: #f3f4f6; border: 1px solid #d1d5db; border-radius: 4px; font-size: 14px; color: #374151; cursor: pointer;"
              >
                Select Files
              </button>
            </div>
          </div>
          
          <!-- SEO fields -->
          <div style="margin-top: 8px; border-top: 1px solid #e5e7eb; padding-top: 16px;">
            <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 500; color: #374151;">SEO Settings</h3>
            
            <div style="display: flex; flex-direction: column; gap: 12px;">
              <label style="font-weight: 500; font-size: 14px; color: #374151;">
                URL Slug
                <input type="text" name="slug"
                  style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; margin-top: 4px; font-size: 14px;"
                  placeholder="product-name"
                />
                <span style="font-size: 12px; color: #6b7280; margin-top: 4px; display: block;">
                  Custom URL: yoursite.com/listings/<strong>product-name</strong> (Auto-generated if left blank)
                </span>
              </label>
              
              <label style="font-weight: 500; font-size: 14px; color: #374151;">
                Meta Title
                <input type="text" name="meta_title"
                  style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; margin-top: 4px; font-size: 14px;"
                  placeholder="SEO title (defaults to listing title)"
                />
              </label>
              
              <label style="font-weight: 500; font-size: 14px; color: #374151;">
                Meta Description
                <textarea name="meta_description"
                  style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; margin-top: 4px; height: 80px; font-size: 14px; resize: vertical;"
                  placeholder="Brief description for search engines"
                ></textarea>
              </label>
            </div>
          </div>
          
          <!-- Hidden tracking field for GHL integration -->
          ${config.enableActionButton ? `
          <input type="hidden" name="${customFormFieldName || 'listing'}" value="auto-generated-on-save" />
          ` : ''}
          
          <!-- Form submit button -->
          <div style="margin-top: 16px;">
            <button type="submit"
              style="width: 100%; background-color: ${buttonColor || '#4F46E5'}; color: ${buttonTextColor || '#FFFFFF'}; border-radius: ${buttonBorderRadius || 4}px; padding: 12px 16px; border: none; cursor: pointer; font-size: 16px; font-weight: 500; transition: opacity 0.2s;"
              onmouseover="this.style.opacity='0.9'"
              onmouseout="this.style.opacity='1'"
            >
              Create Listing
            </button>
          </div>
        </form>
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