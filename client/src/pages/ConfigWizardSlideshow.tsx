import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Rocket, Settings, FileText, Download, FolderOpen, Building2, Upload, ExternalLink, Code, Copy, MapPin, AlignLeft, DollarSign, ShoppingBag, ShoppingCart, Hash, Check, X } from 'lucide-react';

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
    <div className={`h-[800px] flex flex-col justify-center items-center p-8 ${className}`}>
      <div className="w-full max-w-6xl mx-auto bg-white border border-white/30 rounded-2xl p-8 shadow-lg h-full flex flex-col">
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
  
  // Metadata bar configuration - exact copy from config wizard
  const [metadataTextColor, setMetadataTextColor] = useState('#374151');
  const [metadataFont, setMetadataFont] = useState('system-ui, sans-serif');
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

  // Parse embed code for popup dimensions - exact copy from config wizard
  const parsedEmbedData = useMemo(() => {
    if (buttonType === 'popup' && formEmbedUrl) {
      return parseEmbedCode(formEmbedUrl);
    }
    return null;
  }, [buttonType, formEmbedUrl]);

  // Generate custom action button popup code - exact copy from config wizard
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

  // Extract form URL from iframe embed code - exact copy from config wizard
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

  // Generate directory configuration for form creation
  const generateDirectoryConfig = (): DirectoryConfig => {
    return {
      customFieldName: customFieldName || 'listing',
      showDescription: showDescription,
      showMetadata: showMetadata,
      showMaps: showMaps,
      showPrice: showPrice,
      metadataFields: metadataFields.map(field => field.label),
      formEmbedUrl: formEmbedUrl,
      buttonType: buttonType as 'popup' | 'redirect' | 'download'
    };
  };

  // Generate complete form HTML with all configured fields
  const generateDynamicForm = () => {
    const config = generateDirectoryConfig();
    return {
      formHTML: generateFormHTML(config),
      formCSS: generateFormCSS(),
      formFields: generateFormFields(config)
    };
  };

  // Generate code based on selection - exact copy from config wizard
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
          position: 'bottom',
          fields: metadataFields,
          customClass: 'listing-metadata-bar',
          backgroundColor: 'transparent',
          textColor: metadataTextColor,
          borderRadius: 0,
          fontFamily: metadataFont,
          showMaps: showMaps
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
          position: 'bottom',
          fields: metadataFields,
          customClass: 'listing-metadata-bar',
          backgroundColor: 'transparent',
          textColor: metadataTextColor,
          borderRadius: 0,
          fontFamily: metadataFont,
          showMaps: showMaps
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
        position: 'bottom',
        fields: metadataFields,
        customClass: 'listing-metadata-bar',
        backgroundColor: 'transparent',
        textColor: metadataTextColor,
        borderRadius: 0,
        fontFamily: metadataFont,
        showMaps: showMaps
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
    metadataTextColor,
    metadataFont,
    metadataFields
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

  // File upload handlers
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      setLogoFile(imageFile);
      setLogoUrl(URL.createObjectURL(imageFile));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  // Slide navigation
  const nextSlide = () => {
    setCurrentSlide(prev => Math.min(prev + 1, totalSlides - 1));
  };

  const prevSlide = () => {
    setCurrentSlide(prev => Math.max(prev - 1, 0));
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const totalSlides = 10;

  const slides = [
    // Slide 0: Welcome
    <Slide key={0}>
      <div className="text-center space-y-8">
        <div className="flex flex-col items-center justify-center mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-full mb-6">
            <Rocket className="w-12 h-12" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Upgrade Your Ecommerce Store With Directory Features!</h1>
            <p className="text-xl text-slate-600">Turn your store into a powerful product discovery hub with maps, rich text, forms and surveys!</p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="text-center p-6 bg-blue-50 rounded-lg">
              <div className="bg-blue-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Settings className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Choose Your Directory Type</h3>
              <p className="text-slate-600">Pick a layout and structure that matches your product listings</p>
            </div>

            <div className="text-center p-6 bg-green-50 rounded-lg">
              <div className="bg-green-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Code className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Custom Features</h3>
              <p className="text-slate-600">Enable maps, rich descriptions, metadata, and other smart features</p>
            </div>

            <div className="text-center p-6 bg-purple-50 rounded-lg">
              <div className="bg-purple-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Building2 className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Copy & Deploy</h3>
              <p className="text-slate-600">Generate clean code to quickly deploy your directory!</p>
            </div>
          </div>


        </div>
      </div>
    </Slide>,

    // Slide 1: Google Drive Connection
    <Slide key={1}>
      <div className="text-center space-y-6">
        <div className="flex items-center justify-center mb-8">
          <div className="bg-blue-500 text-white p-4 rounded-full mr-4">
            <FolderOpen className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Connect Google Drive</h1>
            <p className="text-lg text-slate-600">Secure storage for your directory images</p>
          </div>
        </div>

        <div className="max-w-2xl mx-auto space-y-6">
          {!googleDriveConnected ? (
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 bg-slate-50">
              <div className="text-center">
                <div className="bg-blue-100 p-6 rounded-full w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-12 h-12 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                    <polyline points="14,2 14,8 20,8"/>
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">Connect Your Google Drive</h3>
                <p className="text-slate-600 mb-6">
                  Store and manage your directory images with Google Drive integration. Your images will be saved in a dedicated "Directory Images" folder.
                </p>
                <Button 
                  onClick={() => {
                    setGoogleDriveConnected(true);
                    setGoogleDriveEmail('user@example.com'); // This would be set from actual OAuth flow
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
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
                    <p className="text-sm text-blue-700">This account will be automatically used for future directories. You can switch accounts anytime.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Slide>,

    // Slide 2: Directory Setup
    <Slide key={2}>
      <div className="space-y-6">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-purple-500 text-white p-4 rounded-full mr-4">
              <Building2 className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Directory Setup</h1>
              <p className="text-lg text-slate-600">Configure your directory information</p>
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="directory-name" className="text-lg font-medium">Directory Name</Label>
              <Input
                id="directory-name"
                placeholder="My Business Directory"
                value={directoryName}
                onChange={(e) => setDirectoryName(e.target.value)}
                className="text-lg p-4"
              />
              <p className="text-slate-500">Give your directory a memorable name for organization</p>
            </div>

            <div className="space-y-2">
              <Label className="text-lg font-medium">Logo Upload</Label>
              <div 
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragOver ? 'border-blue-400 bg-blue-50' : 'border-slate-300 bg-slate-50'
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                {logoUrl ? (
                  <div className="space-y-4">
                    <img src={logoUrl} alt="Logo preview" className="max-w-32 max-h-32 mx-auto rounded-lg" />
                    <p className="text-slate-600">Logo uploaded successfully</p>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setLogoUrl('');
                        setLogoFile(null);
                      }}
                    >
                      Remove Logo
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Upload className="w-12 h-12 text-slate-400 mx-auto" />
                    <div>
                      <p className="text-lg font-medium text-slate-700">Drop your logo here</p>
                      <p className="text-slate-500">or click to browse files</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Slide>,

    // Slide 3: Integration Method
    <Slide key={3}>
      <div className="space-y-6">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-green-500 text-white p-4 rounded-full mr-4">
              <Settings className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Choose Integration Method</h1>
              <p className="text-lg text-slate-600">Select how you want to integrate GoHighLevel forms</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 justify-items-center">
              <Button
              variant={buttonType === 'popup' ? 'default' : 'outline'}
              className={`h-auto p-4 justify-start overflow-hidden ${
                buttonType === 'popup' ? 'bg-blue-50 border-blue-500 text-blue-900 hover:bg-blue-100' : 'hover:border-slate-400'
              }`}
              onClick={() => setButtonType('popup')}
            >
              <div className="flex items-start space-x-3 w-full min-w-0">
                <div className="bg-blue-500 text-white p-2 rounded-md flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <path d="M21 15l-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
                  </svg>
                </div>
                <div className="text-left min-w-0 flex-1">
                  <h3 className="font-medium text-sm leading-tight">Action Button (Popup)</h3>
                  <p className="text-xs text-slate-500 leading-tight mt-1">Opens form in popup overlay</p>
                </div>
              </div>
            </Button>

            <Button
              variant={buttonType === 'redirect' ? 'default' : 'outline'}
              className={`h-auto p-4 justify-start overflow-hidden ${
                buttonType === 'redirect' ? 'bg-green-50 border-green-500 text-green-900 hover:bg-green-100' : 'hover:border-slate-400'
              }`}
              onClick={() => setButtonType('redirect')}
            >
              <div className="flex items-start space-x-3 w-full min-w-0">
                <div className="bg-green-500 text-white p-2 rounded-md flex-shrink-0">
                  <ExternalLink className="w-4 h-4" />
                </div>
                <div className="text-left min-w-0 flex-1">
                  <h3 className="font-medium text-sm leading-tight">Action Button (Redirect)</h3>
                  <p className="text-xs text-slate-500 leading-tight mt-1">Redirects to external form page</p>
                </div>
              </div>
            </Button>

            <Button
              variant={buttonType === 'download' ? 'default' : 'outline'}
              className={`h-auto p-4 justify-start overflow-hidden ${
                buttonType === 'download' ? 'bg-orange-50 border-orange-500 text-orange-900 hover:bg-orange-100' : 'hover:border-slate-400'
              }`}
              onClick={() => setButtonType('download')}
            >
              <div className="flex items-start space-x-3 w-full min-w-0">
                <div className="bg-orange-500 text-white p-2 rounded-md flex-shrink-0">
                  <Download className="w-4 h-4" />
                </div>
                <div className="text-left min-w-0 flex-1">
                  <h3 className="font-medium text-sm leading-tight">Action Button (Download)</h3>
                  <p className="text-xs text-slate-500 leading-tight mt-1">Downloads file directly</p>
                </div>
              </div>
            </Button>

            <Button
              variant={buttonType === 'popup' ? 'default' : 'outline'}
              className={`h-auto p-4 justify-start overflow-hidden ${
                buttonType === 'popup' ? 'bg-purple-50 border-purple-500 text-purple-900 hover:bg-purple-100' : 'hover:border-slate-400'
              }`}
              onClick={() => setButtonType('popup')}
            >
              <div className="flex items-start space-x-3 w-full min-w-0">
                <div className="bg-purple-500 text-white p-2 rounded-md flex-shrink-0">
                  <Code className="w-4 h-4" />
                </div>
                <div className="text-left min-w-0 flex-1">
                  <h3 className="font-medium text-sm leading-tight">Popup Form</h3>
                  <p className="text-xs text-slate-500 leading-tight mt-1">Opens form in modal popup</p>
                </div>
              </div>
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

              <div className="space-y-2">
                <Label htmlFor="custom-field">Custom Field Name</Label>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                  <div className="flex items-start space-x-2">
                    <div className="bg-blue-100 p-1.5 rounded-full mt-0.5">
                      <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <p className="text-sm text-blue-700">
                      Add a custom hidden field to your GoHighLevel form. Enter the field name below — we'll automatically populate it with the product name on each submission.
                    </p>
                  </div>
                </div>
                <Input
                  id="custom-field"
                  placeholder="listing"
                  value={customFieldName}
                  onChange={(e) => setCustomFieldName(e.target.value)}
                />
              </div>

              {/* Button Styling Controls - Show for all action button types */}
              {(buttonType === 'popup' || buttonType === 'redirect' || buttonType === 'download') && (
                <div className="space-y-4 bg-slate-50 p-4 rounded-lg overflow-hidden">
                  <h4 className="font-medium text-slate-900">Button Styling</h4>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full">
                    <div className="space-y-2">
                      <Label htmlFor="button-text">Button Text</Label>
                      <Input
                        id="button-text"
                        value={buttonText}
                        onChange={(e) => setButtonText(e.target.value)}
                        placeholder="Get More Info"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="button-color">Button Color</Label>
                      <div className="flex space-x-2">
                        <Input
                          id="button-color"
                          type="color"
                          value={previewColor}
                          onChange={(e) => setPreviewColor(e.target.value)}
                          className="w-16 h-10 p-1"
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
                          className="w-16 h-10 p-1"
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
                      <Label htmlFor="border-radius">Border Radius: {previewBorderRadius}px</Label>
                      <input
                        id="border-radius"
                        type="range"
                        min="0"
                        max="50"
                        value={previewBorderRadius}
                        onChange={(e) => setPreviewBorderRadius(Number(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>
                  
                  {/* Button Preview */}
                  <div className="space-y-2">
                    <Label>Button Preview</Label>
                    <div className="p-4 bg-white border border-slate-200 rounded-lg">
                      <button
                        style={{
                          backgroundColor: previewColor,
                          color: previewTextColor,
                          borderRadius: `${previewBorderRadius}px`,
                          padding: '0.75rem 1.5rem',
                          border: 'none',
                          cursor: 'pointer',
                          fontWeight: '500',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {buttonText || 'Get More Info'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Additional Configuration for redirect and download */}
          {(buttonType === 'redirect' || buttonType === 'download') && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="target-url">
                  {buttonType === 'redirect' ? 'Redirect URL' : 'Download URL'}
                </Label>
                <Input
                  id="target-url"
                  placeholder={buttonType === 'redirect' ? 'https://example.com/contact' : 'https://example.com/brochure.pdf'}
                  value={formEmbedUrl}
                  onChange={(e) => setFormEmbedUrl(e.target.value)}
                />
                <p className="text-sm text-slate-500">
                  {buttonType === 'redirect' 
                    ? 'URL where users will be redirected when clicking the button'
                    : 'Direct link to the file that users will download'
                  }
                </p>
              </div>

              {/* Button Styling Controls for redirect and download */}
              <div className="space-y-4 bg-slate-50 p-4 rounded-lg overflow-hidden">
                <h4 className="font-medium text-slate-900">Button Styling</h4>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full">
                  <div className="space-y-2">
                    <Label htmlFor="button-text-alt">Button Text</Label>
                    <Input
                      id="button-text-alt"
                      value={buttonText}
                      onChange={(e) => setButtonText(e.target.value)}
                      placeholder={buttonType === 'redirect' ? 'Contact Us' : 'Download Now'}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="button-color-alt">Button Color</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="button-color-alt"
                        type="color"
                        value={previewColor}
                        onChange={(e) => setPreviewColor(e.target.value)}
                        className="w-16 h-10 p-1"
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
                    <Label htmlFor="text-color-alt">Text Color</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="text-color-alt"
                        type="color"
                        value={previewTextColor}
                        onChange={(e) => setPreviewTextColor(e.target.value)}
                        className="w-16 h-10 p-1"
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
                    <Label htmlFor="border-radius-alt">Border Radius: {previewBorderRadius}px</Label>
                    <input
                      id="border-radius-alt"
                      type="range"
                      min="0"
                      max="50"
                      value={previewBorderRadius}
                      onChange={(e) => setPreviewBorderRadius(Number(e.target.value))}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>
                
                {/* Button Preview */}
                <div className="space-y-2">
                  <Label>Button Preview</Label>
                  <div className="p-4 bg-white border border-slate-200 rounded-lg">
                    <button
                      style={{
                        backgroundColor: previewColor,
                        color: previewTextColor,
                        borderRadius: `${previewBorderRadius}px`,
                        padding: '0.75rem 1.5rem',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: '500',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {buttonText || (buttonType === 'redirect' ? 'Contact Us' : 'Download Now')}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Slide>,

    // Slide 4: Styling & Features
    <Slide key={4}>
      <div className="space-y-6">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-orange-500 text-white p-4 rounded-full mr-4">
              <Settings className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Styling & Features</h1>
              <p className="text-lg text-slate-600">Customize appearance and enable features</p>
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          {/* Feature Toggles */}
          <div className="space-y-6 flex flex-col items-center">
            <h3 className="text-xl font-semibold text-slate-900">Features</h3>
            
            <div className="space-y-4 w-[550px]">
              <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <AlignLeft className="w-5 h-5 text-slate-600" />
                  <div>
                    <Label className="font-medium">Expanded Description</Label>
                    <p className="text-sm text-slate-500">Add detailed content below listings</p>
                  </div>
                </div>
                <Switch
                  checked={showDescription}
                  onCheckedChange={setShowDescription}
                />
              </div>

              <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Hash className="w-5 h-5 text-slate-600" />
                  <div>
                    <Label className="font-medium">Metadata Bar</Label>
                    <p className="text-sm text-slate-500">Show contact info and details</p>
                  </div>
                </div>
                <Switch
                  checked={showMetadata}
                  onCheckedChange={setShowMetadata}
                />
              </div>

              <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <MapPin className="w-5 h-5 text-slate-600" />
                  <div>
                    <Label className="font-medium">Maps Integration</Label>
                    <p className="text-sm text-slate-500">Enable location mapping</p>
                  </div>
                </div>
                <Switch
                  checked={showMaps}
                  onCheckedChange={setShowMaps}
                />
              </div>

              <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <DollarSign className="w-5 h-5 text-slate-600" />
                  <div>
                    <Label className="font-medium">Show Price</Label>
                    <p className="text-sm text-slate-500">Display pricing information</p>
                  </div>
                </div>
                <Switch
                  checked={showPrice}
                  onCheckedChange={setShowPrice}
                />
              </div>

              <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <ShoppingBag className="w-5 h-5 text-slate-600" />
                  <div>
                    <Label className="font-medium">Buy Now Button</Label>
                    <p className="text-sm text-slate-500">Add purchase functionality</p>
                  </div>
                </div>
                <Switch
                  checked={showBuyNowButton}
                  onCheckedChange={setShowBuyNowButton}
                />
              </div>

              <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <ShoppingCart className="w-5 h-5 text-slate-600" />
                  <div>
                    <Label className="font-medium">Add to Cart Button</Label>
                    <p className="text-sm text-slate-500">Enable cart functionality</p>
                  </div>
                </div>
                <Switch
                  checked={showAddToCartButton}
                  onCheckedChange={setShowAddToCartButton}
                />
              </div>

              <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Hash className="w-5 h-5 text-slate-600" />
                  <div>
                    <Label className="font-medium">Quantity Selector</Label>
                    <p className="text-sm text-slate-500">Allow quantity selection</p>
                  </div>
                </div>
                <Switch
                  checked={showQuantitySelector}
                  onCheckedChange={setShowQuantitySelector}
                />
              </div>
            </div>
          </div>


        </div>
      </div>
    </Slide>,

    // Slide 5: CSS Code
    <Slide key={5}>
      <div className="space-y-6">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-blue-500 text-white p-4 rounded-full mr-4">
              <Code className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">CSS Code</h1>
              <p className="text-lg text-slate-600">Add to Custom CSS section in GoHighLevel</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-lg font-medium">CSS Code (Add to Custom CSS section)</Label>
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

/* Remove title truncation and set width */
body:not(.hl-builder) [class*="product-title"],
body:not(.hl-builder) [class*="product-name"],
body:not(.hl-builder) .hl-product-detail-product-name,
body:not(.hl-builder) p.hl-product-detail-product-name.truncate-text {
  white-space: normal !important;
  overflow: visible !important;
  text-overflow: unset !important;
  -webkit-line-clamp: unset !important;
  max-height: none !important;
  height: auto !important;
  width: 800px !important;
  max-width: 800px !important;
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
}${showBuyNowButton === false ? `

/* Hide Buy Now Button */
body:not(.hl-builder) .cstore-product-detail button,
body:not(.hl-builder) .hl-product-buy-button,
body:not(.hl-builder) [class*="buy-now"],
body:not(.hl-builder) #buy-now-btn,
body:not(.hl-builder) .secondary-btn {
  display: none !important;
  visibility: hidden !important;
  opacity: 0 !important;
}` : ''}${showAddToCartButton === false ? `

/* Hide Add to Cart Button */
body:not(.hl-builder) .hl-product-cart-button,
body:not(.hl-builder) [class*="add-cart"],
body:not(.hl-builder) #add-to-cart-btn,
body:not(.hl-builder) .primary-btn {
  display: none !important;
  visibility: hidden !important;
  opacity: 0 !important;
}` : ''}${showPrice === false ? `

/* Hide Price */
body:not(.hl-builder) .cstore-product-detail [class*="price"],
body:not(.hl-builder) .product-detail-container [class*="price"],
body:not(.hl-builder) .hl-product-price,
body:not(.hl-builder) .hl-product-detail-product-price,
body:not(.hl-builder) p.hl-product-detail-product-price {
  display: none !important;
  visibility: hidden !important;
  opacity: 0 !important;
}` : ''}${showQuantitySelector === false ? `

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
}` : ''}${showCartIcon === false ? `

/* Hide Cart Icon - Comprehensive targeting */
body:not(.hl-builder) .nav-cart-icon,
body:not(.hl-builder) .nav-cart-button,
body:not(.hl-builder) .items-cart,
body:not(.hl-builder) .cart-search-desktop,
body:not(.hl-builder) .nav-cart-wrapper,
body:not(.hl-builder) svg[width="20"][height="20"][viewBox="0 0 20 20"] path[d*="M1.66699 1.66675"],
body:not(.hl-builder) button.items-cart,
body:not(.hl-builder) [class*="cart-button"],
body:not(.hl-builder) [class*="nav-cart"],
body:not(.hl-builder) svg[clip-path*="clip0_1655_15551"],
body:not(.hl-builder) img[src="https://storage.googleapis.com/msgsndr/kQDg6qp2x7GXYJ1VCkI8/media/6836acff9bd24392ee734932.svg"] {
  display: none !important;
  visibility: hidden !important;
  opacity: 0 !important;
}` : ''}
</style>`;
                  copyToClipboard(cssCode, setCssCodeCopied);
                }}
                className="flex items-center space-x-2"
              >
                {cssCodeCopied ? (
                  <>
                    <Check className="w-4 h-4 text-green-600" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy CSS</span>
                  </>
                )}
              </Button>
            </div>
            <div className="bg-slate-900 text-slate-100 p-4 rounded-lg h-80 overflow-auto">
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

/* Remove title truncation and set width */
body:not(.hl-builder) [class*="product-title"],
body:not(.hl-builder) [class*="product-name"],
body:not(.hl-builder) .hl-product-detail-product-name,
body:not(.hl-builder) p.hl-product-detail-product-name.truncate-text {
  white-space: normal !important;
  overflow: visible !important;
  text-overflow: unset !important;
  -webkit-line-clamp: unset !important;
  max-height: none !important;
  height: auto !important;
  width: 800px !important;
  max-width: 800px !important;
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
}${!showPrice ? `

/* Hide Price Display */
body:not(.hl-builder) .cstore-product-detail [class*="price"],
body:not(.hl-builder) .product-detail-container [class*="price"],
body:not(.hl-builder) .hl-product-price,
body:not(.hl-builder) .hl-product-detail-product-price,
body:not(.hl-builder) p.hl-product-detail-product-price {
  display: none !important;
  visibility: hidden !important;
  opacity: 0 !important;
}` : ''}${!showBuyNowButton ? `

/* Hide Buy Now Button */
body:not(.hl-builder) .cstore-product-detail [class*="buy-now"],
body:not(.hl-builder) .product-detail-container [class*="buy-now"],
body:not(.hl-builder) .hl-buy-now-button,
body:not(.hl-builder) button[class*="buy-now"] {
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

/* Scrolling fix - public pages only */
body:not(.hl-builder) .fullSection, 
body:not(.hl-builder) .c-section, 
body:not(.hl-builder) .c-wrapper, 
body:not(.hl-builder) .inner, 
body:not(.hl-builder) .vertical {
  overflow: visible !important;
  max-height: none !important;
  height: auto !important;
}

body:not(.hl-builder) { 
  overflow-x: hidden !important; 
  overflow-y: auto !important; 
}${showBuyNowButton === false ? `

/* Hide Buy Now Button */
body:not(.hl-builder) .hl-product-buy-button,
body:not(.hl-builder) [class*="buy-now"],
body:not(.hl-builder) .secondary-btn {
  display: none !important;
}` : ''}${showAddToCartButton === false ? `

/* Hide Add to Cart Button */
body:not(.hl-builder) .hl-product-cart-button,
body:not(.hl-builder) [class*="add-cart"],
body:not(.hl-builder) .primary-btn {
  display: none !important;
}` : ''}${showQuantitySelector === false ? `

/* Hide Quantity Selector */
body:not(.hl-builder) .hl-product-detail-selectors,
body:not(.hl-builder) [class*="quantity"],
body:not(.hl-builder) .quantity-container {
  display: none !important;
}` : ''}
</style>`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </Slide>,

    // Slide 6: Header Code
    <Slide key={6}>
      <div className="space-y-6">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-purple-500 text-white p-4 rounded-full mr-4">
              <FileText className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Header Code</h1>
              <p className="text-lg text-slate-600">Add to &lt;head&gt; section of your website</p>
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
              <pre className="text-sm whitespace-pre-wrap">{generatedCode.headerCode}</pre>
            </div>
          </div>
        </div>
      </div>
    </Slide>,

    // Slide 7: Footer Code
    <Slide key={7}>
      <div className="space-y-6">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-orange-500 text-white p-4 rounded-full mr-4">
              <Code className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Footer Code</h1>
              <p className="text-lg text-slate-600">Add before &lt;/body&gt; tag on your website</p>
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
              <pre className="text-sm whitespace-pre-wrap">{generatedCode.footerCode}</pre>
            </div>
          </div>
        </div>
      </div>
    </Slide>,

    // Slide 8: Form Preview
    <Slide key={8}>
      <div className="space-y-6">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-indigo-500 text-white p-4 rounded-full mr-4">
              <FileText className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Generated Form Preview</h1>
              <p className="text-lg text-slate-600">Your directory will create forms with these fields</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Working Form Preview */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-slate-900 mb-4">Live Working Form</h3>
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden max-h-96 overflow-y-auto">
              <div className="scale-75 origin-top-left" style={{ width: '133.33%', height: '133.33%' }}>
                <DirectoryForm />
              </div>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <strong>Live Form:</strong> This is the actual working form with AI summarizer, auto-fill functionality, and real database persistence. Test all features including the "Generate Bullet Points with AI" button.
              </p>
            </div>
          </div>

          {/* Configuration Summary */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-slate-900 mb-4">Configuration Summary</h3>
            
            <div className="space-y-3">

              {(showDescription || showMetadata || showMaps || showPrice) && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-medium text-green-800 mb-2">Optional Features (Based on Selection)</h4>
                  <ul className="text-sm text-green-700 space-y-1">
                    {showPrice && <li>• Price Field</li>}
                    {showDescription && <li>• Detailed Description</li>}
                    {showMaps && <li>• Business Address (for Google Maps)</li>}
                    {showMetadata && metadataFields.length > 0 && (
                      <li>• Metadata Fields: {metadataFields.map(f => f.label).join(', ')}</li>
                    )}
                  </ul>
                </div>
              )}
              

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h4 className="font-medium text-amber-800 mb-3">Form Embed Code</h4>
                <div className="space-y-3">
                  <p className="text-sm text-amber-700">Copy this HTML code to embed the form on your website:</p>
                  <div className="relative">
                    <div className="bg-slate-900 text-slate-100 p-3 rounded text-xs overflow-auto max-h-32">
                      <code>{`<iframe src="${window.location.origin}/form/${directoryName || 'your-location'}/${directoryName || 'your-directory'}" width="100%" height="600" frameborder="0" style="border-radius: 8px;"></iframe>`}</code>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="absolute top-2 right-2 h-7 px-2"
                      onClick={() => {
                        const embedCode = `<iframe src="${window.location.origin}/form/${directoryName || 'your-location'}/${directoryName || 'your-directory'}" width="100%" height="600" frameborder="0" style="border-radius: 8px;"></iframe>`;
                        navigator.clipboard.writeText(embedCode);
                      }}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                  <p className="text-xs text-amber-600">Replace 'your-location' and 'your-directory' with your actual values.</p>
                </div>
              </div>
            </div>
            

          </div>
        </div>
      </div>
    </Slide>,

    // Slide 9: Summary
    <Slide key={9}>
      <div className="text-center space-y-6">
        <div className="flex items-center justify-center mb-8">
          <div className="bg-green-500 text-white p-4 rounded-full mr-4">
            <Rocket className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Setup Complete!</h1>
            <p className="text-lg text-slate-600">Your GoHighLevel integration is ready</p>
          </div>
        </div>

        <div className="max-w-2xl mx-auto space-y-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-green-800 mb-4">Configuration Summary</h3>
            <div className="space-y-3 text-left">
              <div className="flex items-center justify-between">
                <span className="text-green-700">Directory Name:</span>
                <span className="font-medium text-green-800">{directoryName || 'Not specified'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-green-700">Integration Method:</span>
                <span className="font-medium text-green-800 capitalize">{buttonType}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-green-700">Google Drive:</span>
                <span className="font-medium text-green-800">{googleDriveConnected ? 'Connected' : 'Not connected'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-green-700">Expanded Description:</span>
                <span className="font-medium text-green-800">{showDescription ? 'Enabled' : 'Disabled'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-green-700">Metadata Bar:</span>
                <span className="font-medium text-green-800">{showMetadata ? 'Enabled' : 'Disabled'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-green-700">Maps:</span>
                <span className="font-medium text-green-800">{showMaps ? 'Enabled' : 'Disabled'}</span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">Next Steps</h3>
            <ol className="text-left text-blue-700 space-y-2">
              <li>1. Copy the header code to your website's &lt;head&gt; section</li>
              <li>2. Copy the footer code before your closing &lt;/body&gt; tag</li>
              <li>3. Test your integration on a live page</li>
              <li>4. Customize content for specific listings as needed</li>
            </ol>
          </div>

          <Button 
            onClick={() => goToSlide(4)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
          >
            <Code className="w-5 h-5 mr-2" />
            View CSS Code
          </Button>
        </div>
      </div>
    </Slide>
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-600 text-white p-2 rounded-lg">
                <Rocket className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Directory Creation Wizard</h1>
                <p className="text-slate-600">Step {currentSlide + 1} of {totalSlides}</p>
              </div>
            </div>
            
            {/* Progress bar */}
            <div className="flex items-center space-x-2">
              {Array.from({ length: totalSlides }, (_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === currentSlide 
                      ? 'bg-blue-600' 
                      : index < currentSlide 
                        ? 'bg-green-500' 
                        : 'bg-slate-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Slide Content with sliding animation */}
      <div className="flex-1 overflow-hidden relative">
        <div 
          className="flex transition-transform duration-500 ease-in-out h-full"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {slides.map((slide, index) => (
            <div key={index} className="w-full flex-shrink-0">
              {slide}
            </div>
          ))}
        </div>
      </div>

      {/* Navigation with centered slide indicator */}
      <div className="bg-white border-t border-slate-200 p-4 relative">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Button
            variant="outline"
            onClick={prevSlide}
            disabled={currentSlide === 0}
            className="flex items-center space-x-2"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </Button>

          {/* Centered slide indicator */}
          <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center space-x-2">
            {Array.from({ length: totalSlides }, (_, i) => (
              <button
                key={i}
                onClick={() => goToSlide(i)}
                className={`w-3 h-3 rounded-full transition-all duration-200 ${
                  i === currentSlide 
                    ? 'bg-blue-500 scale-110' 
                    : 'bg-slate-300 hover:bg-slate-400'
                }`}
              />
            ))}
          </div>

          <Button
            onClick={nextSlide}
            disabled={currentSlide === totalSlides - 1}
            className="flex items-center space-x-2"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}