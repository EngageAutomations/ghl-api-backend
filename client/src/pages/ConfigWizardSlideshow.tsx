import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Rocket, Settings, FileText, Download, FolderOpen, Building2, Upload, ExternalLink, Code, Copy, MapPin, AlignLeft, DollarSign, ShoppingBag, ShoppingCart, Hash, Check, X, CheckCircle2 as CheckCircle, Info } from 'lucide-react';

// Import proven code generation functions from config wizard
import { parseEmbedCode, ParsedEmbedData } from '@/lib/embed-parser';
import { generateActionButtonPopup } from '@/lib/custom-popup-generator';
import { generateEmbeddedFormCode } from '@/lib/embedded-form-generator';
import { generateExpandedDescriptionCode } from '@/lib/expanded-description-generator';
import { generateMetadataBarCode, MetadataField } from '@/lib/metadata-bar-generator';
import { generateFormFields, generateFormHTML, generateFormCSS, DirectoryConfig } from '@/lib/dynamic-form-generator';
import DirectoryForm from '@/pages/DirectoryForm';

interface SlideProps {
  children: React.ReactNode;
  className?: string;
}

function Slide({ children, className = "" }: SlideProps) {
  return (
    <div className={`min-h-[1000px] flex flex-col justify-center items-center p-8 ${className}`}>
      <div className="w-full max-w-6xl mx-auto bg-white border border-white/30 rounded-2xl p-8 shadow-lg min-h-[900px] flex flex-col">
        {children}
      </div>
    </div>
  );
}

