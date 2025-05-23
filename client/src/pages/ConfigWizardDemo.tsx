import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
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
import { useState, useEffect } from "react";
import { Copy } from "lucide-react";
import { generatePopupCode, generateCodePreview } from "@/lib/popup-code-generator";
import { useToast } from "@/hooks/use-toast";
import { getConfig, saveConfig } from "@/lib/config-store";
import { CollectionManager, Collection } from "@/components/ui/collection-manager";
import { GoogleDriveConnection } from "@/components/google-drive/GoogleDriveConnection";

export default function ConfigWizardDemo() {
  const { toast } = useToast();

  // Generate popup code function
  const generateFullPopupCode = () => {
    const config = {
      buttonColor: previewColor,
      buttonTextColor: previewTextColor,
      buttonBorderRadius: previewBorderRadius,
      buttonText: previewButtonText,
      popupBackgroundColor,
      popupOverlayColor,
      popupBorderRadius,
      closeButtonColor,
      closeButtonHoverColor,
      formUrl: buttonUrl,
      customFieldName: customFieldName || "listing",
      metadataFields: metadataFields
    };

    return generatePopupCode(config);
  };

  // Copy code to clipboard
  const copyCodeToClipboard = async (code: string, type: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast({
        title: "✓ Code Copied!",
        description: `${type} code copied to clipboard`,
      });
    } catch (err) {
      toast({
        title: "Copy Failed",
        description: "Could not copy to clipboard. Please copy manually.",
        variant: "destructive",
      });
    }
  };
  
  // Google Drive connection state
  const [googleDriveTokens, setGoogleDriveTokens] = useState<any>(null);
  const [isGoogleDriveConnected, setIsGoogleDriveConnected] = useState(false);

  const handleGoogleDriveConnection = (tokens: any) => {
    setGoogleDriveTokens(tokens);
    setIsGoogleDriveConnected(true);
    // Store tokens in localStorage for persistence
    localStorage.setItem('googleDriveTokens', JSON.stringify(tokens));
  };

  // Check for existing tokens on load
  useEffect(() => {
    const savedTokens = localStorage.getItem('googleDriveTokens');
    if (savedTokens) {
      setGoogleDriveTokens(JSON.parse(savedTokens));
      setIsGoogleDriveConnected(true);
    }
  }, []);
  
  // Function to generate the form preview HTML based on current configuration
  const generateFormPreview = () => {
    // Get enabled metadata labels from fields
    const enabledMetadataLabels = metadataFields
      .filter(field => field.enabled)
      .map(field => field.label);
      
    // Build the HTML for the listing creation form
    const html = `
      <div class="listing-form" style="font-family: system-ui, -apple-system, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; text-align: left;">
        <form style="display: flex; flex-direction: column; gap: 16px;">
          <!-- Company Logo -->
          <div style="text-align: center; margin-bottom: 20px;">
            <div style="display: inline-flex; justify-content: center; align-items: center; height: 60px; width: 180px; background-color: ${previewColor}; border-radius: 8px; margin: 0 auto;">
              <span style="color: ${previewTextColor}; font-weight: bold; font-size: 18px;">My Directory</span>
            </div>
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
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <label style="font-weight: 500; font-size: 14px; color: #374151;">
              Subtitle
              <input type="text" name="subtitle"
                style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; margin-top: 4px; font-size: 14px;"
                placeholder="Brief description or tagline"
              />
            </label>
          </div>
          
          <!-- Price field - conditionally shown -->
          ${showPrice ? `
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
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <label style="font-weight: 500; font-size: 14px; color: #374151;">
              Description ${showDescription ? '<span style="color: #ef4444;">*</span>' : ''}
              <div style="position: relative;">
                <textarea name="description" ${showDescription ? 'required' : ''}
                  style="width: 100%; padding: 8px; border: 1px solid #d1d5db; border-radius: 6px; margin-top: 4px; min-height: 120px; font-size: 14px; resize: vertical;"
                  placeholder="Detailed description of the product or service"
                ></textarea>
                <button type="button" 
                  style="position: absolute; top: 8px; right: 8px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 6px; padding: 6px 10px; font-size: 12px; cursor: pointer; display: flex; align-items: center; gap: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"
                  onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 4px 8px rgba(0,0,0,0.15)';"
                  onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 2px 4px rgba(0,0,0,0.1)';"
                  onclick="generateBulletPoints(this)"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                    <path d="M2 17l10 5 10-5"/>
                    <path d="M2 12l10 5 10-5"/>
                  </svg>
                  AI Bullets
                </button>
              </div>
            </label>
          </div>
          
          <!-- Rich Content Field (when expanded description is enabled) -->
          ${showDescription ? `
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <label style="font-weight: 500; font-size: 14px; color: #374151;">
              Rich Content <span style="font-size: 12px; color: #6b7280;">(HTML, Images, Text)</span>
              <div style="border: 1px solid #d1d5db; border-radius: 6px; margin-top: 4px; background: white;">
                <!-- Rich text editor toolbar -->
                <div style="border-bottom: 1px solid #e5e7eb; padding: 8px; display: flex; gap: 4px; flex-wrap: wrap; background: #f9fafb;">
                  <button type="button" style="padding: 4px 8px; border: 1px solid #d1d5db; border-radius: 4px; background: white; font-size: 12px; cursor: pointer;" title="Bold">
                    <strong>B</strong>
                  </button>
                  <button type="button" style="padding: 4px 8px; border: 1px solid #d1d5db; border-radius: 4px; background: white; font-size: 12px; cursor: pointer;" title="Italic">
                    <em>I</em>
                  </button>
                  <button type="button" style="padding: 4px 8px; border: 1px solid #d1d5db; border-radius: 4px; background: white; font-size: 12px; cursor: pointer;" title="Add Image">
                    🖼️
                  </button>
                  <button type="button" style="padding: 4px 8px; border: 1px solid #d1d5db; border-radius: 4px; background: white; font-size: 12px; cursor: pointer;" title="Add Link">
                    🔗
                  </button>
                  <button type="button" style="padding: 4px 8px; border: 1px solid #d1d5db; border-radius: 4px; background: white; font-size: 12px; cursor: pointer;" title="HTML View">
                    &lt;/&gt;
                  </button>
                </div>
                <textarea name="rich_content"
                  style="width: 100%; padding: 12px; border: none; min-height: 150px; font-size: 14px; resize: vertical; outline: none;"
                  placeholder="Add rich content with HTML, embed images, or format text..."
                ></textarea>
              </div>
            </label>
          </div>
          ` : ''}
          
          <!-- Company field -->
          ${formFields.company ? `
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
          ${showMaps && formFields.address ? `
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
                ${collections.map((collection) => `
                  <option value="${collection.id}">${collection.name}</option>
                `).join('')}
              </select>
            </label>
          </div>
          ` : ''}
          
          <!-- Metadata fields - conditionally shown -->
          ${showMetadata && enabledMetadataLabels.length > 0 ? `
          <div style="margin-top: 8px; border-top: 1px solid #e5e7eb; padding-top: 16px;">
            <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: 500; color: #374151;">Additional Information</h3>
            
            <div style="display: grid; gap: 12px;">
              ${enabledMetadataLabels.map((label, index) => `
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
          
          <!-- Submit button - styled based on button configuration -->
          <div style="margin-top: 24px;">
            <button type="submit"
              style="width: 100%; padding: 10px; background-color: ${previewColor}; color: ${previewTextColor}; border: none; border-radius: ${previewBorderRadius}px; font-size: 16px; font-weight: 500; cursor: pointer;"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    `;
    
    return html;
  };
  // State for the selected opt-in type (action button or embedded form)
  const [selectedOptIn, setSelectedOptIn] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | undefined>(undefined);
  const [buttonType, setButtonType] = useState<string>("popup");
  
  // Custom field tracking name
  const [customFieldName, setCustomFieldName] = useState("listing");
  
  // Form URL state
  const [formEmbedUrl, setFormEmbedUrl] = useState("https://forms.gohighlevel.com/your-form-url");
  
  // Form field configuration
  const [formFields, setFormFields] = useState({
    name: true,
    email: true,
    phone: true,
    message: true,
    company: false,
    address: false
  });
  
  // Component visibility state
  const [showPrice, setShowPrice] = useState(true);
  const [showDescription, setShowDescription] = useState(true);
  const [showMaps, setShowMaps] = useState(true);
  const [showMetadata, setShowMetadata] = useState(true);
  
  // Collections state for the collection manager
  const [collections, setCollections] = useState<Collection[]>([]);
  
  // Metadata fields state
  const [metadataFields, setMetadataFields] = useState([
    { id: 1, label: "", enabled: true },
    { id: 2, label: "", enabled: true }
  ]);
  
  // Button preview state
  const [previewColor, setPreviewColor] = useState("#4F46E5");
  const [previewTextColor, setPreviewTextColor] = useState("#FFFFFF");
  const [previewBorderRadius, setPreviewBorderRadius] = useState(4);
  const [previewButtonText, setPreviewButtonText] = useState("Contact Us");
  const [buttonUrl, setButtonUrl] = useState("https://forms.gohighlevel.com/form?product={product_name}");
  
  // Popup customization state
  const [popupBackgroundColor, setPopupBackgroundColor] = useState("#FFFFFF");
  const [popupOverlayColor, setPopupOverlayColor] = useState("rgba(0, 0, 0, 0.6)");
  const [popupBorderRadius, setPopupBorderRadius] = useState(10);
  const [closeButtonColor, setCloseButtonColor] = useState("#333333");
  const [closeButtonHoverColor, setCloseButtonHoverColor] = useState("#ff4444");
  
  // Metadata field management functions
  const addMetadataField = () => {
    if (metadataFields.length >= 5) {
      toast({
        title: "Maximum fields reached",
        description: "You can only add up to 5 metadata fields",
        variant: "destructive"
      });
      return;
    }
    
    const newId = Math.max(0, ...metadataFields.map(field => field.id)) + 1;
    setMetadataFields([...metadataFields, { 
      id: newId, 
      label: "", 
      enabled: true 
    }]);
  };
  
  const removeMetadataField = (id: number) => {
    setMetadataFields(metadataFields.filter(field => field.id !== id));
  };
  
  const updateMetadataField = (id: number, label: string) => {
    setMetadataFields(metadataFields.map(field => 
      field.id === id ? { ...field, label } : field
    ));
  };
  
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
        {/* Google Drive Connection Step */}
        <WizardStep 
          title="Connect Storage" 
          description="Connect your Google Drive for secure image storage"
        >
          <div className="space-y-6 py-8">
            <GoogleDriveConnection 
              onConnected={handleGoogleDriveConnection}
              isConnected={isGoogleDriveConnected}
            />
            
            {isGoogleDriveConnected && (
              <div className="text-center mt-8">
                <p className="text-sm text-gray-600 mb-4">
                  🎉 Great! Your Google Drive is connected. You can now proceed to configure your directory settings.
                </p>
              </div>
            )}
          </div>
        </WizardStep>

        <WizardStep 
          title="Directory Settings" 
          description="Name your directory to get started"
        >
          <div className="space-y-8 py-8">
            <h2 className="text-lg font-bold text-center mb-8">Name your Directory to get started</h2>
            
            {/* Directory Name Input */}
            <div className="space-y-2 mb-4">
              <Label htmlFor="directory-name">Directory Name</Label>
              <Input 
                id="directory-name" 
                placeholder="My Marketplace Directory"
                className="text-base py-6"
              />
              <p className="text-xs text-slate-500">
                This name will appear in your directory header and browser title
              </p>
            </div>
            
            {/* Logo Upload Section */}
            <div className="border-t border-slate-100 pt-8 mt-8">
              <h3 className="font-medium text-base mb-4">Upload Your Logo</h3>
              
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-lg p-8 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer" 
                   onClick={() => document.getElementById('logo-upload')?.click()}>
                <div id="logo-upload-container" className="mb-4 text-slate-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto"><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7"/><line x1="16" x2="22" y1="5" y2="5"/><path d="M19 2v6"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                </div>
                <p className="text-sm text-slate-600 text-center mb-2">
                  Drag and drop your logo here, or click to browse
                </p>
                <p className="text-xs text-slate-500 text-center">
                  Supports: PNG, JPG, SVG (Max size: 2MB)
                </p>
                <input 
                  type="file" 
                  className="hidden" 
                  id="logo-upload" 
                  accept="image/png,image/jpeg,image/svg+xml" 
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      const container = document.getElementById('logo-upload-container');
                      if (container) {
                        // Clear container and show success message
                        container.innerHTML = '';
                        
                        // Create success icon
                        const successIcon = document.createElement('div');
                        successIcon.className = 'flex flex-col items-center justify-center';
                        
                        // Add checkmark icon
                        const iconEl = document.createElement('svg');
                        iconEl.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
                        iconEl.setAttribute('width', '40');
                        iconEl.setAttribute('height', '40');
                        iconEl.setAttribute('viewBox', '0 0 24 24');
                        iconEl.setAttribute('fill', 'none');
                        iconEl.setAttribute('stroke', 'currentColor');
                        iconEl.setAttribute('stroke-width', '1.5');
                        iconEl.setAttribute('stroke-linecap', 'round');
                        iconEl.setAttribute('stroke-linejoin', 'round');
                        iconEl.setAttribute('class', 'text-green-500 mx-auto');
                        iconEl.innerHTML = '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>';
                        
                        // Add filename text
                        const textEl = document.createElement('div');
                        textEl.className = 'text-sm text-green-600 font-medium mt-2';
                        textEl.textContent = 'Logo uploaded successfully!';
                        
                        // Add filename
                        const filenameEl = document.createElement('div');
                        filenameEl.className = 'text-xs text-slate-500 mt-1';
                        filenameEl.textContent = e.target.files[0].name;
                        
                        // Append elements
                        successIcon.appendChild(iconEl);
                        successIcon.appendChild(textEl);
                        successIcon.appendChild(filenameEl);
                        container.appendChild(successIcon);
                      }
                    }
                  }}
                />
                <Button variant="outline" size="sm" className="mt-4">
                  Select File
                </Button>
              </div>
              

            </div>
          </div>
        </WizardStep>
        
        <WizardStep 
          title="Collections" 
          description="Organize your listings into collections"
        >
          <div className="space-y-6 py-8">
            <h2 className="text-lg font-bold text-center mb-4">Manage Directory Collections</h2>
            
            <p className="text-center text-sm text-slate-600 mb-8">
              Create collections to organize your listings into categories, featured groups, or special showcases
            </p>
            
            <div className="max-w-4xl mx-auto bg-white rounded-lg border p-6 shadow-sm">
              <CollectionManager 
                collections={collections} 
                onChange={setCollections}
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
                          <Input 
                            id="button-text" 
                            placeholder="Contact Us" 
                            value={previewButtonText}
                            onChange={(e) => setPreviewButtonText(e.target.value)}
                          />
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
                                value={buttonUrl}
                                onChange={(e) => setButtonUrl(e.target.value)}
                                className="flex-1"
                              />
                            </div>
                            <p className="text-xs text-slate-500">
                              {buttonType === "popup" 
                                ? "This URL will be loaded in a popup window." 
                                : "This URL will open in a new tab."}
                              {" "}Use {"{product_name}"} to insert the product name for tracking.
                            </p>
                            <div className="mt-3 p-3 bg-blue-50 rounded-md border border-blue-100">
                              <p className="text-xs text-blue-800">
                                <span className="font-medium">Important:</span> Standard HTML elements with common classes will be automatically styled and tracked. You can also add the <code className="bg-blue-100 px-1 py-0.5 rounded">directory-action-btn</code> class to any element you want to become a tracked button.
                                <br/><br/>
                                Example: <code className="bg-blue-100 px-1 py-0.5 rounded">&lt;a href="https://..." class="directory-action-btn"&gt;Contact Us&lt;/a&gt;</code>
                              </p>
                            </div>
                          </div>
                          
                          {/* Custom Field for GHL Integration */}
                          <div className="space-y-2 pt-2 border-t border-slate-100">
                            <Label htmlFor="custom-field-name-url">Tracking Field Name</Label>
                            <Input 
                              id="custom-field-name-url" 
                              placeholder="listing"
                              value={customFieldName}
                              onChange={(e) => setCustomFieldName(e.target.value)}
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
                            className="py-2 px-4 inline-flex items-center justify-center text-sm font-medium ghl-action-button"
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

                        {/* Popup Color Customization - Only show for popup button type */}
                        {buttonType === "popup" && (
                          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <h4 className="font-medium text-blue-900 mb-4">🎨 Popup Appearance Settings</h4>
                            
                            <div className="grid grid-cols-2 gap-4 mb-4">
                              <div className="space-y-2">
                                <Label htmlFor="popup-bg-color">Popup Background</Label>
                                <div className="flex items-center justify-between">
                                  <div 
                                    className="w-8 h-8 rounded border border-slate-300 cursor-pointer overflow-hidden"
                                    onClick={() => document.getElementById('popup-bg-color')?.click()}
                                  >
                                    <div className="w-full h-full" style={{ backgroundColor: popupBackgroundColor }}></div>
                                  </div>
                                  <Input
                                    id="popup-bg-color"
                                    type="color"
                                    value={popupBackgroundColor}
                                    onChange={(e) => setPopupBackgroundColor(e.target.value)}
                                    className="w-0 h-0 opacity-0 absolute"
                                  />
                                  <Input 
                                    value={popupBackgroundColor}
                                    onChange={(e) => setPopupBackgroundColor(e.target.value)}
                                    placeholder="#FFFFFF"
                                    className="flex-1 ml-2 text-sm"
                                  />
                                </div>
                              </div>
                              
                              <div className="space-y-2">
                                <Label htmlFor="close-btn-color">Close Button Color</Label>
                                <div className="flex items-center justify-between">
                                  <div 
                                    className="w-8 h-8 rounded border border-slate-300 cursor-pointer overflow-hidden"
                                    onClick={() => document.getElementById('close-btn-color')?.click()}
                                  >
                                    <div className="w-full h-full" style={{ backgroundColor: closeButtonColor }}></div>
                                  </div>
                                  <Input
                                    id="close-btn-color"
                                    type="color"
                                    value={closeButtonColor}
                                    onChange={(e) => setCloseButtonColor(e.target.value)}
                                    className="w-0 h-0 opacity-0 absolute"
                                  />
                                  <Input 
                                    value={closeButtonColor}
                                    onChange={(e) => setCloseButtonColor(e.target.value)}
                                    placeholder="#333333"
                                    className="flex-1 ml-2 text-sm"
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                              <div className="space-y-2">
                                <Label htmlFor="close-btn-hover">Close Button Hover</Label>
                                <div className="flex items-center justify-between">
                                  <div 
                                    className="w-8 h-8 rounded border border-slate-300 cursor-pointer overflow-hidden"
                                    onClick={() => document.getElementById('close-btn-hover')?.click()}
                                  >
                                    <div className="w-full h-full" style={{ backgroundColor: closeButtonHoverColor }}></div>
                                  </div>
                                  <Input
                                    id="close-btn-hover"
                                    type="color"
                                    value={closeButtonHoverColor}
                                    onChange={(e) => setCloseButtonHoverColor(e.target.value)}
                                    className="w-0 h-0 opacity-0 absolute"
                                  />
                                  <Input 
                                    value={closeButtonHoverColor}
                                    onChange={(e) => setCloseButtonHoverColor(e.target.value)}
                                    placeholder="#ff4444"
                                    className="flex-1 ml-2 text-sm"
                                  />
                                </div>
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="popup-border-radius">Popup Roundness: {popupBorderRadius}px</Label>
                                <input
                                  id="popup-border-radius"
                                  type="range"
                                  min="0"
                                  max="30"
                                  value={popupBorderRadius}
                                  onChange={(e) => setPopupBorderRadius(parseInt(e.target.value))}
                                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="popup-overlay">Background Overlay</Label>
                              <Input 
                                id="popup-overlay"
                                value={popupOverlayColor}
                                onChange={(e) => setPopupOverlayColor(e.target.value)}
                                placeholder="rgba(0, 0, 0, 0.6)"
                                className="w-full text-sm"
                              />
                              <p className="text-xs text-blue-600">
                                💡 Use rgba() for transparency: rgba(0, 0, 0, 0.6) = 60% black overlay
                              </p>
                            </div>

                            {/* Generate Code Button */}
                            <div className="mt-6 pt-4 border-t border-blue-200">
                              <Button 
                                onClick={() => {
                                  const popupCode = generateFullPopupCode();
                                  copyCodeToClipboard(popupCode.fullIntegrationCode, "Complete popup integration");
                                }}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                              >
                                <Copy className="w-4 h-4 mr-2" />
                                📋 Copy Complete Popup Code
                              </Button>
                              <p className="text-xs text-blue-600 mt-2 text-center">
                                Generates HTML, CSS, and JavaScript with your custom colors and settings
                              </p>
                            </div>
                          </div>
                        )}
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
                          placeholder="https://forms.gohighlevel.com/your-form-id"
                          value={formEmbedUrl}
                          onChange={(e) => setFormEmbedUrl(e.target.value)}
                          className="flex-1"
                        />
                        <p className="text-xs text-slate-500">
                          The URL of your Go HighLevel form that will be embedded on listing pages
                        </p>
                      </div>
                      
                      {/* Form Field Configuration Note */}
                      <div className="p-4 border border-blue-100 bg-blue-50 rounded-md">
                        <div className="flex items-start">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 mt-0.5 mr-2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                          <div>
                            <h4 className="text-sm font-medium text-blue-700">Embedded Form Information</h4>
                            <p className="text-xs text-blue-600 mt-1">
                              Form fields are configured directly in your Go HighLevel form builder. The system will automatically 
                              pass the <strong>{customFieldName}</strong> parameter to your form, allowing you to track which 
                              listing the submission came from.
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Preview of Embedded Form */}
                      <div className="border rounded-md overflow-hidden">
                        <div className="bg-slate-100 px-3 py-2 border-b">
                          <span className="text-xs font-medium text-slate-600">Embedded Form Preview</span>
                        </div>
                        <div className="p-4 bg-white">
                          <div className="border rounded-md p-3 text-center bg-slate-50">
                            <div className="text-sm text-slate-400 mb-2">Form Iframe Container</div>
                            <div className="text-xs text-slate-500">
                              Your GoHighLevel form will be loaded here with automatic tracking parameter:
                              <div className="inline-block px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded mt-1 font-mono">
                                {customFieldName}=[listing-slug]
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Tracking Field Name */}
                      <div className="space-y-2 pt-2 border-t border-slate-100">
                        <Label htmlFor="custom-field-name-embed">Tracking Field Name</Label>
                        <Input 
                          id="custom-field-name-embed" 
                          placeholder="listing"
                          value={customFieldName}
                          onChange={(e) => setCustomFieldName(e.target.value)}
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
                    <Switch 
                      checked={showPrice}
                      onCheckedChange={setShowPrice}
                      id="show-price" 
                    />
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
                    <Switch 
                      checked={showDescription}
                      onCheckedChange={setShowDescription}
                      id="show-expanded-description" 
                    />
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
                    <Switch 
                      checked={showMaps}
                      onCheckedChange={setShowMaps}
                      id="show-google-maps" 
                    />
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
                    <Switch 
                      checked={showMetadata}
                      onCheckedChange={setShowMetadata}
                      id="show-metadata" 
                    />
                  </div>
                </div>
              </div>
              
              {/* Metadata Configuration Section - Only visible when metadata toggle is on */}
              {showMetadata && (
                <div className="border border-slate-200 rounded-lg p-6 bg-white mt-6">
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-slate-700">Metadata Configuration</h4>
                    <p className="text-xs text-slate-500">Add up to 5 metadata items to display for each listing</p>
                    
                    {/* Dynamic Metadata Items */}
                    {metadataFields.map((field) => (
                      <div key={field.id} className="border border-slate-200 rounded p-3 bg-slate-50">
                        <div className="grid grid-cols-8 gap-3">
                          <div className="col-span-2">
                            <Label htmlFor={`meta-icon-${field.id}`} className="text-xs block mb-1.5">Icon</Label>
                            <div 
                              className="flex items-center justify-center h-10 bg-white border border-slate-200 rounded cursor-pointer hover:bg-slate-50 transition-colors"
                              onClick={() => document.getElementById(`meta-icon-${field.id}`)?.click()}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7" /><line x1="16" x2="22" y1="5" y2="5" /><line x1="19" x2="19" y1="2" y2="8" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg>
                              <Input 
                                id={`meta-icon-${field.id}`}
                                type="file" 
                                accept="image/png,image/jpeg,image/svg+xml" 
                                className="hidden"
                                onChange={(e) => {
                                  if (e.target.files && e.target.files[0]) {
                                    // Get the file upload container
                                    const container = e.target.parentElement;
                                    if (container) {
                                      // Clear previous content
                                      container.innerHTML = '';
                                      
                                      // Add success indicator
                                      const successEl = document.createElement('div');
                                      successEl.className = 'flex items-center';
                                      
                                      // Add checkmark icon
                                      const iconEl = document.createElement('svg');
                                      iconEl.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
                                      iconEl.setAttribute('width', '14');
                                      iconEl.setAttribute('height', '14');
                                      iconEl.setAttribute('viewBox', '0 0 24 24');
                                      iconEl.setAttribute('fill', 'none');
                                      iconEl.setAttribute('stroke', 'currentColor');
                                      iconEl.setAttribute('stroke-width', '2');
                                      iconEl.setAttribute('stroke-linecap', 'round');
                                      iconEl.setAttribute('stroke-linejoin', 'round');
                                      iconEl.setAttribute('class', 'text-green-500 mr-1');
                                      iconEl.innerHTML = '<polyline points="20 6 9 17 4 12"></polyline>';
                                      
                                      // Add filename text
                                      const textEl = document.createElement('span');
                                      textEl.className = 'text-xs text-slate-600 truncate max-w-[60px]';
                                      textEl.textContent = e.target.files[0].name;
                                      
                                      // Append elements
                                      successEl.appendChild(iconEl);
                                      successEl.appendChild(textEl);
                                      container.appendChild(successEl);
                                      
                                      // Re-append the input element
                                      container.appendChild(e.target);
                                    }
                                  }
                                }}
                              />
                            </div>
                          </div>
                          <div className="col-span-5">
                            <Label htmlFor={`meta-name-${field.id}`} className="text-xs block mb-1.5">Name</Label>
                            <Input
                              id={`meta-name-${field.id}`}
                              placeholder="e.g. Category, Version, etc."
                              className="h-10"
                              value={field.label || ""}
                              onChange={(e) => updateMetadataField(field.id, e.target.value)}
                            />
                          </div>
                          <div className="col-span-1 flex items-end">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="px-2 h-10 w-full text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => removeMetadataField(field.id)}
                              disabled={metadataFields.length <= 1} // Prevent removing the last field
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></svg>
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Add More Metadata Button */}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full mt-2"
                      onClick={addMetadataField}
                      disabled={metadataFields.length >= 5}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
                      Add More Metadata {metadataFields.length >= 5 && "(Max 5)"}
                    </Button>
                    
                    <p className="text-xs text-slate-500 mt-2">
                      {metadataFields.length === 0 ? (
                        <span className="text-amber-500">You need at least one metadata field for the metadata bar to display</span>
                      ) : (
                        `Currently using ${metadataFields.length} of 5 available metadata fields`
                      )}
                    </p>
                  </div>
                </div>
              )}
              
              {/* Component Preview removed as requested */}
            </div>
          </div>
        </WizardStep>
        
        {/* Tracking Field step removed as requested */}
        
        {/* Custom Form Preview Step - Different Layout */}
        <div className="w-full bg-white p-8 rounded-lg border border-slate-100 shadow-sm mb-6">
          <div className="flex flex-col items-center justify-center min-h-[600px]">
            <h2 className="text-2xl font-bold text-center mb-4 text-slate-800">Form Preview</h2>
            <p className="text-slate-500 text-center mb-8">See how your form will appear to users</p>
            
            {/* Centered Form Preview Container */}
            <div className="w-full max-w-5xl flex justify-center">
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-8 shadow-lg w-full max-w-4xl">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold text-slate-700 mb-2">Listing Form Preview</h3>
                  <p className="text-sm text-slate-500">
                    This is how your listing creation form will appear to users
                  </p>
                </div>
                
                {/* Form Preview with Perfect Centering */}
                <div className="bg-white rounded-lg border border-slate-300 p-6 flex justify-center items-start">
                  <div
                    className="form-preview w-full max-w-3xl"
                    style={{ minHeight: '400px' }}
                    dangerouslySetInnerHTML={{ __html: generateFormPreview() }}
                  />
                </div>
                
                <div className="mt-6 text-center">
                  <p className="text-sm text-slate-500">
                    ✨ This preview updates automatically based on your configuration settings
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
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
              We'll generate the integration code for your Go HighLevel site based on your settings.
            </p>
            
            <div className="space-y-4">
              <Button 
                size="lg" 
                className="px-8 py-6 text-base" 
                onClick={() => {
                  // Find the next step button and click it
                  const nextButton = document.querySelector('button:has(.w-4.h-4.ml-2)') as HTMLButtonElement;
                  if (nextButton) nextButton.click();
                }}
              >
                Generate Code
              </Button>
              
              <div className="flex items-center justify-center mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  className="mr-2"
                  onClick={() => {
                    // Export configuration to JSON file with all current settings
                    const completeConfig = {
                      // Include existing stored config
                      ...getConfig(),
                      
                      // Directory settings
                      directoryName: document.getElementById('directory-name')?.value || "My Directory",
                      
                      // Collections data
                      collections: collections,
                      
                      // Button configuration
                      enableActionButton: selectedOptIn === "action-button",
                      buttonType: buttonType,
                      buttonLabel: previewButtonText,
                      buttonColor: previewColor,
                      buttonTextColor: previewTextColor,
                      buttonBorderRadius: previewBorderRadius,
                      formEmbedUrl: formEmbedUrl,
                      customFormFieldName: customFieldName,
                      
                      // Component visibility
                      enablePriceDisplay: showPrice,
                      enableExpandedDescription: showDescription,
                      enableLocationMap: showMaps,
                      enableMetadataDisplay: showMetadata,
                      
                      // Metadata fields
                      metadataFields: metadataFields,
                      metadataLabels: metadataFields.map(field => field.label),
                      metadataCount: metadataFields.length,
                      
                      // Form fields configuration
                      formFields: formFields,
                      
                      // Updated timestamp
                      updatedAt: new Date().toISOString()
                    };
                    
                    const configString = JSON.stringify(completeConfig, null, 2);
                    const blob = new Blob([configString], { type: "application/json" });
                    const url = URL.createObjectURL(blob);
                    
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "directory_config.json";
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg>
                  Export Config
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Create a file input element
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = "application/json";
                    input.style.display = "none";
                    
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          try {
                            const result = event.target?.result;
                            if (typeof result === 'string') {
                              const config = JSON.parse(result);
                              
                              // Update all state values from the imported config
                              if (config.collections && Array.isArray(config.collections)) {
                                setCollections(config.collections);
                              }
                              
                              // Update opt-in type
                              if (config.enableActionButton !== undefined) {
                                setSelectedOptIn(config.enableActionButton ? "action-button" : null);
                              }
                              
                              // Update button settings
                              if (config.buttonType) setButtonType(config.buttonType);
                              if (config.buttonLabel) setPreviewButtonText(config.buttonLabel);
                              if (config.buttonColor) setPreviewColor(config.buttonColor);
                              if (config.buttonTextColor) setPreviewTextColor(config.buttonTextColor);
                              if (config.buttonBorderRadius !== undefined) setPreviewBorderRadius(config.buttonBorderRadius);
                              if (config.formEmbedUrl) setFormEmbedUrl(config.formEmbedUrl);
                              if (config.customFormFieldName) setCustomFieldName(config.customFormFieldName);
                              
                              // Update component visibility
                              if (config.enablePriceDisplay !== undefined) setShowPrice(config.enablePriceDisplay);
                              if (config.enableExpandedDescription !== undefined) setShowDescription(config.enableExpandedDescription);
                              if (config.enableLocationMap !== undefined) setShowMaps(config.enableLocationMap);
                              if (config.enableMetadataDisplay !== undefined) setShowMetadata(config.enableMetadataDisplay);
                              
                              // Update metadata fields if available
                              if (config.metadataLabels && Array.isArray(config.metadataLabels)) {
                                const updatedFields = config.metadataLabels.map((label, index) => ({
                                  id: index + 1,
                                  label,
                                  enabled: true
                                }));
                                setMetadataFields(updatedFields);
                              }
                              
                              saveConfig(config);
                              toast({
                                title: "Configuration Imported",
                                description: "Your configuration has been loaded successfully."
                              });
                              
                              // Force refresh the page to reflect new config
                              window.location.reload();
                            }
                          } catch (error) {
                            toast({
                              title: "Import Failed",
                              description: "The configuration file could not be loaded.",
                              variant: "destructive"
                            });
                          }
                        };
                        reader.readAsText(file);
                      }
                    };
                    
                    document.body.appendChild(input);
                    input.click();
                    document.body.removeChild(input);
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" /></svg>
                  Import Config
                </Button>
              </div>
            </div>
          </div>
        </WizardStep>

        {/* CSS Selector Code */}
        <WizardStep 
          title="CSS Selector Code" 
          description="Styling instructions for your website"
        >
          <div className="space-y-6 py-8">
            <h2 className="text-lg font-bold text-center mb-4">CSS Selector Code</h2>
            <p className="text-sm text-slate-600 text-center mb-6">
              Add this code to your website's CSS file or custom CSS section in your theme settings.
            </p>
            
            <div className="border border-slate-200 rounded-md overflow-hidden">
              <div className="bg-slate-800 px-4 py-2 flex justify-between items-center">
                <span className="text-slate-300 text-sm">CSS Selectors</span>
                <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                  <span className="ml-1">Copy</span>
                </Button>
              </div>
              <div className="bg-slate-900 p-4 text-slate-300 font-mono text-sm overflow-x-auto whitespace-pre">
{`/* -------------------------------------
   🔍 DIRECTORY LISTING CUSTOMIZATIONS
-------------------------------------- */
.ghl-directory-listing {
  max-width: 1200px;
  margin: 0 auto;
}

/* -------------------------------------
   🖱️ ACTION BUTTON STYLING
-------------------------------------- */
.ghl-listing-button {
  background-color: ${previewColor};
  color: ${previewTextColor};
  border-radius: ${previewBorderRadius}px;
  padding: 0.5rem 1rem;
  font-weight: 500;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.ghl-listing-button:hover {
  opacity: 0.9;
}

/* -------------------------------------
   📷 PRODUCT IMAGE GALLERY (2 ROW LIMIT)
-------------------------------------- */
.image-list {
  display: flex !important;
  flex-wrap: wrap !important;
  justify-content: flex-start;
  gap: 10px;
  max-height: 170px; /* Approx height of 2 rows */
  overflow: hidden;
  padding: 10px 0;
}

.image-list > div {
  width: calc(14.28% - 10px); /* 7 images per row */
  flex: 0 0 auto;
}

.image-list img {
  width: 100% !important;
  height: auto;
  object-fit: cover;
  border-radius: 6px;
  transition: transform 0.2s ease;
}

.image-list img:hover {
  transform: scale(1.05);
  cursor: pointer;
}

/* -------------------------------------
   🏷️ PRODUCT TITLE (UNTRUNCATE)
-------------------------------------- */
.hl-product-detail-product-name.truncate-text {
  white-space: normal !important;
  overflow: visible !important;
  text-overflow: unset !important;
  display: block !important;
  line-height: 1.4;
  word-break: break-word;
}

/* -------------------------------------
   ➖ REMOVE UNNEEDED UI ELEMENTS
-------------------------------------- */
.quantity-container,
#add-to-cart-btn,
#buy-now-btn,
.show-more {
  display: none !important;
}

/* -------------------------------------
   🔄 UNSTICK + ALIGN IMAGE & DETAILS SECTION
-------------------------------------- */
.product-detail-container {
  display: flex !important;
  flex-wrap: nowrap !important;
  align-items: flex-start !important;
  gap: 40px;
}

.hl-product-image-container {
  position: static !important;
  top: auto !important;
  max-height: none !important;
  overflow: visible !important;
  display: block !important;
  align-self: flex-start !important;
  margin-top: 0 !important;
}

.c-product-details {
  margin-top: 0 !important;
  align-self: flex-start;
  flex: 1;
}

${showMetadata ? `/* -------------------------------------
   🔖 METADATA DISPLAY
-------------------------------------- */
.ghl-metadata-bar {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  padding: 0.5rem;
  background-color: #f8fafc;
  border-radius: 0.25rem;
}

.ghl-metadata-item {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  background-color: #e0e7ff;
  color: #4338ca;
}` : '/* Metadata bar disabled */'}

${showPrice ? `/* -------------------------------------
   💰 PRICE DISPLAY
-------------------------------------- */
.ghl-listing-price {
  font-weight: 600;
  color: #047857;
  background-color: #ecfdf5;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
}

/* Full product description if price is shown */
#description.description {
  max-height: none !important;
  overflow: visible !important;
  white-space: normal !important;
  display: block !important;
}` : '/* Price display disabled */'}

${showDescription ? `/* -------------------------------------
   📄 EXTENDED DESCRIPTION
-------------------------------------- */
.ghl-listing-description {
  margin-top: 1rem;
  font-size: 0.875rem;
  line-height: 1.5;
  color: #475569;
}` : '/* Extended description disabled */'}

${showMaps ? `/* -------------------------------------
   🗺️ GOOGLE MAPS WIDGET
-------------------------------------- */
.ghl-maps-container {
  margin-top: 1.5rem;
  width: 100%;
  height: 300px;
  border-radius: 0.375rem;
  overflow: hidden;
}` : '/* Maps widget disabled */'}

${selectedOptIn === "action-button" ? `/* -------------------------------------
   ▶️ ACTION BUTTON CONFIGURATION
-------------------------------------- */
/* Primary styling for the action button */
.directory-action-btn {
  display: inline-block;
  padding: 8px 16px;
  background-color: ${previewColor || '#4f46e5'};
  color: ${previewTextColor || '#ffffff'};
  border-radius: ${previewBorderRadius || 4}px;
  font-weight: 500;
  text-decoration: none;
  margin-top: 1rem;
  transition: all 0.2s ease-in-out;
  cursor: pointer;
}

/* Hover effects */
.directory-action-btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

/* When the listing data is attached */
.directory-action-btn[data-listing] {
  position: relative;
}

/* Arrow indicator for tracked buttons */
.directory-action-btn[data-listing]::after {
  content: "→";
  margin-left: 6px;
  transition: transform 0.2s ease;
}

.directory-action-btn[data-listing]:hover::after {
  transform: translateX(3px);
}

/* Generate CSS to transform normal links to action buttons in certain containers */
.product-item a.view-details,
.listing-container a.action-link,
.product-actions a:not(.secondary-action),
a.primary-action {
  display: inline-block;
  padding: 8px 16px;
  background-color: ${previewColor || '#4f46e5'};
  color: ${previewTextColor || '#ffffff'} !important;
  border-radius: ${previewBorderRadius || 4}px;
  font-weight: 500;
  text-decoration: none;
  margin-top: 1rem;
  transition: all 0.2s ease-in-out;
  cursor: pointer;
}

/* Make these links use the directory-action-btn styles */
.product-item a.view-details:hover,
.listing-container a.action-link:hover,
.product-actions a:not(.secondary-action):hover,
a.primary-action:hover {
  opacity: 0.9;
  transform: translateY(-1px);
  text-decoration: none;
}

/* Auto-tracking JavaScript (via ::before pseudo content hack) - This runs onload */
.directory-tracking-init::before {
  content: "";
  display: none;
}

/* Animation setup to execute JS once */
@-webkit-keyframes dirTrackingInit {
  from { opacity: 0.01; }
  to { opacity: 0.011; }  /* Tiny change to trigger rendering but remain invisible */
}

/* Execute once per page */
body:not([data-tracking-init]) {
  -webkit-animation-name: dirTrackingInit;
  -webkit-animation-duration: 0.001s;
  -webkit-animation-iteration-count: 1;
  -webkit-animation-timing-function: ease;
  -webkit-animation-delay: 0s;
  -webkit-animation-fill-mode: forwards;
}

/* Add script to head when animation fires */
@-webkit-keyframes dirTrackingInit {
  from {
    /* This is executed when animation starts */
  }
  to {
    /* This is executed when animation ends, where we inject our code */
    background-image: url("data:image/svg+xml;charset=utf8,<svg xmlns='http://www.w3.org/2000/svg' onload=\\"
      (function() {
        /* Mark body as initialized */
        document.body.setAttribute('data-tracking-init', 'true');
        
        /* Extract the listing slug */
        const getSlug = function() {
          const url = new URL(window.location.href);
          const pathSegments = url.pathname.split('/').filter(Boolean);
          return pathSegments[pathSegments.length - 1] || url.searchParams.get('listing') || '';
        };
        
        /* Get custom field name from global config or use default */
        const getFieldName = function() {
          return (window.GHL_DIRECTORY && window.GHL_DIRECTORY.customField) ? 
            window.GHL_DIRECTORY.customField : '${customFieldName}';
        };
        
        /* Get the slug */
        const slug = getSlug();
        const fieldName = getFieldName();
        
        if (!slug) return; // Exit if no slug found
        
        /* Auto-track all directory action buttons */
        const buttonSelectors = [
          '.directory-action-btn',
          '.product-item a.view-details', 
          '.listing-container a.action-link',
          '.product-actions a:not(.secondary-action)',
          'a.primary-action'
        ];
        
        /* Select all elements matching our selectors */
        buttonSelectors.forEach(selector => {
          document.querySelectorAll(selector).forEach(btn => {
            /* Skip if already processed */
            if (btn.hasAttribute('data-listing')) return;
            
            /* Mark with the listing slug */
            btn.setAttribute('data-listing', slug);
            btn.classList.add('directory-tracking-processed');
            
            /* Add tracking parameters to the URL */
            if (btn.tagName === 'A' && btn.href) {
              try {
                const url = new URL(btn.href);
                url.searchParams.set('utm_source', 'directory');
                url.searchParams.set('utm_medium', 'listing_action');
                url.searchParams.set('utm_campaign', slug);
                url.searchParams.set(fieldName, slug);
                btn.href = url.toString();
              } catch(e) { 
                console.log('Non-URL href, skipping parameter addition');
              }
            }
          });
        });
        
        /* Report tracking status */
        console.log('Directory tracking initialized with field: ' + fieldName + ' and slug: ' + slug);
      })()
    \\" style='display:none'></svg>");
  }
}` : '/* Action button disabled */'}

${buttonType === "download" ? `/* -------------------------------------
   ⬇️ DOWNLOAD OPTION STYLING
-------------------------------------- */
.ghl-download-container {
  margin-top: 1.5rem;
  padding: 1rem;
  border: 1px dashed #e2e8f0;
  border-radius: 0.5rem;
  background-color: #f8fafc;
}

.ghl-download-button {
  display: inline-flex;
  align-items: center;
  padding: 8px 16px;
  background-color: #4f46e5;
  color: white;
  border-radius: 4px;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.2s ease-in-out;
}

.ghl-download-button:hover {
  background-color: #4338ca;
}

.ghl-download-button svg {
  margin-right: 8px;
}

/* Ensure download tracking is enabled */
.ghl-download-button[data-listing] {
  position: relative;
}` : '/* Download option disabled */'}`}
              </div>
            </div>
          </div>
        </WizardStep>
        
        {/* Footer Code */}
        <WizardStep 
          title="Footer Code" 
          description="JavaScript to add to your site footer"
        >
          <div className="space-y-6 py-8">
            <h2 className="text-lg font-bold text-center mb-4">Footer JavaScript Code</h2>
            <p className="text-sm text-slate-600 text-center mb-6">
              Add this code before the closing &lt;/body&gt; tag of your website.
            </p>
            
            <div className="border border-slate-200 rounded-md overflow-hidden">
              <div className="bg-slate-800 px-4 py-2 flex justify-between items-center">
                <span className="text-slate-300 text-sm">Footer Code</span>
                <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                  <span className="ml-1">Copy</span>
                </Button>
              </div>
              <div className="bg-slate-900 p-4 text-slate-300 font-mono text-sm overflow-x-auto whitespace-pre">
{`<script>
  // GHL Directory Integration - Footer Script
  document.addEventListener('DOMContentLoaded', function() {
    // Extract slug from URL
    const url = new URL(window.location.href);
    const pathSegments = url.pathname.split('/').filter(Boolean);
    const slug = pathSegments[pathSegments.length - 1];
    
    if (!slug) return;
    
    // Add listing slug as hidden field to all forms
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
      const hiddenField = document.createElement('input');
      hiddenField.type = 'hidden';
      hiddenField.name = 'listing';
      hiddenField.value = slug;
      form.appendChild(hiddenField);
    });
    
    // Add UTM parameters to links
    const links = document.querySelectorAll('a');
    links.forEach(link => {
      if (link.href.includes('gohighlevel.com')) {
        const linkUrl = new URL(link.href);
        linkUrl.searchParams.set('listing', slug);
        linkUrl.searchParams.set('utm_source', 'directory');
        linkUrl.searchParams.set('utm_medium', 'listing');
        linkUrl.searchParams.set('utm_campaign', slug);
        link.href = linkUrl.toString();
      }
    });
  });
</script>`}
              </div>
            </div>
          </div>
        </WizardStep>
        
        {/* Header Code */}
        <WizardStep 
          title="Header Code" 
          description="JavaScript to add to your site header"
        >
          <div className="space-y-6 py-8">
            <h2 className="text-lg font-bold text-center mb-4">Header JavaScript Code</h2>
            <p className="text-sm text-slate-600 text-center mb-6">
              Add this code in the &lt;head&gt; section of your website.
            </p>
            
            <div className="border border-slate-200 rounded-md overflow-hidden">
              <div className="bg-slate-800 px-4 py-2 flex justify-between items-center">
                <span className="text-slate-300 text-sm">Header Code</span>
                <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                  <span className="ml-1">Copy</span>
                </Button>
              </div>
              <div className="bg-slate-900 p-4 text-slate-300 font-mono text-sm overflow-x-auto whitespace-pre">
{`<script>
  // GHL Directory Integration - Header Script
  (function() {
    // Configuration
    window.GHL_DIRECTORY = {
      customField: '${customFieldName}',
      tracking: true,
      autoEmbed: ${selectedOptIn === "embedded-form" ? 'true' : 'false'}
    };
    
    // Create global namespace
    window.GHLDirectory = {
      // Get the listing slug from URL
      getSlug: function() {
        const url = new URL(window.location.href);
        const pathSegments = url.pathname.split('/').filter(Boolean);
        return pathSegments[pathSegments.length - 1] || url.searchParams.get('listing') || '';
      },
      
      // Helper to add parameters to URLs
      addParameter: function(formUrl, key, value) {
        const url = new URL(formUrl);
        url.searchParams.set(key, value);
        return url.toString();
      },
      
      // Add tracking to forms
      addTrackingToForms: function(slug) {
        const fieldName = window.GHL_DIRECTORY.customField;
        document.querySelectorAll('form').forEach(form => {
          if (!form.querySelector('input[name="' + fieldName + '"]')) {
            const hiddenField = document.createElement('input');
            hiddenField.type = 'hidden';
            hiddenField.name = fieldName;
            hiddenField.value = slug;
            form.appendChild(hiddenField);
            
            // Add data attribute for easier debugging
            form.setAttribute('data-listing', slug);
            
            // Add timestamp for tracking
            const timestampField = document.createElement('input');
            timestampField.type = 'hidden';
            timestampField.name = 'access_timestamp';
            timestampField.value = new Date().toISOString();
            form.appendChild(timestampField);
          }
        });
      },
      
      // Setup action buttons with tracking
      setupActionButtons: function(slug) {
        const fieldName = window.GHL_DIRECTORY.customField;
        document.querySelectorAll('.ghl-action-button').forEach(button => {
          // Mark the button with the listing data
          button.setAttribute('data-listing', slug);
          
          // If button is a link, add tracking parameters
          if (button instanceof HTMLAnchorElement) {
            const urlTemplate = button.getAttribute('href') || '';
            if (urlTemplate && !urlTemplate.startsWith('#')) {
              try {
                const url = new URL(urlTemplate);
                
                // Add tracking parameters
                url.searchParams.set('utm_source', 'directory');
                url.searchParams.set('utm_medium', 'action_button');
                url.searchParams.set('utm_campaign', slug);
                url.searchParams.set(fieldName, slug);
                
                button.href = url.toString();
              } catch (error) {
                console.error('Error processing action button URL:', error);
              }
            }
          }
        });
      },
      
      // Setup download buttons with tracking
      setupDownloadButtons: function(slug) {
        const fieldName = window.GHL_DIRECTORY.customField;
        document.querySelectorAll('.ghl-download-button').forEach(button => {
          // Mark the button with the listing data
          button.setAttribute('data-listing', slug);
          
          // Add click handler for downloads
          button.addEventListener('click', function(e) {
            if (button.hasAttribute('data-download-url')) {
              e.preventDefault();
              
              const downloadUrl = button.getAttribute('data-download-url');
              if (downloadUrl) {
                try {
                  const url = new URL(downloadUrl);
                  url.searchParams.set(fieldName, slug);
                  url.searchParams.set('timestamp', Date.now().toString());
                  window.location.href = url.toString();
                } catch (error) {
                  console.error('Error processing download URL:', error);
                  // Fallback handling
                  const separator = downloadUrl.includes('?') ? '&' : '?';
                  window.location.href = downloadUrl + separator + fieldName + '=' + slug;
                }
              }
            }
          });
        });
      }
    };
    
    // Initialize tracking when DOM is ready
    document.addEventListener('DOMContentLoaded', function() {
      const slug = window.GHLDirectory.getSlug();
      if (slug) {
        console.log('Listing slug detected:', slug);
        window.GHLDirectory.addTrackingToForms(slug);
        window.GHLDirectory.setupActionButtons(slug);
        window.GHLDirectory.setupDownloadButtons(slug);
        
        // Store listing info in sessionStorage for other scripts
        sessionStorage.setItem('current_listing_slug', slug);
        sessionStorage.setItem('ghl_field_name', window.GHL_DIRECTORY.customField);
      }
    });
  })();
</script>`}
              </div>
            </div>
          </div>
        </WizardStep>
        
        {/* Listing Form Embed Code */}
        <WizardStep 
          title="Listing Form Embed Code" 
          description="HTML code for embedding forms"
        >
          <div className="space-y-6 py-8">
            <h2 className="text-lg font-bold text-center mb-4">Listing Form Embed Code</h2>
            <p className="text-sm text-slate-600 text-center mb-6">
              Add this code where you want your form to appear on listing pages.
            </p>
            
            <div className="border border-slate-200 rounded-md overflow-hidden">
              <div className="bg-slate-800 px-4 py-2 flex justify-between items-center">
                <span className="text-slate-300 text-sm">Form Embed HTML</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-slate-300 hover:text-white"
                  onClick={() => {
                    // Generate the form embed code
                    const formCode = `<!-- GHL Directory Form Embed -->
<div class="ghl-form-container">
  <div class="ghl-form-wrapper" data-form-type="${selectedOptIn === "embedded-form" ? 'embed' : 'popup'}">
    ${selectedOptIn === "embedded-form" ?
      `<iframe
      id="ghl-form-iframe"
      src=""
      width="100%"
      height="600px"
      frameborder="0"
      allowfullscreen
    ></iframe>
    <script>
      document.addEventListener('DOMContentLoaded', function() {
        const slug = window.GHLDirectory.getSlug();
        const iframe = document.getElementById('ghl-form-iframe');
        let formUrl = '${formEmbedUrl}';
        
        if (slug) {
          formUrl = window.GHLDirectory.addParameter(formUrl, '${customFieldName}', slug);
          formUrl = window.GHLDirectory.addParameter(formUrl, 'utm_source', 'directory');
          iframe.src = formUrl;
        }
      });
    </script>` :
      `<button class="ghl-listing-button" onclick="openGhlForm()">
      ${previewButtonText}
    </button>
    <script>
      function openGhlForm() {
        const slug = window.GHLDirectory.getSlug();
        let formUrl = '${formEmbedUrl}';
        
        if (slug) {
          formUrl = window.GHLDirectory.addParameter(formUrl, '${customFieldName}', slug);
          formUrl = window.GHLDirectory.addParameter(formUrl, 'utm_source', 'directory');
          window.open(formUrl, '_blank');
        }
      }
    </script>`
    }
  </div>
</div>`;
                    
                    // Copy to clipboard
                    navigator.clipboard.writeText(formCode)
                      .then(() => {
                        alert('Form embed code copied to clipboard!');
                      })
                      .catch(err => {
                        console.error('Failed to copy code: ', err);
                        alert('Failed to copy code. Please select and copy manually.');
                      });
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                  <span className="ml-1">Copy</span>
                </Button>
              </div>
              <div className="bg-slate-900 p-4 text-slate-300 font-mono text-sm overflow-x-auto whitespace-pre">
{`<!-- GHL Directory Form Embed -->
<div class="ghl-form-container">
  <div class="ghl-form-wrapper" data-form-type="${selectedOptIn === "embedded-form" ? 'embed' : 'popup'}">
    ${selectedOptIn === "embedded-form" ?
      `<iframe
      id="ghl-form-iframe"
      src=""
      width="100%"
      height="600px"
      frameborder="0"
      allowfullscreen
    ></iframe>
    <script>
      document.addEventListener('DOMContentLoaded', function() {
        const slug = window.GHLDirectory.getSlug();
        const iframe = document.getElementById('ghl-form-iframe');
        let formUrl = '${formEmbedUrl}';
        
        if (slug) {
          formUrl = window.GHLDirectory.addParameter(formUrl, '${customFieldName}', slug);
          formUrl = window.GHLDirectory.addParameter(formUrl, 'utm_source', 'directory');
          iframe.src = formUrl;
        }
      });
    </script>` :
      `<button class="ghl-listing-button" onclick="openGhlForm()">
      ${previewButtonText}
    </button>
    <script>
      function openGhlForm() {
        const slug = window.GHLDirectory.getSlug();
        let formUrl = '${formEmbedUrl}';
        
        if (slug) {
          formUrl = window.GHLDirectory.addParameter(formUrl, '${customFieldName}', slug);
          formUrl = window.GHLDirectory.addParameter(formUrl, 'utm_source', 'directory');
          window.open(formUrl, '_blank');
        }
      }
    </script>`
    }
  </div>
</div>

<!-- Alternative: Custom HTML Form with selected fields -->
<!-- 
<div class="ghl-custom-form-container">
  <form id="ghl-directory-form" class="ghl-directory-form" action="${formEmbedUrl}" method="POST">
    <!-- Hidden tracking field for the product/listing slug -->
    <input type="hidden" id="ghl-listing-field" name="${customFieldName}">
    
    ${formFields.name ? 
    `<!-- Name field -->
    <div class="ghl-form-group">
      <label for="name">Name</label>
      <input type="text" id="name" name="name" required>
    </div>` : ''}
    
    ${formFields.email ? 
    `<!-- Email field -->
    <div class="ghl-form-group">
      <label for="email">Email</label>
      <input type="email" id="email" name="email" required>
    </div>` : ''}
    
    ${formFields.phone ? 
    `<!-- Phone field -->
    <div class="ghl-form-group">
      <label for="phone">Phone</label>
      <input type="tel" id="phone" name="phone">
    </div>` : ''}
    
    ${formFields.company ? 
    `<!-- Company field -->
    <div class="ghl-form-group">
      <label for="company">Company</label>
      <input type="text" id="company" name="company">
    </div>` : ''}
    
    ${formFields.address ? 
    `<!-- Address field -->
    <div class="ghl-form-group">
      <label for="address">Address</label>
      <input type="text" id="address" name="address">
    </div>` : ''}
    
    ${formFields.message ? 
    `<!-- Message field -->
    <div class="ghl-form-group">
      <label for="message">Message</label>
      <textarea id="message" name="message" rows="4"></textarea>
    </div>` : ''}
    
    <!-- Submit button -->
    <div class="ghl-form-group">
      <button type="submit" class="ghl-submit-button">${previewButtonText}</button>
    </div>
  </form>
  
  <script>
    async function generateBulletPoints(button) {
      const textarea = button.parentElement.querySelector('textarea[name="description"]');
      const description = textarea.value.trim();
      
      if (!description) {
        alert('Please enter a description first');
        return;
      }
      
      // Show loading state
      const originalText = button.innerHTML;
      button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="animate-spin"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg> Processing...';
      button.disabled = true;
      
      try {
        const response = await fetch('/api/ai/generate-bullets', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ description })
        });
        
        if (!response.ok) {
          throw new Error('Failed to generate bullet points');
        }
        
        const data = await response.json();
        const bulletPoints = data.bulletPoints;
        
        if (bulletPoints && bulletPoints.length > 0) {
          const bulletText = bulletPoints.map(point => '• ' + point).join('\\n');
          textarea.value = bulletText;
          // Trigger change event to update any listeners
          textarea.dispatchEvent(new Event('input', { bubbles: true }));
        }
      } catch (error) {
        console.error('Error generating bullet points:', error);
        alert('Failed to generate bullet points. Please try again.');
      } finally {
        // Restore button state
        button.innerHTML = originalText;
        button.disabled = false;
      }
    }
    
    document.addEventListener('DOMContentLoaded', function() {
      // Get the current listing slug
      const slug = window.GHLDirectory.getSlug();
      
      // Set the hidden field value
      if (slug) {
        document.getElementById('ghl-listing-field').value = slug;
      }
      
      // Add form submission handler
      const form = document.getElementById('ghl-directory-form');
      form.addEventListener('submit', function(e) {
        // Optional: add validation here
        
        // Add analytics tracking if needed
        if (window.gtag) {
          window.gtag('event', 'form_submission', {
            'listing_slug': slug
          });
        }
      });
    });
  </script>
</div>

<style>
  /* Custom form styling */
  .ghl-custom-form-container {
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
  }
  
  .ghl-directory-form {
    display: grid;
    gap: 16px;
  }
  
  .ghl-form-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .ghl-form-group label {
    font-weight: 500;
    font-size: 14px;
    color: #333;
  }
  
  .ghl-form-group input,
  .ghl-form-group textarea {
    padding: 10px 12px;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    font-size: 16px;
    line-height: 1.5;
    width: 100%;
    transition: border-color 0.2s ease;
  }
  
  .ghl-form-group input:focus,
  .ghl-form-group textarea:focus {
    outline: none;
    border-color: #4f46e5;
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
  }
  
  .ghl-submit-button {
    background-color: #4f46e5;
    color: white;
    border: none;
    border-radius: 6px;
    padding: 12px 20px;
    font-weight: 500;
    font-size: 16px;
    cursor: pointer;
    transition: background-color 0.2s ease;
  }
  
  .ghl-submit-button:hover {
    background-color: #4338ca;
  }
  
  .ghl-listing-button {
    display: inline-block;
    background-color: #4f46e5;
    color: white;
    border: none;
    border-radius: 6px;
    padding: 12px 20px;
    font-weight: 500;
    font-size: 16px;
    cursor: pointer;
    text-decoration: none;
    transition: background-color 0.2s ease;
  }
  
  .ghl-listing-button:hover {
    background-color: #4338ca;
  }
</style>
-->
`}
              </div>
            </div>
            
            <div className="text-center mt-8">
              <Button 
                size="lg" 
                className="px-8 py-2 text-base"
                onClick={() => {
                  // Generate all code snippets together
                  const headerCode = `<!-- GHL Directory Header Script -->
<script>
  (function() {
    window.GHLDirectory = window.GHLDirectory || {};
    window.GHLDirectory.customField = "${customFieldName}";
    
    window.GHLDirectory.getSlug = function() {
      const url = new URL(window.location.href);
      const pathSegments = url.pathname.split('/').filter(segment => segment.length > 0);
      return pathSegments[pathSegments.length - 1] || null;
    };
    
    window.GHLDirectory.addParameter = function(url, key, value) {
      const separator = url.includes('?') ? '&' : '?';
      return \`\${url}\${separator}\${key}=\${value}\`;
    };
    
    window.GHLDirectory.addTrackingToForms = function(slug) {
      document.querySelectorAll('form').forEach(form => {
        const hiddenField = document.createElement('input');
        hiddenField.type = 'hidden';
        hiddenField.name = window.GHLDirectory.customField;
        hiddenField.value = slug;
        form.appendChild(hiddenField);
      });
    };
    
    window.GHLDirectory.setupActionButtons = function(slug) {
      document.querySelectorAll('.action-button').forEach(button => {
        button.addEventListener('click', function(e) {
          const targetUrl = this.getAttribute('data-url');
          if (targetUrl) {
            e.preventDefault();
            const url = window.GHLDirectory.addParameter(targetUrl, window.GHLDirectory.customField, slug);
            window.open(url, '_blank');
          }
        });
      });
    };
    
    window.GHLDirectory.setupDownloadButtons = function(slug) {
      document.querySelectorAll('.download-button').forEach(button => {
        button.addEventListener('click', function(e) {
          const downloadUrl = this.getAttribute('data-download-url');
          if (downloadUrl) {
            e.preventDefault();
            const url = window.GHLDirectory.addParameter(downloadUrl, window.GHLDirectory.customField, slug);
            window.location.href = url;
          }
        });
      });
    };
    
    document.addEventListener('DOMContentLoaded', function() {
      const slug = window.GHLDirectory.getSlug();
      if (slug) {
        console.log('Listing slug detected:', slug);
        window.GHLDirectory.addTrackingToForms(slug);
        window.GHLDirectory.setupActionButtons(slug);
        window.GHLDirectory.setupDownloadButtons(slug);
        
        // Store listing info in sessionStorage for other scripts
        sessionStorage.setItem('current_listing_slug', slug);
        sessionStorage.setItem('ghl_field_name', window.GHLDirectory.customField);
      }
    });
  })();
</script>`;

                  const cssCode = `/* GHL Directory Styling */
.product-item {
  box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24);
  transition: all 0.3s cubic-bezier(.25,.8,.25,1);
  border-radius: 4px;
  overflow: hidden;
  position: relative;
}

.product-item:hover {
  box-shadow: 0 14px 28px rgba(0,0,0,0.25), 0 10px 10px rgba(0,0,0,0.22);
  transform: translateY(-2px);
}

.product-item .product-image-container {
  position: relative;
  overflow: hidden;
  padding-bottom: 56.25%; /* 16:9 Aspect Ratio */
  height: 0;
}

.product-item .product-image-container img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.product-item:hover .product-image-container img {
  transform: scale(1.05);
}

.product-item .product-content {
  padding: 16px;
}

.product-item .product-title {
  margin-top: 0;
  margin-bottom: 8px;
  font-size: 18px;
  font-weight: 600;
  line-height: 1.3;
}

.product-item .product-description {
  font-size: 14px;
  color: #555;
  margin-bottom: 12px;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;  
  overflow: hidden;
}

.product-item .product-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: #777;
}

.product-item .product-price {
  font-weight: 700;
  color: #333;
  font-size: 16px;
}

.product-item .product-category {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 3px;
  font-size: 12px;
  font-weight: 500;
  background-color: #f0f0f0;
  color: #555;
}

.product-item a.view-details {
  display: inline-block;
  padding: 8px 16px;
  background-color: ${previewColor};
  color: ${previewTextColor};
  text-decoration: none;
  border-radius: ${previewBorderRadius}px;
  font-weight: 500;
  font-size: 14px;
  margin-top: 12px;
  transition: background-color 0.2s;
}

.product-item a.view-details:hover {
  background-color: ${previewColor === '#4F46E5' ? '#4338ca' : previewColor};
  opacity: 0.9;
}

/* Product gallery grid (2-row limit) */
.product-gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
  max-height: calc(2 * (300px * 0.5625 + 200px)); /* Limit height to 2 rows */
  overflow-y: auto;
}

/* Action buttons */
.ghl-listing-button {
  display: inline-block;
  background-color: ${previewColor};
  color: ${previewTextColor};
  border: none;
  border-radius: ${previewBorderRadius}px;
  padding: 10px 20px;
  font-size: 16px;
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
  transition: background-color 0.3s, transform 0.2s;
}

.ghl-listing-button:hover {
  opacity: 0.9;
  transform: translateY(-2px);
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .product-gallery {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    max-height: none; /* Remove height limit on mobile */
  }
  
  .product-item .product-title {
    font-size: 16px;
  }
}`;

                  const formCode = `<!-- GHL Directory Form Embed -->
<div class="ghl-form-container">
  <div class="ghl-form-wrapper" data-form-type="${selectedOptIn === "embedded-form" ? 'embed' : 'popup'}">
    ${selectedOptIn === "embedded-form" ?
      `<iframe
      id="ghl-form-iframe"
      src=""
      width="100%"
      height="600px"
      frameborder="0"
      allowfullscreen
    ></iframe>
    <script>
      document.addEventListener('DOMContentLoaded', function() {
        const slug = window.GHLDirectory.getSlug();
        const iframe = document.getElementById('ghl-form-iframe');
        let formUrl = '${formEmbedUrl}';
        
        if (slug) {
          formUrl = window.GHLDirectory.addParameter(formUrl, '${customFieldName}', slug);
          formUrl = window.GHLDirectory.addParameter(formUrl, 'utm_source', 'directory');
          iframe.src = formUrl;
        }
      });
    </script>` :
      `<button class="ghl-listing-button" onclick="openGhlForm()">
      ${previewButtonText}
    </button>
    <script>
      function openGhlForm() {
        const slug = window.GHLDirectory.getSlug();
        let formUrl = '${formEmbedUrl}';
        
        if (slug) {
          formUrl = window.GHLDirectory.addParameter(formUrl, '${customFieldName}', slug);
          formUrl = window.GHLDirectory.addParameter(formUrl, 'utm_source', 'directory');
          window.open(formUrl, '_blank');
        }
      }
    </script>`
    }
  </div>
</div>`;

                  const footerCode = `<!-- GHL Directory Footer Script -->
<script>
  // Optional additional tracking code
  (function() {
    // Get the current listing slug from sessionStorage
    const currentSlug = sessionStorage.getItem('current_listing_slug');
    const fieldName = sessionStorage.getItem('ghl_field_name') || '${customFieldName}';
    
    // Track page views
    if (currentSlug && typeof gtag === 'function') {
      gtag('event', 'listing_view', {
        'listing_slug': currentSlug
      });
    }
    
    // Track outbound links
    document.querySelectorAll('a[href^="http"]').forEach(link => {
      link.addEventListener('click', function() {
        if (currentSlug && typeof gtag === 'function') {
          gtag('event', 'outbound_link', {
            'listing_slug': currentSlug,
            'destination': this.href
          });
        }
      });
    });
  })();
</script>`;

                  // Combine all code
                  const allCode = 
`/* ===== GHL DIRECTORY INTEGRATION COMPLETE CODE ===== */

/* ===== 1. HEADER CODE - Add to <head> section ===== */
${headerCode}

/* ===== 2. CSS STYLES - Add to your stylesheet ===== */
${cssCode}

/* ===== 3. FORM EMBED CODE - Add where you want the form ===== */
${formCode}

/* ===== 4. FOOTER CODE - Add before closing </body> tag ===== */
${footerCode}

/* ===== END OF GHL DIRECTORY INTEGRATION CODE ===== */`;

                  // Create a download link
                  const element = document.createElement('a');
                  const file = new Blob([allCode], {type: 'text/plain'});
                  element.href = URL.createObjectURL(file);
                  element.download = 'ghl-directory-integration.txt';
                  document.body.appendChild(element);
                  element.click();
                  document.body.removeChild(element);
                }}
              >
                Download All Code
              </Button>
            </div>
          </div>
        </WizardStep>
        
        {/* Congratulations Slide */}
        <WizardStep 
          title="Setup Complete!" 
          description="Your directory integration is ready to go"
        >
          <div className="space-y-6 py-10 text-center">
            <div className="text-6xl mb-6">🎉</div>
            
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Congratulations!</h2>
            <p className="text-slate-600 max-w-lg mx-auto mb-8">
              You've successfully set up your Go HighLevel directory integration. Your marketplace is now ready to capture and track leads from your listings.
            </p>
            
            <div className="bg-amber-50 border border-amber-100 rounded-lg p-6 max-w-lg mx-auto text-left">
              <h3 className="text-lg font-medium text-amber-800 mb-2">Important Reminder</h3>
              <p className="text-sm text-amber-700 mb-4">
                For proper tracking, all listings must be created with the following attributes:
              </p>
              <ul className="list-disc pl-5 text-sm text-amber-700 space-y-2">
                <li>A unique <strong>slug</strong> in the URL (e.g., /listings/product-name)</li>
                <li>Consistent metadata for proper filtering and categorization</li>
                <li>The tracking field <strong>listing</strong> must be set up in your Go HighLevel forms</li>
              </ul>
            </div>
            
            <div className="mt-10">
              <Button size="lg" className="px-8 py-2 text-base">
                Finish Setup
              </Button>
            </div>
          </div>
        </WizardStep>
      </ConfigWizard>
    </div>
  );
}