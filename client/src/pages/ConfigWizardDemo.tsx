import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { parseEmbedCode, ParsedEmbedData } from '@/lib/embed-parser';
import { generateEnhancedPopupCode } from '@/lib/enhanced-popup-generator';

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
  const [buttonType, setButtonType] = useState<string>('popup');
  const [formEmbedUrl, setFormEmbedUrl] = useState<string>('');
  const [customFieldName, setCustomFieldName] = useState<string>('listing');
  const [previewColor, setPreviewColor] = useState<string>('#3b82f6');
  const [previewTextColor, setPreviewTextColor] = useState<string>('#ffffff');
  const [previewBorderRadius, setPreviewBorderRadius] = useState<number>(8);

  // Component toggles
  const [showPrice, setShowPrice] = useState<boolean>(false);
  const [showDescription, setShowDescription] = useState<boolean>(false);
  const [showMetadata, setShowMetadata] = useState<boolean>(false);
  const [showMaps, setShowMaps] = useState<boolean>(false);

  // Parse embed code for popup dimensions
  const parsedEmbedData = useMemo(() => {
    if (buttonType === 'popup' && formEmbedUrl) {
      return parseEmbedCode(formEmbedUrl);
    }
    return null;
  }, [buttonType, formEmbedUrl]);

  // Generate popup code with 100px additional spacing
  const generateFullPopupCode = () => {
    if (buttonType === 'popup' && parsedEmbedData) {
      const popupWidth = parsedEmbedData.width + 100; // Add 100px to width
      const popupHeight = parsedEmbedData.height + 100; // Add 100px to height
      
      return generateEnhancedPopupCode({
        formUrl: parsedEmbedData.src,
        formWidth: parsedEmbedData.width,
        formHeight: parsedEmbedData.height,
        popupWidth,
        popupHeight,
        buttonColor: previewColor,
        buttonTextColor: previewTextColor,
        borderRadius: previewBorderRadius,
        customFieldName: customFieldName || 'listing'
      });
    }
    return { headerCode: '', footerCode: '' };
  };

  // Generate code based on selection
  const generateCodeForSelection = () => {
    if (buttonType === 'popup' && formEmbedUrl && parsedEmbedData) {
      // Generate popup template with 100px spacing
      const popupCode = generateFullPopupCode();
      return {
        headerCode: popupCode.headerCode,
        footerCode: popupCode.footerCode
      };
    } else {
      // Generate directory listing template
      return {
        headerCode: `/* Directory Listing CSS */
.ghl-listing-button {
  background-color: ${previewColor};
  color: ${previewTextColor};
  border-radius: ${previewBorderRadius}px;
  padding: 0.5rem 1rem;
  transition: all 0.2s ease;
}`,
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
</script>`
      };
    }
  };

  const generatedCode = generateCodeForSelection();

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
              {buttonType === 'popup' ? (
                <Textarea
                  id="form-embed"
                  placeholder='<iframe src="https://link.msgsndr.com/form/..." width="500" height="600"></iframe>'
                  value={formEmbedUrl}
                  onChange={(e) => setFormEmbedUrl(e.target.value)}
                  className="min-h-[100px]"
                />
              ) : (
                <Input
                  id="form-embed"
                  placeholder="https://link.msgsndr.com/form/..."
                  value={formEmbedUrl}
                  onChange={(e) => setFormEmbedUrl(e.target.value)}
                />
              )}
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
                    <div className="bg-blue-50 p-2 rounded-md">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                      </svg>
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
                  onClick={() => navigator.clipboard.writeText(generatedCode.headerCode)}
                >
                  Copy
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
                  onClick={() => navigator.clipboard.writeText(generatedCode.footerCode)}
                >
                  Copy
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