export default function ConfigWizardSlideshow() {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  // Slideshow-specific state
  const [googleDriveConnected, setGoogleDriveConnected] = useState(false);
  const [googleDriveEmail, setGoogleDriveEmail] = useState('');
  const [directoryName, setDirectoryName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  
  // Form configuration state - exact copy from config wizard
  const [buttonType, setButtonType] = useState<string>('popup');
  const [formEmbedUrl, setFormEmbedUrl] = useState<string>('');
  const [customFieldName, setCustomFieldName] = useState<string>('listing');
  const [previewColor, setPreviewColor] = useState<string>('#3b82f6');
  const [previewTextColor, setPreviewTextColor] = useState<string>('#ffffff');
  const [previewBorderRadius, setPreviewBorderRadius] = useState<number>(8);

  // Copy button states
  const [cssCodeCopied, setCssCodeCopied] = useState<boolean>(false);
  const [headerCodeCopied, setHeaderCodeCopied] = useState<boolean>(false);
  const [footerCodeCopied, setFooterCodeCopied] = useState<boolean>(false);

  // Component toggles - exact copy from config wizard
  const [showPrice, setShowPrice] = useState<boolean>(false);
  const [showBuyNowButton, setShowBuyNowButton] = useState<boolean>(false);
  const [showAddToCartButton, setShowAddToCartButton] = useState<boolean>(false);
  const [showQuantitySelector, setShowQuantitySelector] = useState<boolean>(false);
  const [showCartIcon, setShowCartIcon] = useState<boolean>(false);
  const [showDescription, setShowDescription] = useState<boolean>(false);
  const [showMetadata, setShowMetadata] = useState<boolean>(false);
  const [showMaps, setShowMaps] = useState<boolean>(false);
  
  // Expanded description configuration - exact copy from config wizard
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
  
  // Button text state
  const [buttonText, setButtonText] = useState('Get More Info');
  
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

  // Extract form URL from iframe embed code
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

  // Generate code based on selection - simplified working version
  const generateCodeForSelection = () => {
    console.log('generateCodeForSelection called with formEmbedUrl:', formEmbedUrl?.length || 0, 'chars');
    
    if (formEmbedUrl && formEmbedUrl.trim()) {
      if (buttonType === 'popup') {
        console.log('Generating popup code...');
        const popupCode = generateFullPopupCode();
        console.log('Popup code generated:', !!popupCode.headerCode, !!popupCode.footerCode);
        
        return {
          headerCode: popupCode.headerCode || '/* No popup header code generated */',
          footerCode: popupCode.footerCode || '/* No popup footer code generated */'
        };
      }
      
      // Simple fallback for other types
      return {
        headerCode: `/* Directory Integration CSS */
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
  console.log('Directory integration loaded');
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
    
    console.log('No formEmbedUrl provided, returning empty code');
    return { headerCode: '', footerCode: '' };
  };

  const generatedCode = useMemo(() => {
    console.log('useMemo triggered, formEmbedUrl length:', formEmbedUrl?.length || 0);
    const result = generateCodeForSelection();
    console.log('Generated code result:', {
      headerLength: result?.headerCode?.length || 0,
      footerLength: result?.footerCode?.length || 0
    });
    return result;
  }, [
    formEmbedUrl, 
    buttonType, 
    customFieldName, 
    previewBorderRadius, 
    previewColor, 
    previewTextColor,
    showDescription,
    expandedDescriptionContent,
    expandedDescFadeIn,
    expandedDescClass,
    showMetadata,
    showMaps
  ]);

  // Helper function for copying text with visual feedback - exact copy from config wizard
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

  const totalSlides = 8;

  const nextSlide = () => {
    if (currentSlide < totalSlides - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const slides = [
    // Slide 1: Welcome
    <Slide key={0}>
      <div className="text-center">
        <h1 className="text-5xl font-bold text-slate-900 mb-6">Directory Wizard</h1>
        <p className="text-xl text-slate-600 mb-8 max-w-3xl mx-auto">
          Transform your GoHighLevel eCommerce store into a powerful directory platform
        </p>
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-8 max-w-4xl mx-auto">
          <h2 className="text-2xl font-semibold text-slate-900 mb-4">What You'll Create</h2>
          <div className="grid md:grid-cols-3 gap-6 text-left">
            <div className="flex items-start space-x-3">
              <div className="bg-blue-100 p-2 rounded-full">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Business Directory</h3>
                <p className="text-slate-600 text-sm">Dynamic listings with custom fields</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="bg-green-100 p-2 rounded-full">
                <FileText className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Lead Capture</h3>
                <p className="text-slate-600 text-sm">Integrated forms for each listing</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="bg-purple-100 p-2 rounded-full">
                <Settings className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Full Customization</h3>
                <p className="text-slate-600 text-sm">Complete control over appearance</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Slide>,

    // Slide 2: Google Drive Setup
    <Slide key={1}>
      <div className="space-y-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Google Drive Integration</h1>
          <p className="text-xl text-slate-600">Connect your Google Drive to store directory images</p>
        </div>

        {!googleDriveConnected ? (
          <div className="max-w-2xl mx-auto">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-8 text-center">
              <div className="bg-blue-100 p-6 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                <svg className="w-12 h-12 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6.28 3l5.72 9.91-2.86 4.95L.28 3h6zM16.78 3h6l-8.86 15.34L11.78 15 16.78 3zM12 13l2.86-4.95L17.72 21H6.28L12 13z"/>
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">Connect Google Drive</h2>
              <p className="text-slate-600 mb-6">
                Images will be stored in a "Directory Images" folder in your Google Drive for easy organization and management.
              </p>
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-700">✓ Automatic folder creation</span>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-700">✓ Public URL generation</span>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-700">✓ Secure OAuth authentication</span>
                  </div>
                </div>
              </div>
              <Button 
                onClick={() => {
                  setGoogleDriveConnected(true);
                  setGoogleDriveEmail('user@example.com');
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg mt-6"
              >
                <ExternalLink className="w-5 h-5 mr-2" />
                Connect Google Drive
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="bg-green-100 p-3 rounded-full mr-4">
                    <Check className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-green-800">Google Drive Connected</h3>
                    <p className="text-green-700">Account: {googleDriveEmail}</p>
                    <p className="text-sm text-green-600">Images stored in "Directory Images" folder</p>
                  </div>
                </div>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setGoogleDriveConnected(false);
                    setGoogleDriveEmail('');
                  }}
                  className="text-slate-600 hover:text-slate-800"
                >
                  Switch Account
                </Button>
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="bg-blue-100 p-2 rounded-full">
                  <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-blue-800">Automatic Reconnection</h4>
                  <p className="text-sm text-blue-700">This account will be automatically used for future directories.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Slide>,

    // Slide 3: Directory Setup
    <Slide key={2}>
      <div className="space-y-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Directory Information</h1>
          <p className="text-xl text-slate-600">Configure your directory name and branding</p>
        </div>

        <div className="max-w-2xl mx-auto space-y-6">
          <div className="space-y-2">
            <Label htmlFor="directory-name" className="text-lg font-medium">Directory Name</Label>
            <Input
              id="directory-name"
              placeholder="e.g., Local Business Directory"
              value={directoryName}
              onChange={(e) => setDirectoryName(e.target.value)}
              className="text-lg p-4"
            />
            <p className="text-sm text-slate-500">This will be used in form submissions and file organization</p>
          </div>

          <div className="space-y-2">
            <Label className="text-lg font-medium">Directory Logo (Optional)</Label>
            <div 
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragOver ? 'border-blue-500 bg-blue-50' : 'border-slate-300'
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragOver(false);
                const files = Array.from(e.dataTransfer.files);
                const imageFile = files.find(file => file.type.startsWith('image/'));
                if (imageFile) {
                  setLogoFile(imageFile);
                  setLogoUrl(URL.createObjectURL(imageFile));
                }
              }}
            >
              {logoUrl ? (
                <div className="space-y-4">
                  <img src={logoUrl} alt="Directory Logo" className="max-h-32 mx-auto rounded-lg" />
                  <div className="flex space-x-2 justify-center">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setLogoUrl('');
                        setLogoFile(null);
                      }}
                    >
                      Remove
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById('logo-upload')?.click()}
                    >
                      Change
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <Upload className="w-12 h-12 text-slate-400 mx-auto" />
                  <div>
                    <p className="text-slate-600">Drag and drop your logo here, or</p>
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById('logo-upload')?.click()}
                    >
                      Browse Files
                    </Button>
                  </div>
                  <p className="text-sm text-slate-500">PNG, JPG, or GIF up to 5MB</p>
                </div>
              )}
              <input
                id="logo-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setLogoFile(file);
                    setLogoUrl(URL.createObjectURL(file));
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </Slide>,

    // Slide 4: Form Integration
    <Slide key={3}>
      <div className="space-y-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Form Integration</h1>
          <p className="text-xl text-slate-600">Configure how visitors will contact listings</p>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          <div className="space-y-4">
            <Label className="text-lg font-medium">Integration Method</Label>
            <div className="grid md:grid-cols-3 gap-4">
              <Button
                variant={buttonType === 'popup' ? 'default' : 'outline'}
                onClick={() => setButtonType('popup')}
                className="p-6 h-auto flex flex-col items-center space-y-2"
              >
                <div className="bg-blue-100 p-3 rounded-full">
                  <ExternalLink className="w-6 h-6 text-blue-600" />
                </div>
                <span className="font-semibold">Popup Form</span>
                <span className="text-sm text-center">Form opens in overlay</span>
              </Button>
              <Button
                variant={buttonType === 'redirect' ? 'default' : 'outline'}
                onClick={() => setButtonType('redirect')}
                className="p-6 h-auto flex flex-col items-center space-y-2"
              >
                <div className="bg-green-100 p-3 rounded-full">
                  <ExternalLink className="w-6 h-6 text-green-600" />
                </div>
                <span className="font-semibold">Redirect</span>
                <span className="text-sm text-center">Navigate to form page</span>
              </Button>
              <Button
                variant={buttonType === 'embed' ? 'default' : 'outline'}
                onClick={() => setButtonType('embed')}
                className="p-6 h-auto flex flex-col items-center space-y-2"
              >
                <div className="bg-purple-100 p-3 rounded-full">
                  <FileText className="w-6 h-6 text-purple-600" />
                </div>
                <span className="font-semibold">Embedded</span>
                <span className="text-sm text-center">Form shows on page</span>
              </Button>
            </div>
          </div>

          {/* Form Configuration - Only show for popup */}
          {buttonType === 'popup' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="form-embed">
                  {buttonType === 'popup' ? 'GoHighLevel Iframe Embed Code' : 'GoHighLevel Form Embed Code'}
                </Label>
                <div className="space-y-3">
                  <textarea
                    id="form-embed"
                    placeholder="Paste your GoHighLevel iframe embed code here..."
                    className="w-full h-32 p-3 border-2 border-gray-300 rounded-lg font-mono text-sm"
                    style={{ 
                      resize: 'vertical',
                      minHeight: '120px'
                    }}
                    onBlur={(e) => {
                      if (e.target.value !== formEmbedUrl) {
                        setFormEmbedUrl(e.target.value);
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const textarea = document.getElementById('form-embed') as HTMLTextAreaElement;
                      console.log('Button clicked, textarea value:', textarea?.value?.length || 0, 'chars');
                      if (textarea && textarea.value) {
                        console.log('Setting formEmbedUrl to:', textarea.value.substring(0, 50) + '...');
                        setFormEmbedUrl(textarea.value);
                      } else {
                        console.log('No textarea value found');
                      }
                    }}
                    className="w-full"
                  >
                    Update Code Generation
                  </Button>
                </div>
                {buttonType === 'popup' && parsedEmbedData && (
                  <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
                    ✓ Form detected: {parsedEmbedData.width}×{parsedEmbedData.height}px 
                    → Popup will be {parsedEmbedData.width + 100}×{parsedEmbedData.height + 100}px (+100px spacing)
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="custom-field">Custom Field Name</Label>
                <Input
                  id="custom-field"
                  placeholder="listing"
                  value={customFieldName}
                  onChange={(e) => setCustomFieldName(e.target.value)}
                />
                <p className="text-sm text-slate-500">
                  This field will be automatically added to forms with the current listing URL
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Slide>,

    // Slide 5: Setup Complete
    <Slide key={4}>
      <div className="space-y-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-green-500 text-white p-6 rounded-full mr-4">
              <CheckCircle className="w-12 h-12" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-slate-900">Setup Complete!</h1>
              <p className="text-xl text-slate-600 mt-2">Directory configuration is ready for implementation</p>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-green-50 to-blue-50 border border-green-200 rounded-xl p-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-semibold text-slate-900 mb-3">Next Steps</h2>
              <p className="text-lg text-slate-700">
                Your directory wizard configuration is complete. Now it's time to implement the generated code.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg border border-slate-200">
                <div className="flex items-center mb-4">
                  <div className="bg-orange-100 p-3 rounded-full mr-3">
                    <ShoppingBag className="w-6 h-6 text-orange-600" />
                  </div>
                  <h3 className="font-semibold text-slate-900 text-[17px]">Access The Product Details Page</h3>
                </div>
                <p className="text-slate-600 mb-4">
                  Navigate to your GoHighLevel eCommerce store and open any product details page where you want to add directory functionality.
                </p>
                <div className="bg-slate-50 p-3 rounded border text-sm text-slate-700">
                  <strong>Tip:</strong> Choose a product page that will serve as your directory template
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg border border-slate-200">
                <div className="flex items-center mb-4">
                  <div className="bg-blue-100 p-3 rounded-full mr-3">
                    <Code className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">Add the Generated Code</h3>
                </div>
                <p className="text-slate-600 mb-4">
                  Copy the CSS and JavaScript code from the next slides and paste them into your product page's custom code sections.
                </p>
                <div className="bg-slate-50 p-3 rounded border text-sm text-slate-700">
                  <strong>Location:</strong> Custom CSS section & Footer Tracking Code
                </div>
              </div>
            </div>

            <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-blue-900 mb-2">Ready to Proceed</h4>
                  <p className="text-blue-800">
                    Click "Next" to view the CSS code that needs to be added to your Custom CSS section, 
                    followed by the JavaScript code for your Footer Tracking Code section.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Slide>,

    // Slide 6: Header Code (CSS)
    <Slide key={5}>
      <div className="space-y-6">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-blue-500 text-white p-4 rounded-full mr-4">
              <Code className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Header Code</h1>
              <p className="text-lg text-slate-600">Add to Custom CSS section in GoHighLevel</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-lg font-medium">Header Code (Add to &lt;head&gt; section)</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(generatedCode.headerCode, setHeaderCodeCopied)}
                className="flex items-center space-x-2"
              >
                {headerCodeCopied ? (
                  <>
                    <Check className="w-4 h-4 text-green-600" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy</span>
                  </>
                )}
              </Button>
            </div>
            <div className="bg-slate-900 text-slate-100 p-4 rounded-lg h-80 overflow-auto">
              <pre className="text-sm whitespace-pre-wrap">{generatedCode.headerCode || '/* No header code generated - ensure form embed code is pasted on slide 4 */'}</pre>
            </div>
            <div className="text-xs text-gray-500 mt-2">
              Debug: Header code length: {generatedCode.headerCode?.length || 0} characters
            </div>
          </div>
        </div>
      </div>
    </Slide>,

    // Slide 7: Footer Code
    <Slide key={6}>
      <div className="space-y-6">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-purple-500 text-white p-4 rounded-full mr-4">
              <Code className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Footer Code</h1>
              <p className="text-lg text-slate-600">Add before closing body tag in GoHighLevel</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-lg font-medium">Footer Code (Add before &lt;/body&gt; tag)</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(generatedCode.footerCode, setFooterCodeCopied)}
                className="flex items-center space-x-2"
              >
                {footerCodeCopied ? (
                  <>
                    <Check className="w-4 h-4 text-green-600" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy</span>
                  </>
                )}
              </Button>
            </div>
            <div className="bg-slate-900 text-slate-100 p-4 rounded-lg h-80 overflow-auto">
              <pre className="text-sm whitespace-pre-wrap">{generatedCode.footerCode || '/* No footer code generated - ensure form embed code is pasted on slide 4 */'}</pre>
            </div>
            <div className="text-xs text-gray-500 mt-2">
              Debug: Footer code length: {generatedCode.footerCode?.length || 0} characters
            </div>
          </div>
        </div>
      </div>
    </Slide>,

    // Slide 8: Final Instructions
    <Slide key={7}>
      <div className="space-y-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-green-500 text-white p-6 rounded-full mr-4">
              <Rocket className="w-12 h-12" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-slate-900">You're All Set!</h1>
              <p className="text-xl text-slate-600 mt-2">Your directory is ready to launch</p>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-green-50 to-blue-50 border border-green-200 rounded-xl p-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-semibold text-slate-900 mb-3">Implementation Summary</h2>
              <p className="text-lg text-slate-700">
                You've successfully configured your directory system. Here's what you accomplished:
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg border border-slate-200">
                <div className="flex items-center mb-4">
                  <div className="bg-green-100 p-3 rounded-full mr-3">
                    <Check className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-slate-900">Configuration Complete</h3>
                </div>
                <ul className="space-y-2 text-slate-600">
                  <li>✓ Google Drive connected for image storage</li>
                  <li>✓ Directory name and branding configured</li>
                  <li>✓ Form integration method selected</li>
                  <li>✓ Custom code generated for your setup</li>
                </ul>
              </div>

              <div className="bg-white p-6 rounded-lg border border-slate-200">
                <div className="flex items-center mb-4">
                  <div className="bg-blue-100 p-3 rounded-full mr-3">
                    <Code className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-slate-900">Next Steps</h3>
                </div>
                <ul className="space-y-2 text-slate-600">
                  <li>1. Open your GoHighLevel product page</li>
                  <li>2. Paste header code in Custom CSS section</li>
                  <li>3. Paste footer code in Footer Tracking Code</li>
                  <li>4. Test the directory functionality</li>
                </ul>
              </div>
            </div>

            <div className="text-center">
              <Button
                onClick={() => {
                  // Store configuration in localStorage for potential future use
                  const config = {
                    directoryName,
                    integrationMethod: buttonType,
                    formEmbedUrl,
                    customFieldName,
                    googleDriveConnected
                  };
                  localStorage.setItem('slideshowConfig', JSON.stringify(config));
                  window.location.href = '/';
                }}
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg"
              >
                <FolderOpen className="w-5 h-5 mr-2" />
                Complete Setup
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Slide>
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Navigation Header */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-slate-900">Directory Wizard</h1>
              <div className="text-sm text-slate-500">
                Step {currentSlide + 1} of {totalSlides}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={prevSlide}
                disabled={currentSlide === 0}
                className="flex items-center space-x-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </Button>
              
              <Button
                size="sm"
                onClick={nextSlide}
                disabled={currentSlide === totalSlides - 1}
                className="flex items-center space-x-1"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-3">
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentSlide + 1) / totalSlides) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Slide Content */}
      <div className="relative">
        {slides[currentSlide]}
      </div>
    </div>
  );
}