import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { parseEmbedCode, ParsedEmbedData } from '@/lib/embed-parser';
import { generateActionButtonPopup } from '@/lib/custom-popup-generator';
import { generateEmbeddedFormCode } from '@/lib/embedded-form-generator';
import { generateExpandedDescriptionCode } from '@/lib/expanded-description-generator';
import { generateMetadataBarCode, MetadataField } from '@/lib/metadata-bar-generator';

interface WizardStepProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

function WizardStep({ title, description, children }: WizardStepProps) {
  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function ConfigWizard({ children }: { children: React.ReactNode }) {
  return <div className="space-y-8 py-8">{children}</div>;
}

export default function ConfigWizardDemo() {
  // Form configuration state
  const [buttonType, setButtonType] = useState<string>('embed');
  const [formEmbedUrl, setFormEmbedUrl] = useState<string>('<iframe src="https://link.msgsndr.com/form/abc123" width="500" height="600"></iframe>');
  const [customFieldName, setCustomFieldName] = useState<string>('listing');
  const [previewColor, setPreviewColor] = useState<string>('#3b82f6');
  const [previewTextColor, setPreviewTextColor] = useState<string>('#ffffff');
  const [previewBorderRadius, setPreviewBorderRadius] = useState<number>(8);
  
  // Copy button states
  const [cssCodeCopied, setCssCodeCopied] = useState<boolean>(false);
  const [headerCodeCopied, setHeaderCodeCopied] = useState<boolean>(false);
  const [footerCodeCopied, setFooterCodeCopied] = useState<boolean>(false);

  // Component toggles
  const [showPrice, setShowPrice] = useState<boolean>(true);
  const [showDescription, setShowDescription] = useState<boolean>(false);
  const [showMetadata, setShowMetadata] = useState<boolean>(false);
  const [showMaps, setShowMaps] = useState<boolean>(false);
  
  // Expanded description configuration
  const [expandedDescriptionContent, setExpandedDescriptionContent] = useState(`<h2>Product Details</h2>
<p>This is the default content that will appear on all listings unless you specify custom content for specific URLs.</p>
<p><strong>To add custom content for specific listings:</strong></p>
<ol>
  <li>Edit the expandedDescriptions object in the generated code</li>
  <li>Add entries like: <code>'your-listing-slug': '&lt;h2&gt;Custom Content&lt;/h2&gt;&lt;p&gt;Specific details...&lt;/p&gt;'</code></li>
  <li>The system will automatically show the right content based on the URL</li>
</ol>
<p>This expanded description appears below the main product details and provides additional space for comprehensive information that helps customers make informed decisions.</p>`);
  const [expandedDescFadeIn, setExpandedDescFadeIn] = useState(true);
  const [expandedDescClass, setExpandedDescClass] = useState('expanded-description');
  
  // Metadata bar configuration
  const [metadataPosition, setMetadataPosition] = useState<'top' | 'bottom'>('bottom');
  const [metadataBackgroundColor, setMetadataBackgroundColor] = useState('#f8fafc');
  const [metadataTextColor, setMetadataTextColor] = useState('#374151');
  const [metadataBorderRadius, setMetadataBorderRadius] = useState(8);
  const [metadataClass, setMetadataClass] = useState('listing-metadata-bar');
  const [metadataFields, setMetadataFields] = useState<MetadataField[]>([
    {
      id: 'phone',
      label: 'Phone',
      icon: '<path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>',
      defaultValue: '(555) 123-4567'
    },
    {
      id: 'hours',
      label: 'Hours',
      icon: '<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>',
      defaultValue: 'Mon-Fri 9AM-6PM'
    },
    {
      id: 'location',
      label: 'Address',
      icon: '<path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>',
      defaultValue: '123 Main St, City, State'
    },
    {
      id: 'website',
      label: 'Website',
      icon: '<path fillRule="evenodd" d="M4.083 9h1.946c.089-1.546.383-2.97.837-4.118A6.004 6.004 0 004.083 9zM10 2a8 8 0 100 16 8 8 0 000-16zm0 2c-.076 0-.232.032-.465.262-.238.234-.497.623-.737 1.182-.389.907-.673 2.142-.766 3.556h3.936c-.093-1.414-.377-2.649-.766-3.556-.24-.56-.5-.948-.737-1.182C10.232 4.032 10.076 4 10 4zm3.971 5c-.089-1.546-.383-2.97-.837-4.118A6.004 6.004 0 0115.917 9h-1.946zm-2.003 2H8.032c.093 1.414.377 2.649.766 3.556.24.56.5.948.737 1.182.233.23.389.262.465.262.076 0 .232-.032.465-.262.238-.234.498-.623.737-1.182.389-.907.673-2.142.766-3.556zm1.166 4.118c.454-1.147.748-2.572.837-4.118h1.946a6.004 6.004 0 01-2.783 4.118zm-6.268 0C6.412 13.97 6.118 12.546 6.03 11H4.083a6.004 6.004 0 002.783 4.118z" clipRule="evenodd"/>',
      defaultValue: 'https://example.com'
    }
  ]);
  
  // Button hiding options
  const [showBuyNowButton, setShowBuyNowButton] = useState<boolean>(true);
  const [showAddToCartButton, setShowAddToCartButton] = useState<boolean>(true);
  const [showQuantitySelector, setShowQuantitySelector] = useState<boolean>(true);

  // Parse embed code for popup dimensions
  const parsedEmbedData = useMemo(() => {
    if (buttonType === 'popup' && formEmbedUrl) {
      return parseEmbedCode(formEmbedUrl);
    }
    return null;
  }, [buttonType, formEmbedUrl]);

  // Generate custom action button popup code
  const generateFullPopupCode = () => {
    if (buttonType === 'popup' && formEmbedUrl) {
      const result = generateActionButtonPopup({
        buttonText: 'Get More Info',
        buttonColor: previewColor,
        buttonTextColor: previewTextColor,
        buttonBorderRadius: previewBorderRadius,
        customFieldName: customFieldName || 'listing',
        formUrl: formEmbedUrl,
        showBuyNowButton,
        showAddToCartButton,
        showQuantitySelector
      });
      
      if (result.isValid) {
        return {
          headerCode: result.headerCode,
          footerCode: result.footerCode
        };
      }
    }
    return { headerCode: '', footerCode: '' };
  };

  // Extract form URL from iframe embed code if needed
  const extractFormUrl = (embedCode: string) => {
    if (!embedCode) return '';
    
    // If it's already a clean URL/ID, return as is
    if (!embedCode.includes('<iframe')) {
      return embedCode;
    }
    
    // Extract src from iframe
    const srcMatch = embedCode.match(/src=["']([^"']+)["']/);
    if (srcMatch) {
      const fullUrl = srcMatch[1];
      // Extract form ID from URL (last part of path)
      const urlParts = fullUrl.split('/');
      return urlParts[urlParts.length - 1] || fullUrl;
    }
    
    return embedCode;
  };

  // Generate code based on selection - always show embedded form code when form URL is provided
  const generateCodeForSelection = () => {
    if (formEmbedUrl && formEmbedUrl.trim()) {
      if (buttonType === 'popup') {
        // Generate popup template with 100px spacing
        const popupCode = generateFullPopupCode();
        
        // Generate expanded description code if enabled
        const expandedDescCode = generateExpandedDescriptionCode({
          enabled: showDescription,
          content: expandedDescriptionContent,
          fadeInAnimation: expandedDescFadeIn,
          customClass: expandedDescClass
        });

        // Generate metadata bar code if enabled
        const metadataCode = generateMetadataBarCode({
          enabled: showMetadata,
          position: metadataPosition,
          fields: metadataFields,
          customClass: metadataClass,
          backgroundColor: metadataBackgroundColor,
          textColor: metadataTextColor,
          borderRadius: metadataBorderRadius
        });

        return {
          headerCode: (popupCode.headerCode || '/* Paste GoHighLevel iframe embed code to generate popup CSS */') + 
                     (expandedDescCode.cssCode ? '\n\n' + expandedDescCode.cssCode : '') +
                     (metadataCode.cssCode ? '\n\n' + metadataCode.cssCode : ''),
          footerCode: (popupCode.footerCode || '/* Paste GoHighLevel iframe embed code to generate popup JavaScript */') + 
                     (expandedDescCode.jsCode ? '\n\n' + expandedDescCode.jsCode : '') +
                     (metadataCode.jsCode ? '\n\n' + metadataCode.jsCode : '')
        };
      } else {
        // Extract clean form URL/ID from iframe if needed
        const cleanFormUrl = extractFormUrl(formEmbedUrl);
        
        // Generate embedded form template (default when form URL is provided)
        const embeddedFormCode = generateEmbeddedFormCode({
          formUrl: cleanFormUrl,
          animationType: "fade-squeeze",
          borderRadius: previewBorderRadius,
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
          customFieldName: customFieldName || 'listing',
          metadataFields: []
        });

        // Generate expanded description code if enabled
        const expandedDescCode = generateExpandedDescriptionCode({
          enabled: showDescription,
          content: expandedDescriptionContent,
          fadeInAnimation: expandedDescFadeIn,
          customClass: expandedDescClass
        });

        // Generate metadata bar code if enabled
        const metadataCode = generateMetadataBarCode({
          enabled: showMetadata,
          position: metadataPosition,
          fields: metadataFields,
          customClass: metadataClass,
          backgroundColor: metadataBackgroundColor,
          textColor: metadataTextColor,
          borderRadius: metadataBorderRadius
        });

        return {
          headerCode: embeddedFormCode.cssCode + 
                     (expandedDescCode.cssCode ? '\n\n' + expandedDescCode.cssCode : '') +
                     (metadataCode.cssCode ? '\n\n' + metadataCode.cssCode : ''),
          footerCode: embeddedFormCode.jsCode + 
                     (expandedDescCode.jsCode ? '\n\n' + expandedDescCode.jsCode : '') +
                     (metadataCode.jsCode ? '\n\n' + metadataCode.jsCode : '')
        };
      }
    } else {
      // Generate directory listing template when no form URL is provided
      // Generate expanded description code if enabled
      const expandedDescCode = generateExpandedDescriptionCode({
        enabled: showDescription,
        content: expandedDescriptionContent,
        fadeInAnimation: expandedDescFadeIn,
        customClass: expandedDescClass
      });

      // Generate metadata bar code if enabled
      const metadataCode = generateMetadataBarCode({
        enabled: showMetadata,
        position: metadataPosition,
        fields: metadataFields,
        customClass: metadataClass,
        backgroundColor: metadataBackgroundColor,
        textColor: metadataTextColor,
        borderRadius: metadataBorderRadius
      });

      return {
        headerCode: `/* Directory Listing CSS */
.ghl-listing-button {
  background-color: ${previewColor};
  color: ${previewTextColor};
  border-radius: ${previewBorderRadius}px;
  padding: 0.5rem 1rem;
  transition: all 0.2s ease;
}` + (expandedDescCode.cssCode ? '\n\n' + expandedDescCode.cssCode : '') +
    (metadataCode.cssCode ? '\n\n' + metadataCode.cssCode : ''),
        footerCode: `<script>
// Directory Integration Script
document.addEventListener('DOMContentLoaded', function() {
  const forms = document.querySelectorAll('form');
  forms.forEach(form => {
    const hiddenField = document.createElement('input');
    hiddenField.type = 'hidden';
    hiddenField.name = '${customFieldName || 'listing'}';
    hiddenField.value = window.location.pathname.split('/').pop();
    form.appendChild(hiddenField);
  });
});
</script>` + (expandedDescCode.jsCode ? '\n\n' + expandedDescCode.jsCode : '') +
         (metadataCode.jsCode ? '\n\n' + metadataCode.jsCode : '')
      };
    }
  };

  const generatedCode = useMemo(() => generateCodeForSelection(), [
    formEmbedUrl, 
    buttonType, 
    customFieldName, 
    previewBorderRadius, 
    previewColor, 
    previewTextColor,
    showPrice,
    showBuyNowButton,
    showAddToCartButton,
    showQuantitySelector,
    showDescription,
    expandedDescriptionContent,
    expandedDescFadeIn,
    expandedDescClass,
    showMetadata,
    metadataPosition,
    metadataBackgroundColor,
    metadataTextColor,
    metadataBorderRadius,
    metadataClass,
    metadataFields
  ]);

  // Helper function for copying text with visual feedback
  const copyToClipboard = async (text: string, setCopiedState: (value: boolean) => void) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedState(true);
      setTimeout(() => setCopiedState(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      // Fallback method
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedState(true);
      setTimeout(() => setCopiedState(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <ConfigWizard>
        {/* Step 1: Form Integration Method */}
        <WizardStep 
          title="Choose Integration Method" 
          description="Select how you want to integrate GoHighLevel forms"
        >
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div 
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                  buttonType === 'popup' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
                onClick={() => setButtonType('popup')}
              >
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-500 text-white p-2 rounded-md">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <path d="M21 15l-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium">Action Button (Popup)</h3>
                    <p className="text-sm text-slate-500">Opens form in a popup overlay</p>
                  </div>
                </div>
              </div>

              <div 
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                  buttonType === 'redirect' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
                onClick={() => setButtonType('redirect')}
              >
                <div className="flex items-center space-x-3">
                  <div className="bg-green-500 text-white p-2 rounded-md">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                      <polyline points="15,3 21,3 21,9"/>
                      <line x1="10" x2="21" y1="14" y2="3"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium">Action Button (Redirect)</h3>
                    <p className="text-sm text-slate-500">Redirects to external form page</p>
                  </div>
                </div>
              </div>

              <div 
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                  buttonType === 'embed' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
                onClick={() => setButtonType('embed')}
              >
                <div className="flex items-center space-x-3">
                  <div className="bg-purple-500 text-white p-2 rounded-md">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="16,18 22,12 16,6"/>
                      <polyline points="8,6 2,12 8,18"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium">Embedded Form</h3>
                    <p className="text-sm text-slate-500">Displays form directly on page</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Embed Code Input */}
            <div className="space-y-2">
              <Label htmlFor="form-embed">
                {buttonType === 'popup' ? 'GoHighLevel Iframe Embed Code' : 'Form URL'}
              </Label>
              <Textarea
                id="form-embed"
                placeholder={buttonType === 'popup' 
                  ? '<iframe src="https://link.msgsndr.com/form/..." width="500" height="600"></iframe>'
                  : 'Paste your GoHighLevel form embed code here...'
                }
                value={formEmbedUrl}
                onChange={(e) => setFormEmbedUrl(e.target.value)}
                className="min-h-[100px]"
              />
              {buttonType === 'popup' && parsedEmbedData && (
                <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
                  ✓ Form detected: {parsedEmbedData.width}×{parsedEmbedData.height}px 
                  → Popup will be {parsedEmbedData.width + 100}×{parsedEmbedData.height + 100}px (+100px spacing)
                </div>
              )}
            </div>

            {/* Custom Field Name */}
            <div className="space-y-2">
              <Label htmlFor="field-name">Custom Field Name</Label>
              <Input
                id="field-name"
                placeholder="listing"
                value={customFieldName}
                onChange={(e) => setCustomFieldName(e.target.value)}
              />
              <p className="text-sm text-slate-500">
                The hidden field name that will store the directory listing identifier
              </p>
            </div>
          </div>
        </WizardStep>

        {/* Step 2: Button Styling */}
        <WizardStep 
          title="Button Styling" 
          description="Customize the appearance of your action button"
        >
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="button-color">Button Color</Label>
                <div className="flex space-x-2">
                  <Input
                    id="button-color"
                    type="color"
                    value={previewColor}
                    onChange={(e) => setPreviewColor(e.target.value)}
                    className="w-12 h-10 p-1 border"
                  />
                  <Input
                    value={previewColor}
                    onChange={(e) => setPreviewColor(e.target.value)}
                    placeholder="#3b82f6"
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="text-color">Text Color</Label>
                <div className="flex space-x-2">
                  <Input
                    id="text-color"
                    type="color"
                    value={previewTextColor}
                    onChange={(e) => setPreviewTextColor(e.target.value)}
                    className="w-12 h-10 p-1 border"
                  />
                  <Input
                    value={previewTextColor}
                    onChange={(e) => setPreviewTextColor(e.target.value)}
                    placeholder="#ffffff"
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="border-radius">Border Radius</Label>
                <Input
                  id="border-radius"
                  type="number"
                  min="0"
                  max="50"
                  value={previewBorderRadius}
                  onChange={(e) => setPreviewBorderRadius(Number(e.target.value))}
                />
              </div>
            </div>

            {/* Button Preview */}
            <div className="border border-slate-200 rounded-lg p-6 bg-white">
              <h3 className="text-sm font-medium mb-4">Button Preview</h3>
              <button
                style={{
                  backgroundColor: previewColor,
                  color: previewTextColor,
                  borderRadius: `${previewBorderRadius}px`,
                  padding: '0.75rem 1.5rem',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Get More Info
              </button>
            </div>
          </div>
        </WizardStep>

        {/* Step 3: Components Configuration */}
        <WizardStep 
          title="Directory Components" 
          description="Choose which components to display on your listings"
        >
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <div className="border border-slate-200 rounded-lg p-4 bg-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-indigo-50 p-2 rounded-md">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600">
                        <line x1="21" x2="3" y1="6" y2="6" />
                        <line x1="15" x2="3" y1="12" y2="12" />
                        <line x1="17" x2="3" y1="18" y2="18" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">Expanded Description</h3>
                      <p className="text-xs text-slate-500">Rich content with images and HTML</p>
                    </div>
                  </div>
                  <Switch 
                    checked={showDescription}
                    onCheckedChange={setShowDescription}
                    id="show-description" 
                  />
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg p-4 bg-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-green-50 p-2 rounded-md">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
                        <rect width="7" height="9" x="3" y="3" rx="1" />
                        <rect width="7" height="5" x="14" y="3" rx="1" />
                        <rect width="7" height="9" x="14" y="12" rx="1" />
                        <rect width="7" height="5" x="3" y="16" rx="1" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">Metadata Bar</h3>
                      <p className="text-xs text-slate-500">Additional business information</p>
                    </div>
                  </div>
                  <Switch 
                    checked={showMetadata}
                    onCheckedChange={setShowMetadata}
                    id="show-metadata" 
                  />
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg p-4 bg-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-orange-50 p-2 rounded-md">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-600">
                        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">Google Maps Widget</h3>
                      <p className="text-xs text-slate-500">Interactive location display</p>
                    </div>
                  </div>
                  <Switch 
                    checked={showMaps}
                    onCheckedChange={setShowMaps}
                    id="show-maps" 
                  />
                </div>
              </div>
            </div>

            {/* Expanded Description Configuration */}
            {showDescription && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium mb-4">Expanded Description Settings</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="expanded-content">Default Rich Text Content</Label>
                    <textarea
                      id="expanded-content"
                      className="w-full h-32 p-3 border border-slate-200 rounded-lg resize-vertical"
                      placeholder="Enter default HTML content for expanded description..."
                      value={expandedDescriptionContent}
                      onChange={(e) => setExpandedDescriptionContent(e.target.value)}
                    />
                    <p className="text-sm text-slate-500">
                      This default content appears on all listings. You can customize content for specific listings by editing the generated code.
                    </p>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-blue-800 mb-2">URL-Based Content System</h4>
                    <p className="text-sm text-blue-700 mb-2">
                      The system automatically detects the listing URL and shows the appropriate content:
                    </p>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Default content (above) shows on all listings</li>
                      <li>• Edit the <code>expandedDescriptions</code> object in the generated code</li>
                      <li>• Add custom content for specific listing slugs</li>
                      <li>• Works with both URL parameters and path-based routing</li>
                    </ul>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="expanded-class">CSS Class Name</Label>
                      <Input
                        id="expanded-class"
                        placeholder="expanded-description"
                        value={expandedDescClass}
                        onChange={(e) => setExpandedDescClass(e.target.value)}
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch 
                        checked={expandedDescFadeIn}
                        onCheckedChange={setExpandedDescFadeIn}
                        id="fade-in-toggle" 
                      />
                      <Label htmlFor="fade-in-toggle">Fade-in Animation</Label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Metadata Bar Configuration */}
            {showMetadata && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium mb-4">Metadata Bar Settings</h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="metadata-position">Position</Label>
                      <Select value={metadataPosition} onValueChange={(value: 'top' | 'bottom') => setMetadataPosition(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="top">Above Product Details</SelectItem>
                          <SelectItem value="bottom">Below Product Details</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="metadata-class">CSS Class Name</Label>
                      <Input
                        id="metadata-class"
                        placeholder="listing-metadata-bar"
                        value={metadataClass}
                        onChange={(e) => setMetadataClass(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="metadata-bg-color">Background Color</Label>
                      <div className="flex space-x-2">
                        <Input
                          id="metadata-bg-color"
                          type="color"
                          value={metadataBackgroundColor}
                          onChange={(e) => setMetadataBackgroundColor(e.target.value)}
                          className="w-12 h-10 p-1 border"
                        />
                        <Input
                          value={metadataBackgroundColor}
                          onChange={(e) => setMetadataBackgroundColor(e.target.value)}
                          placeholder="#f8fafc"
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="metadata-text-color">Text Color</Label>
                      <div className="flex space-x-2">
                        <Input
                          id="metadata-text-color"
                          type="color"
                          value={metadataTextColor}
                          onChange={(e) => setMetadataTextColor(e.target.value)}
                          className="w-12 h-10 p-1 border"
                        />
                        <Input
                          value={metadataTextColor}
                          onChange={(e) => setMetadataTextColor(e.target.value)}
                          placeholder="#374151"
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="metadata-border-radius">Border Radius</Label>
                      <Input
                        id="metadata-border-radius"
                        type="number"
                        min="0"
                        max="50"
                        value={metadataBorderRadius}
                        onChange={(e) => setMetadataBorderRadius(Number(e.target.value))}
                      />
                    </div>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-green-800 mb-2">URL-Based Business Information</h4>
                    <p className="text-sm text-green-700 mb-2">
                      The metadata bar shows business information that changes per listing:
                    </p>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>• Default values (below) show on all listings</li>
                      <li>• Edit the <code>metadataContent</code> object in the generated code</li>
                      <li>• Add custom business info for specific listing slugs</li>
                      <li>• Perfect for phone numbers, hours, addresses, websites</li>
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <Label>Default Business Information Fields</Label>
                    {metadataFields.map((field, index) => (
                      <div key={field.id} className="grid grid-cols-1 md:grid-cols-3 gap-2 p-3 border border-slate-200 rounded-lg bg-white">
                        <div className="space-y-1">
                          <Label className="text-xs text-slate-500">Field Label</Label>
                          <Input
                            placeholder="Label"
                            value={field.label}
                            onChange={(e) => {
                              const newFields = [...metadataFields];
                              newFields[index].label = e.target.value;
                              setMetadataFields(newFields);
                            }}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-slate-500">Default Value</Label>
                          <Input
                            placeholder="Default value"
                            value={field.defaultValue}
                            onChange={(e) => {
                              const newFields = [...metadataFields];
                              newFields[index].defaultValue = e.target.value;
                              setMetadataFields(newFields);
                            }}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-slate-500">Field ID</Label>
                          <Input
                            placeholder="field_id"
                            value={field.id}
                            onChange={(e) => {
                              const newFields = [...metadataFields];
                              newFields[index].id = e.target.value;
                              setMetadataFields(newFields);
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* GoHighLevel Button Hiding Options */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium mb-4">GoHighLevel Page Options</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border border-slate-200 rounded-lg p-4 bg-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="bg-blue-50 p-2 rounded-md">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                          <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium">Show Listing Price</h3>
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

                <div className="border border-slate-200 rounded-lg p-4 bg-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="bg-red-50 p-2 rounded-md">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-600">
                          <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
                          <rect width="4" height="12" x="2" y="9"/>
                          <circle cx="4" cy="4" r="2"/>
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium">Show Buy Now Button</h3>
                        <p className="text-xs text-slate-500">Display GoHighLevel's buy now button</p>
                      </div>
                    </div>
                    <Switch 
                      checked={showBuyNowButton}
                      onCheckedChange={setShowBuyNowButton}
                      id="show-buy-now" 
                    />
                  </div>
                </div>

                <div className="border border-slate-200 rounded-lg p-4 bg-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="bg-yellow-50 p-2 rounded-md">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-600">
                          <circle cx="8" cy="21" r="1"/>
                          <circle cx="19" cy="21" r="1"/>
                          <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57L22 7H6"/>
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium">Show Add to Cart Button</h3>
                        <p className="text-xs text-slate-500">Display GoHighLevel's add to cart button</p>
                      </div>
                    </div>
                    <Switch 
                      checked={showAddToCartButton}
                      onCheckedChange={setShowAddToCartButton}
                      id="show-add-cart" 
                    />
                  </div>
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg p-4 bg-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-purple-50 p-2 rounded-md">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-600">
                        <path d="M9 12l2 2 4-4"/>
                        <path d="M21 12c.552 0 1-.448 1-1V5c0-.552-.448-1-1-1H3c-.552 0-1 .448-1 1v6c0 .552.448 1 1 1h18z"/>
                        <path d="M3 13v6c0 .552.448 1 1 1h16c.552 0 1-.448 1-1v-6"/>
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">Show Quantity Selector</h3>
                      <p className="text-xs text-slate-500">Display quantity input and controls</p>
                    </div>
                  </div>
                  <Switch 
                    checked={showQuantitySelector}
                    onCheckedChange={setShowQuantitySelector}
                    id="show-quantity" 
                  />
                </div>
              </div>
            </div>

            {/* CSS Preview Field */}
            <div className="border-t pt-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        const cssCode = `<style>
/* GoHighLevel Essential Fixes - Always Applied */

/* Nuclear truncation fix - Apply first to prevent any truncation */
body:not(.hl-builder) * { 
  text-overflow: unset !important; 
  -webkit-line-clamp: unset !important; 
  white-space: normal !important;
  overflow: visible !important;
}

/* Remove title truncation */
body:not(.hl-builder) [class*="product-title"],
body:not(.hl-builder) [class*="product-name"],
body:not(.hl-builder) .hl-product-detail-product-name {
  white-space: normal !important;
  overflow: visible !important;
  text-overflow: unset !important;
  -webkit-line-clamp: unset !important;
  max-height: none !important;
  height: auto !important;
}

/* Remove product description truncation */
body:not(.hl-builder) [class*="product-description"],
body:not(.hl-builder) #description,
body:not(.hl-builder) .product-description {
  white-space: normal !important;
  overflow: visible !important;
  text-overflow: unset !important;
  -webkit-line-clamp: unset !important;
  max-height: none !important;
  height: auto !important;
}

/* Remove show more buttons */
body:not(.hl-builder) .show-more-btn,
body:not(.hl-builder) .read-more,
body:not(.hl-builder) [class*="show-more"],
body:not(.hl-builder) [class*="read-more"],
body:not(.hl-builder) .show-more {
  display: none !important;
}

/* Remove independent scrolling from description and gallery */
body:not(.hl-builder) .product-image-container,
body:not(.hl-builder) .hl-product-image-container,
body:not(.hl-builder) .product-description-container {
  overflow: visible !important;
  max-height: none !important;
  height: auto !important;
}

/* Scrolling fix - public pages only */
body:not(.hl-builder) .fullSection, 
body:not(.hl-builder) .c-section, 
body:not(.hl-builder) .c-wrapper, 
body:not(.hl-builder) .inner, 
body:not(.hl-builder) .vertical,
body:not(.hl-builder) [class*="fullSection"], 
body:not(.hl-builder) [class*="c-section"], 
body:not(.hl-builder) [class*="c-wrapper"],
body:not(.hl-builder) [class*="section-"], 
body:not(.hl-builder) [class*="row-"], 
body:not(.hl-builder) [class*="col-"],
body:not(.hl-builder) [class*="inner"] {
  overflow: visible !important;
  overflow-x: visible !important;
  overflow-y: visible !important;
  max-height: none !important;
  height: auto !important;
}

body:not(.hl-builder) { 
  overflow-x: hidden !important; 
  overflow-y: auto !important; 
}${!showBuyNowButton ? `

/* Hide Buy Now Button */
body:not(.hl-builder) .cstore-product-detail button,
body:not(.hl-builder) .hl-product-buy-button,
body:not(.hl-builder) [class*="buy-now"],
body:not(.hl-builder) #buy-now-btn,
body:not(.hl-builder) .secondary-btn {
  display: none !important;
  visibility: hidden !important;
  opacity: 0 !important;
}` : ''}${!showAddToCartButton ? `

/* Hide Add to Cart Button */
body:not(.hl-builder) .hl-product-cart-button,
body:not(.hl-builder) [class*="add-cart"],
body:not(.hl-builder) #add-to-cart-btn,
body:not(.hl-builder) .primary-btn {
  display: none !important;
  visibility: hidden !important;
  opacity: 0 !important;
}` : ''}${!showPrice ? `

/* Hide Price */
body:not(.hl-builder) .cstore-product-detail [class*="price"],
body:not(.hl-builder) .product-detail-container [class*="price"],
body:not(.hl-builder) .hl-product-price,
body:not(.hl-builder) .hl-product-detail-product-price,
body:not(.hl-builder) p.hl-product-detail-product-price {
  display: none !important;
  visibility: hidden !important;
  opacity: 0 !important;
}` : ''}${!showQuantitySelector ? `

/* Hide Quantity Selector */
body:not(.hl-builder) .hl-product-detail-selectors,
body:not(.hl-builder) .cstore-product-detail [class*="quantity"], 
body:not(.hl-builder) .product-detail-container [class*="qty"],
body:not(.hl-builder) .cstore-product-detail input[type="number"],
body:not(.hl-builder) input[class*="quantity"],
body:not(.hl-builder) input[class*="qty"],
body:not(.hl-builder) .quantity-container,
body:not(.hl-builder) .hl-quantity-input-container,
body:not(.hl-builder) .pdp-quantity-container,
body:not(.hl-builder) .hl-quantity-input,
body:not(.hl-builder) .action-icon {
  display: none !important;
  visibility: hidden !important;
  opacity: 0 !important;
}` : ''}
</style>`;
                        copyToClipboard(cssCode, setCssCodeCopied);
                    }}
                  >
                    Copy CSS
                  </Button>
                  <Label>GoHighLevel CSS (Copy this to your page's head section)</Label>
                </div>
                {cssCodeCopied && (
                  <span className="text-green-600 font-medium text-sm">Copied</span>
                )}
              </div>
              <div className="bg-slate-900 text-slate-100 p-4 rounded-lg">
                  <pre className="text-sm whitespace-pre-wrap break-words overflow-wrap-anywhere">
{`<style>
/* GoHighLevel Essential Fixes - Always Applied */

/* Nuclear truncation fix - Apply first to prevent any truncation */
body:not(.hl-builder) * { 
  text-overflow: unset !important; 
  -webkit-line-clamp: unset !important; 
  white-space: normal !important;
  overflow: visible !important;
}

/* Remove title truncation */
body:not(.hl-builder) [class*="product-title"],
body:not(.hl-builder) [class*="product-name"],
body:not(.hl-builder) .hl-product-detail-product-name {
  white-space: normal !important;
  overflow: visible !important;
  text-overflow: unset !important;
  -webkit-line-clamp: unset !important;
  max-height: none !important;
  height: auto !important;
}

/* Remove product description truncation */
body:not(.hl-builder) [class*="product-description"],
body:not(.hl-builder) #description,
body:not(.hl-builder) .product-description {
  white-space: normal !important;
  overflow: visible !important;
  text-overflow: unset !important;
  -webkit-line-clamp: unset !important;
  max-height: none !important;
  height: auto !important;
}

/* Remove show more buttons */
body:not(.hl-builder) .show-more-btn,
body:not(.hl-builder) .read-more,
body:not(.hl-builder) [class*="show-more"],
body:not(.hl-builder) [class*="read-more"],
body:not(.hl-builder) .show-more {
  display: none !important;
}

/* Remove independent scrolling from description and gallery */
body:not(.hl-builder) .product-image-container,
body:not(.hl-builder) .hl-product-image-container,
body:not(.hl-builder) .product-description-container {
  overflow: visible !important;
  max-height: none !important;
  height: auto !important;
}

/* Scrolling fix - public pages only */
body:not(.hl-builder) .fullSection, 
body:not(.hl-builder) .c-section, 
body:not(.hl-builder) .c-wrapper, 
body:not(.hl-builder) .inner, 
body:not(.hl-builder) .vertical,
body:not(.hl-builder) [class*="fullSection"], 
body:not(.hl-builder) [class*="c-section"], 
body:not(.hl-builder) [class*="c-wrapper"],
body:not(.hl-builder) [class*="section-"], 
body:not(.hl-builder) [class*="row-"], 
body:not(.hl-builder) [class*="col-"],
body:not(.hl-builder) [class*="inner"] {
  overflow: visible !important;
  overflow-x: visible !important;
  overflow-y: visible !important;
  max-height: none !important;
  height: auto !important;
}

body:not(.hl-builder) { 
  overflow-x: hidden !important; 
  overflow-y: auto !important; 
}${!showBuyNowButton ? `

/* Hide Buy Now Button */
body:not(.hl-builder) .cstore-product-detail button,
body:not(.hl-builder) .hl-product-buy-button,
body:not(.hl-builder) [class*="buy-now"],
body:not(.hl-builder) #buy-now-btn,
body:not(.hl-builder) .secondary-btn {
  display: none !important;
  visibility: hidden !important;
  opacity: 0 !important;
}` : ''}${!showAddToCartButton ? `

/* Hide Add to Cart Button */
body:not(.hl-builder) .hl-product-cart-button,
body:not(.hl-builder) [class*="add-cart"],
body:not(.hl-builder) #add-to-cart-btn,
body:not(.hl-builder) .primary-btn {
  display: none !important;
  visibility: hidden !important;
  opacity: 0 !important;
}` : ''}${!showPrice ? `

/* Hide Price */
body:not(.hl-builder) .cstore-product-detail [class*="price"],
body:not(.hl-builder) .product-detail-container [class*="price"],
body:not(.hl-builder) .hl-product-price,
body:not(.hl-builder) .hl-product-detail-product-price,
body:not(.hl-builder) p.hl-product-detail-product-price {
  display: none !important;
  visibility: hidden !important;
  opacity: 0 !important;
}` : ''}${!showQuantitySelector ? `

/* Hide Quantity Selector */
body:not(.hl-builder) .hl-product-detail-selectors,
body:not(.hl-builder) .cstore-product-detail [class*="quantity"], 
body:not(.hl-builder) .product-detail-container [class*="qty"],
body:not(.hl-builder) .cstore-product-detail input[type="number"],
body:not(.hl-builder) input[class*="quantity"],
body:not(.hl-builder) input[class*="qty"],
body:not(.hl-builder) .quantity-container,
body:not(.hl-builder) .hl-quantity-input-container,
body:not(.hl-builder) .pdp-quantity-container,
body:not(.hl-builder) .hl-quantity-input,
body:not(.hl-builder) .action-icon {
  display: none !important;
  visibility: hidden !important;
  opacity: 0 !important;
}` : ''}
</style>`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </WizardStep>

        {/* Step 4: Code Preview */}
        <WizardStep 
          title="Generated Code Preview" 
          description="Review and copy the generated integration code"
        >
          <div className="space-y-6">
            {/* Header Code */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Header Code (Add to &lt;head&gt; section)</Label>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => copyToClipboard(generatedCode.headerCode, setHeaderCodeCopied)}
                  className={headerCodeCopied ? "bg-green-100 border-green-300 text-green-700" : ""}
                >
                  {headerCodeCopied ? (
                    <>
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Copied!
                    </>
                  ) : (
                    "Copy"
                  )}
                </Button>
              </div>
              <div className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto">
                <pre className="text-sm whitespace-pre-wrap">{generatedCode.headerCode}</pre>
              </div>
            </div>

            {/* Footer Code */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Footer Code (Add before &lt;/body&gt; tag)</Label>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => copyToClipboard(generatedCode.footerCode, setFooterCodeCopied)}
                  className={footerCodeCopied ? "bg-green-100 border-green-300 text-green-700" : ""}
                >
                  {footerCodeCopied ? (
                    <>
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Copied!
                    </>
                  ) : (
                    "Copy"
                  )}
                </Button>
              </div>
              <div className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto">
                <pre className="text-sm whitespace-pre-wrap">{generatedCode.footerCode}</pre>
              </div>
            </div>
          </div>
        </WizardStep>

        {/* Download Full Integration */}
        <WizardStep 
          title="Download Full Integration" 
          description="Complete code package for your website"
        >
          <div className="space-y-6 py-8">
            <h2 className="text-lg font-bold text-center mb-4">Complete Integration Code</h2>
            <p className="text-sm text-slate-600 text-center mb-6">
              Download the complete integration package for your website.
            </p>
            
            <div className="text-center">
              <Button 
                size="lg" 
                className="px-8 py-2 text-base"
                onClick={() => {
                  const allCode = `/* ===== HEADER CODE - Add to <head> section ===== */
${generatedCode.headerCode}

/* ===== FOOTER CODE - Add before </body> tag ===== */
${generatedCode.footerCode}`;

                  const element = document.createElement('a');
                  const file = new Blob([allCode], { type: 'text/plain' });
                  element.href = URL.createObjectURL(file);
                  element.download = 'ghl-integration-code.txt';
                  document.body.appendChild(element);
                  element.click();
                  document.body.removeChild(element);
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7,10 12,15 17,10"/>
                  <line x1="12" x2="12" y1="15" y2="3"/>
                </svg>
                Download Complete Code
              </Button>
            </div>
          </div>
        </WizardStep>
      </ConfigWizard>
    </div>
  );
}