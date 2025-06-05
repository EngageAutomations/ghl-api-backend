import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Rocket, Settings, FileText, Download, FolderOpen, Building2, Upload, ExternalLink, Code, Copy, MapPin, AlignLeft, DollarSign, ShoppingBag, ShoppingCart, Hash, Check, X, CheckCircle2 as CheckCircle, Info, ArrowRight } from 'lucide-react';

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
  const [showCartCustomization, setShowCartCustomization] = useState<boolean>(false);
  const [showPriceRemoval, setShowPriceRemoval] = useState<boolean>(false);
  
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
  
  // Metadata configuration for working code generation
  const metadataFields2 = [
    { label: 'Location', icon: 'MapPin', id: 'location', defaultValue: 'Default Location' },
    { label: 'Price', icon: 'DollarSign', id: 'price', defaultValue: '$0' },
    { label: 'Category', icon: 'Hash', id: 'category', defaultValue: 'General' }
  ];
  
  // Copy button states for cart page CSS
  const [cartPageCodeCopied, setCartPageCodeCopied] = useState<boolean>(false);
  const [cartIconCodeCopied, setCartIconCodeCopied] = useState<boolean>(false);
  const [priceRemovalCodeCopied, setPriceRemovalCodeCopied] = useState<boolean>(false);

  // Cart Page CSS Code for removing checkout buttons
  const cartPageCssCode = `/* Cart page customization - hide checkout and make it a bookmark system */
.hl-cart-product-price,
span.text-black,
.hl-product-detail-product-price,
.product-price,
.price,
.pricing,
span[class*="price"],
div[class*="price"] {
    display: none !important;
}

/* Hide checkout and purchase buttons */
.hl-checkout-btn,
.checkout-btn,
.btn-checkout,
button[class*="checkout"],
a[class*="checkout"],
.purchase-btn,
.buy-btn,
button[class*="buy"],
a[class*="buy"],
input[type="submit"][value*="checkout" i],
input[type="submit"][value*="purchase" i],
input[type="submit"][value*="buy" i] {
    display: none !important;
}

/* Hide quantity controls on cart page */
.quantity-selector,
.qty-selector,
input[type="number"],
.quantity-input,
.qty-input,
.quantity-controls,
.qty-controls,
button[class*="qty"],
button[class*="quantity"] {
    display: none !important;
}

/* Style saved items message */
.cart-item,
.hl-cart-item {
    position: relative;
}

.cart-item::after,
.hl-cart-item::after {
    content: "Saved for later";
    display: block;
    margin-top: 8px;
    padding: 4px 8px;
    background-color: #e3f2fd;
    color: #1976d2;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
}`;

  // Cart Icon CSS Code
  const cartIconCssCode = `/* Transform cart icons to bookmark icons */

/* Hide original cart icon content */
.hl-cart-icon > *,
.cart-icon > *,
[class*="cart-icon"] > *,
i[class*="cart"] > *,
.fa-shopping-cart > *,
.shopping-cart-icon > * {
  opacity: 0;
}

/* Add bookmark icon using CSS */
.hl-cart-icon::before,
.cart-icon::before,
[class*="cart-icon"]::before,
i[class*="cart"]::before,
.fa-shopping-cart::before,
.shopping-cart-icon::before {
  content: "🔖";
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: inherit;
  z-index: 10;
}

/* Alternative bookmark icon using CSS shapes for better compatibility */
.bookmark-icon {
  position: relative;
  display: inline-block;
  width: 16px;
  height: 20px;
}

.bookmark-icon::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 16px;
  height: 20px;
  background-color: currentColor;
  clip-path: polygon(0 0, 100% 0, 100% 70%, 50% 100%, 0 70%);
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .bookmark-icon {
    width: 14px;
    height: 18px;
  }
  
  .bookmark-icon::before {
    width: 14px;
    height: 18px;
  }
}`;

  // Price Removal CSS Code for hiding prices on any page
  const priceRemovalCssCode = `/* Hide all price elements */
.hl-product-detail-product-price,
.product-price,
.price,
.pricing,
span[class*="price"],
div[class*="price"] {
    display: none !important;
}`;
  
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

  // Generate directory configuration for form creation
  const generateDirectoryConfig = (): DirectoryConfig => {
    return {
      customFieldName: customFieldName || 'listing',
      showDescription: showDescription,
      showMetadata: showMetadata,
      showMaps: showMaps,
      showPrice: showPrice,
      metadataFields: metadataFields2.map(field => field.label),
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

  // Working code generation function with debug logging
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

  // Working useMemo with debug logging
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setLogoFile(file);
      setLogoUrl(URL.createObjectURL(file));
    }
  };

  const allSlides = [
    // Slide 0: Welcome
    <Slide key={0}>
      <div className="text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-5xl font-bold text-slate-900 mb-4">Directory Wizard</h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Transform your GoHighLevel eCommerce store into a powerful directory platform with automated lead capture and dynamic listings.
          </p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-8 max-w-4xl mx-auto">
          <h2 className="text-2xl font-semibold text-slate-900 mb-6">What You'll Create</h2>
          <div className="grid md:grid-cols-3 gap-6 text-left">
            <div className="flex items-start space-x-3">
              <div className="bg-blue-100 p-3 rounded-full">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Business Directory</h3>
                <p className="text-slate-600">Dynamic listings with custom fields and metadata</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="bg-green-100 p-3 rounded-full">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Lead Capture Forms</h3>
                <p className="text-slate-600">Integrated GoHighLevel forms for each listing</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="bg-purple-100 p-3 rounded-full">
                <Settings className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Full Customization</h3>
                <p className="text-slate-600">Complete control over appearance and behavior</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 max-w-2xl mx-auto">
          <h3 className="text-lg font-semibold text-slate-900 mb-3">Setup Process</h3>
          <div className="space-y-2 text-slate-600">
            <p>• Connect Google Drive for image storage</p>
            <p>• Configure directory branding and settings</p>
            <p>• Choose form integration method</p>
            <p>• Customize features and appearance</p>
            <p>• Generate and copy integration code</p>
          </div>
        </div>
      </div>
    </Slide>,

    // Slide 1: Google Drive Connection
    <Slide key={1}>
      <div className="text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-slate-900">Google Drive Setup</h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Connect your Google Drive to store and manage directory listing images securely.
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          {!googleDriveConnected ? (
            <div className="bg-white border border-slate-200 rounded-xl p-8 space-y-6">
              <div className="text-center space-y-4">
                <div className="bg-blue-100 p-4 rounded-full w-20 h-20 mx-auto flex items-center justify-center">
                  <FolderOpen className="w-10 h-10 text-blue-600" />
                </div>
                <h3 className="text-2xl font-semibold text-slate-900">Connect Google Drive</h3>
                <p className="text-slate-600">
                  Images uploaded to your directory will be stored in a dedicated "Directory Images" folder in your Google Drive.
                </p>
              </div>

              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">What happens when you connect:</h4>
                  <ul className="text-blue-800 space-y-1 text-left">
                    <li>• A "Directory Images" folder is created in your Google Drive</li>
                    <li>• Uploaded images are automatically organized by directory name</li>
                    <li>• Images remain in your control and ownership</li>
                    <li>• Public viewing links are generated for web display</li>
                  </ul>
                </div>

                <Button 
                  size="lg" 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  onClick={() => {
                    // Mock connection for demo
                    setGoogleDriveConnected(true);
                    setGoogleDriveEmail('user@example.com');
                  }}
                >
                  <ExternalLink className="w-5 h-5 mr-2" />
                  Connect Google Drive
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-xl p-8 space-y-6">
              <div className="text-center space-y-4">
                <div className="bg-green-100 p-4 rounded-full w-20 h-20 mx-auto flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-2xl font-semibold text-green-900">Google Drive Connected!</h3>
                <p className="text-green-700">
                  Connected to: <span className="font-medium">{googleDriveEmail}</span>
                </p>
              </div>

              <div className="bg-white border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-900 mb-2">Ready for image uploads:</h4>
                <ul className="text-green-800 space-y-1 text-left">
                  <li>• Directory Images folder created successfully</li>
                  <li>• Upload permissions configured</li>
                  <li>• Public sharing settings applied</li>
                  <li>• Ready to accept directory listings</li>
                </ul>
              </div>

              <Button 
                variant="outline" 
                size="lg" 
                className="w-full border-green-300 text-green-700 hover:bg-green-50"
                onClick={() => {
                  setGoogleDriveConnected(false);
                  setGoogleDriveEmail('');
                }}
              >
                Disconnect & Use Different Account
              </Button>
            </div>
          )}
        </div>
      </div>
    </Slide>,

    // Slide 2: Directory Configuration
    <Slide key={2}>
      <div className="space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-slate-900">Directory Configuration</h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Set up your directory branding and basic settings.
          </p>
        </div>

        <div className="max-w-4xl mx-auto grid lg:grid-cols-2 gap-8">
          {/* Left Column: Configuration */}
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="text-lg font-semibold text-slate-900">Directory Information</h3>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="directoryName">Directory Name</Label>
                    <Input
                      id="directoryName"
                      value={directoryName}
                      onChange={(e) => setDirectoryName(e.target.value)}
                      placeholder="e.g., Local Restaurants, Service Providers"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label>Custom Field Name</Label>
                    <Input
                      value={customFieldName}
                      onChange={(e) => setCustomFieldName(e.target.value)}
                      placeholder="listing"
                      className="mt-1"
                    />
                    <p className="text-sm text-slate-500 mt-1">
                      This hidden field will be added to forms to track which listing the submission came from.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="text-lg font-semibold text-slate-900">Logo Upload</h3>
                
                <div 
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    isDragOver 
                      ? 'border-blue-400 bg-blue-50' 
                      : 'border-slate-300 hover:border-slate-400'
                  }`}
                  onDrop={handleDrop}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                >
                  {logoUrl ? (
                    <div className="space-y-4">
                      <img 
                        src={logoUrl} 
                        alt="Directory logo"
                        className="mx-auto max-h-32 rounded-lg"
                      />
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
                        <p className="text-slate-600">
                          Drag and drop your logo here, or{' '}
                          <label className="text-blue-600 hover:text-blue-700 cursor-pointer underline">
                            browse
                            <input
                              type="file"
                              className="hidden"
                              accept="image/*"
                              onChange={handleFileSelect}
                            />
                          </label>
                        </p>
                        <p className="text-sm text-slate-500 mt-1">
                          PNG, JPG, GIF up to 10MB
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Preview */}
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Preview</h3>
                
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 space-y-4">
                  {logoUrl && (
                    <div className="text-center">
                      <img 
                        src={logoUrl} 
                        alt="Directory logo"
                        className="mx-auto max-h-16 rounded"
                      />
                    </div>
                  )}
                  
                  <div className="text-center">
                    <h4 className="text-xl font-bold text-slate-900">
                      {directoryName || 'Your Directory Name'}
                    </h4>
                    <p className="text-slate-600 mt-2">
                      Professional directory listing with lead capture forms
                    </p>
                  </div>

                  <div className="bg-white border border-slate-200 rounded p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Sample Business</span>
                      <span className="text-green-600">★ 4.8</span>
                    </div>
                    <p className="text-sm text-slate-600">
                      123 Main Street, Anytown
                    </p>
                    <Button size="sm" className="w-full">
                      Get More Info
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Slide>,

    // Slide 3: Form Integration Method Selection
    <Slide key={3}>
      <div className="space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-slate-900">Form Integration Method</h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Choose how visitors will interact with your directory listings.
          </p>
        </div>

        <div className="max-w-6xl mx-auto grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Action Button: Popup */}
          <Card className={`cursor-pointer transition-all ${buttonType === 'popup' ? 'ring-2 ring-blue-500 border-blue-500' : 'hover:shadow-lg'}`}>
            <CardContent className="p-6 space-y-4" onClick={() => setButtonType('popup')}>
              <div className="text-center">
                <div className="bg-blue-100 p-4 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                  <ExternalLink className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mt-4">Action Button: Popup</h3>
                <p className="text-slate-600 mt-2">
                  Opens form in overlay popup
                </p>
              </div>

              <div className="space-y-2 text-sm text-slate-600">
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-green-600" />
                  <span>Best user experience</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-green-600" />
                  <span>Keeps users on site</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-green-600" />
                  <span>Auto-fills product data</span>
                </div>
              </div>

              {buttonType === 'popup' && (
                <div className="bg-blue-50 border border-blue-200 rounded p-3">
                  <p className="text-blue-800 font-medium text-center">✓ Selected</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Button: Download */}
          <Card className={`cursor-pointer transition-all ${buttonType === 'download' ? 'ring-2 ring-green-500 border-green-500' : 'hover:shadow-lg'}`}>
            <CardContent className="p-6 space-y-4" onClick={() => setButtonType('download')}>
              <div className="text-center">
                <div className="bg-green-100 p-4 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                  <Download className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mt-4">Action Button: Download</h3>
                <p className="text-slate-600 mt-2">
                  Direct file download
                </p>
              </div>

              <div className="space-y-2 text-sm text-slate-600">
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-green-600" />
                  <span>Instant file access</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-green-600" />
                  <span>No form required</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-green-600" />
                  <span>Perfect for PDFs/files</span>
                </div>
              </div>

              {buttonType === 'download' && (
                <div className="bg-green-50 border border-green-200 rounded p-3">
                  <p className="text-green-800 font-medium text-center">✓ Selected</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Button: Redirect */}
          <Card className={`cursor-pointer transition-all ${buttonType === 'redirect' ? 'ring-2 ring-purple-500 border-purple-500' : 'hover:shadow-lg'}`}>
            <CardContent className="p-6 space-y-4" onClick={() => setButtonType('redirect')}>
              <div className="text-center">
                <div className="bg-purple-100 p-4 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                  <ArrowRight className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mt-4">Action Button: Redirect</h3>
                <p className="text-slate-600 mt-2">
                  Redirects to form page
                </p>
              </div>

              <div className="space-y-2 text-sm text-slate-600">
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-green-600" />
                  <span>Full screen form</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-green-600" />
                  <span>Simple implementation</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-green-600" />
                  <span>Auto-fills product data</span>
                </div>
              </div>

              {buttonType === 'redirect' && (
                <div className="bg-purple-50 border border-purple-200 rounded p-3">
                  <p className="text-purple-800 font-medium text-center">✓ Selected</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Embedded Form */}
          <Card className={`cursor-pointer transition-all ${buttonType === 'embedded' ? 'ring-2 ring-orange-500 border-orange-500' : 'hover:shadow-lg'}`}>
            <CardContent className="p-6 space-y-4" onClick={() => setButtonType('embedded')}>
              <div className="text-center">
                <div className="bg-orange-100 p-4 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
                  <Code className="w-8 h-8 text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mt-4">Embedded Form</h3>
                <p className="text-slate-600 mt-2">
                  Direct form integration
                </p>
              </div>

              <div className="space-y-2 text-sm text-slate-600">
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-green-600" />
                  <span>No clicks required</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-green-600" />
                  <span>Seamless experience</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-green-600" />
                  <span>Customizable placement</span>
                </div>
              </div>

              {buttonType === 'embedded' && (
                <div className="bg-orange-50 border border-orange-200 rounded p-3">
                  <p className="text-orange-800 font-medium text-center">✓ Selected</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Action Button Styling Section */}
        {(buttonType === 'popup' || buttonType === 'download' || buttonType === 'redirect') && (
          <div className="max-w-5xl mx-auto">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold text-slate-900 mb-6">Action Button Customization</h3>
                
                <div className="grid md:grid-cols-3 gap-8">
                  {/* Button Style */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-slate-900">Button Style</h4>
                    <div className="space-y-3">
                      {[
                        { value: 'solid', label: 'Solid' },
                        { value: 'outline', label: 'Outline' },
                        { value: 'ghost', label: 'Ghost' }
                      ].map((style) => (
                        <label key={style.value} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            name="buttonStyle"
                            value={style.value}
                            checked={buttonStyle === style.value}
                            onChange={(e) => setButtonStyle(e.target.value)}
                            className="text-indigo-600"
                          />
                          <span className="text-sm">{style.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Border Radius */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-slate-900">Border Radius</h4>
                    <select
                      value={borderRadius}
                      onChange={(e) => setBorderRadius(e.target.value)}
                      className="w-full p-3 border border-slate-300 rounded-lg"
                    >
                      <option value="0">None (0px)</option>
                      <option value="4">Small (4px)</option>
                      <option value="8">Medium (8px)</option>
                      <option value="12">Large (12px)</option>
                      <option value="20">Extra Large (20px)</option>
                      <option value="50">Pill (50px)</option>
                    </select>
                  </div>

                  {/* Button Preview */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-slate-900">Preview</h4>
                    <div className="flex flex-col space-y-3">
                      <button
                        className={`px-6 py-3 font-medium transition-colors text-center ${
                          buttonStyle === 'solid'
                            ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                            : buttonStyle === 'outline'
                            ? 'border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 bg-white'
                            : 'text-indigo-600 hover:bg-indigo-50 bg-transparent'
                        }`}
                        style={{ borderRadius: `${borderRadius}px` }}
                      >
                        {buttonType === 'popup' && 'Get Info'}
                        {buttonType === 'download' && 'Download'}
                        {buttonType === 'redirect' && 'Learn More'}
                      </button>
                      
                      <p className="text-xs text-slate-500 text-center">
                        Button will inherit your page colors
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Configuration Section */}
        <div className="max-w-3xl mx-auto">
          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="text-lg font-semibold text-slate-900">
                {buttonType === 'popup' && 'Popup Configuration'}
                {buttonType === 'redirect' && 'Redirect Configuration'}
                {buttonType === 'download' && 'Download Configuration'}
                {buttonType === 'embedded' && 'Embedded Form Configuration'}
              </h3>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="formEmbedUrl">
                    {buttonType === 'popup' && 'GoHighLevel Form Embed Code'}
                    {buttonType === 'redirect' && 'GoHighLevel Form URL'}
                    {buttonType === 'download' && 'Download File URL'}
                    {buttonType === 'embedded' && 'GoHighLevel Form Embed Code'}
                  </Label>
                  <Textarea
                    id="formEmbedUrl"
                    value={formEmbedUrl}
                    onChange={(e) => setFormEmbedUrl(e.target.value)}
                    placeholder={
                      buttonType === 'popup' 
                        ? 'Paste your GoHighLevel iframe embed code here...'
                        : buttonType === 'download'
                        ? 'Paste your direct download file URL here...'
                        : buttonType === 'embedded'
                        ? 'Paste your GoHighLevel iframe embed code here...'
                        : 'Paste your GoHighLevel form URL here...'
                    }
                    className="mt-1 h-24"
                  />
                </div>

                {(buttonType === 'popup' || buttonType === 'download' || buttonType === 'redirect') && (
                  <div>
                    <Label htmlFor="buttonText">Button Text</Label>
                    <Input
                      id="buttonText"
                      value={buttonText}
                      onChange={(e) => setButtonText(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                )}

                {/* Button Preview */}
                {(buttonType === 'popup' || buttonType === 'download' || buttonType === 'redirect') && (
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                    <h4 className="font-medium text-slate-900 mb-2">Button Preview</h4>
                    <button
                      className={`px-6 py-3 font-medium transition-colors ${
                        buttonStyle === 'solid'
                          ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                          : buttonStyle === 'outline'
                          ? 'border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 bg-white'
                          : 'text-indigo-600 hover:bg-indigo-50 bg-transparent'
                      }`}
                      style={{ borderRadius: `${borderRadius}px` }}
                    >
                      {buttonText}
                    </button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Slide>,

    // Slide 4: Feature Configuration
    <Slide key={4}>
      <div className="space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-slate-900">Feature Configuration</h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Choose which features to enable for your directory listings.
          </p>
        </div>

        <div className="max-w-5xl mx-auto space-y-6">
          {/* Main Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Expanded Description */}
            <Card className="group hover:shadow-lg transition-shadow">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <AlignLeft className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">Expanded Description</h3>
                      <p className="text-sm text-slate-600">Rich content below listings</p>
                    </div>
                  </div>
                  <Switch
                    checked={showDescription}
                    onCheckedChange={setShowDescription}
                  />
                </div>
                
                {showDescription && (
                  <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm">
                    <p className="text-blue-800">
                      ✓ Adds expandable content sections to listings with custom HTML support
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Metadata Bar */}
            <Card className="group hover:shadow-lg transition-shadow">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-purple-100 p-2 rounded-lg">
                      <Info className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">Metadata Bar</h3>
                      <p className="text-sm text-slate-600">Location, price, category info</p>
                    </div>
                  </div>
                  <Switch
                    checked={showMetadata}
                    onCheckedChange={setShowMetadata}
                  />
                </div>
                
                {showMetadata && (
                  <div className="bg-purple-50 border border-purple-200 rounded p-3 text-sm">
                    <p className="text-purple-800">
                      ✓ Displays structured metadata like location, price, and category
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Maps Integration */}
            <Card className="group hover:shadow-lg transition-shadow">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-green-100 p-2 rounded-lg">
                      <MapPin className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">Maps</h3>
                      <p className="text-sm text-slate-600">Google Maps integration</p>
                    </div>
                  </div>
                  <Switch
                    checked={showMaps}
                    onCheckedChange={setShowMaps}
                  />
                </div>
                
                {showMaps && (
                  <div className="bg-green-50 border border-green-200 rounded p-3 text-sm">
                    <p className="text-green-800">
                      ✓ Embeds interactive maps for location-based listings
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Price Display */}
            <Card className="group hover:shadow-lg transition-shadow">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-yellow-100 p-2 rounded-lg">
                      <DollarSign className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">Price Display</h3>
                      <p className="text-sm text-slate-600">Show pricing information</p>
                    </div>
                  </div>
                  <Switch
                    checked={showPrice}
                    onCheckedChange={setShowPrice}
                  />
                </div>
                
                {showPrice && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm">
                    <p className="text-yellow-800">
                      ✓ Displays pricing information for listings
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Buy Now Button */}
            <Card className="group hover:shadow-lg transition-shadow">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-red-100 p-2 rounded-lg">
                      <ShoppingBag className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">Buy Now Button</h3>
                      <p className="text-sm text-slate-600">Direct purchase option</p>
                    </div>
                  </div>
                  <Switch
                    checked={showBuyNowButton}
                    onCheckedChange={setShowBuyNowButton}
                  />
                </div>
                
                {showBuyNowButton && (
                  <div className="bg-red-50 border border-red-200 rounded p-3 text-sm">
                    <p className="text-red-800">
                      ✓ Adds Buy Now buttons with synchronized styling
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Add to Cart Button */}
            <Card className="group hover:shadow-lg transition-shadow">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-indigo-100 p-2 rounded-lg">
                      <ShoppingCart className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">Add to Cart</h3>
                      <p className="text-sm text-slate-600">Shopping cart integration</p>
                    </div>
                  </div>
                  <Switch
                    checked={showAddToCartButton}
                    onCheckedChange={setShowAddToCartButton}
                  />
                </div>
                
                {showAddToCartButton && (
                  <div className="bg-indigo-50 border border-indigo-200 rounded p-3 text-sm">
                    <p className="text-indigo-800">
                      ✓ Adds Add to Cart buttons with synchronized styling
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quantity Selector */}
            <Card className="group hover:shadow-lg transition-shadow">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-orange-100 p-2 rounded-lg">
                      <Hash className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">Quantity Selector</h3>
                      <p className="text-sm text-slate-600">Product quantity controls</p>
                    </div>
                  </div>
                  <Switch
                    checked={showQuantitySelector}
                    onCheckedChange={setShowQuantitySelector}
                  />
                </div>
                
                {showQuantitySelector && (
                  <div className="bg-orange-50 border border-orange-200 rounded p-3 text-sm">
                    <p className="text-orange-800">
                      ✓ Shows quantity input fields and controls
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Cart Icon */}
            <Card className="group hover:shadow-lg transition-shadow">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-teal-100 p-2 rounded-lg">
                      <ShoppingBag className="w-5 h-5 text-teal-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">Cart Icon</h3>
                      <p className="text-sm text-slate-600">Navigation cart icon visibility</p>
                    </div>
                  </div>
                  <Switch
                    checked={showCartIcon}
                    onCheckedChange={setShowCartIcon}
                  />
                </div>
                
                {showCartIcon && (
                  <div className="bg-teal-50 border border-teal-200 rounded p-3 text-sm">
                    <p className="text-teal-800">
                      ✓ Shows cart icon in navigation
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Advanced Options */}
          <Card>
            <CardContent className="p-6 space-y-6">
              <h3 className="text-lg font-semibold text-slate-900">Advanced Options</h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                {/* Cart Customization Toggle */}
                <div className="flex items-center justify-between p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <div>
                    <h4 className="font-semibold text-orange-900">Cart Page Customization</h4>
                    <p className="text-sm text-orange-700">
                      Hide checkout buttons, transform cart to bookmark system
                    </p>
                  </div>
                  <Switch
                    checked={showCartCustomization}
                    onCheckedChange={setShowCartCustomization}
                  />
                </div>

                {/* Price Removal Toggle */}
                <div className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div>
                    <h4 className="font-semibold text-red-900">Price Removal</h4>
                    <p className="text-sm text-red-700">
                      Hide all price elements across the site
                    </p>
                  </div>
                  <Switch
                    checked={showPriceRemoval}
                    onCheckedChange={setShowPriceRemoval}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Feature Summary */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Selected Features Summary</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { name: 'Expanded Description', enabled: showDescription, icon: AlignLeft },
                  { name: 'Metadata Bar', enabled: showMetadata, icon: Info },
                  { name: 'Maps', enabled: showMaps, icon: MapPin },
                  { name: 'Price Display', enabled: showPrice, icon: DollarSign },
                  { name: 'Buy Now Button', enabled: showBuyNowButton, icon: ShoppingBag },
                  { name: 'Add to Cart', enabled: showAddToCartButton, icon: ShoppingCart },
                  { name: 'Quantity Selector', enabled: showQuantitySelector, icon: Hash },
                  { name: 'Cart Icon', enabled: showCartIcon, icon: ShoppingBag },
                  { name: 'Cart Customization', enabled: showCartCustomization, icon: Settings },
                  { name: 'Price Removal', enabled: showPriceRemoval, icon: X }
                ].map((feature, index) => {
                  const IconComponent = feature.icon;
                  return (
                    <div
                      key={index}
                      className={`flex items-center space-x-2 p-3 rounded-lg ${
                        feature.enabled
                          ? 'bg-green-50 border border-green-200'
                          : 'bg-slate-50 border border-slate-200'
                      }`}
                    >
                      <IconComponent className={`w-4 h-4 ${
                        feature.enabled ? 'text-green-600' : 'text-slate-400'
                      }`} />
                      <span className={`text-sm ${
                        feature.enabled ? 'text-green-800 font-medium' : 'text-slate-500'
                      }`}>
                        {feature.name}
                      </span>
                      {feature.enabled && (
                        <Check className="w-4 h-4 text-green-600" />
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Slide>,

    // Slide 5: Button Customization
    <Slide key={5}>
      <div className="space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-slate-900">Button Customization</h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Customize the appearance of your directory action buttons.
          </p>
        </div>

        <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-8">
          {/* Left Column: Controls */}
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6 space-y-6">
                <h3 className="text-lg font-semibold text-slate-900">Button Styling</h3>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="buttonText">Button Text</Label>
                    <Input
                      id="buttonText"
                      value={buttonText}
                      onChange={(e) => setButtonText(e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="buttonColor">Button Color</Label>
                    <div className="flex space-x-2 mt-1">
                      <Input
                        id="buttonColor"
                        type="color"
                        value={previewColor}
                        onChange={(e) => setPreviewColor(e.target.value)}
                        className="w-16 h-10 p-1 rounded"
                      />
                      <Input
                        value={previewColor}
                        onChange={(e) => setPreviewColor(e.target.value)}
                        placeholder="#3b82f6"
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="textColor">Text Color</Label>
                    <div className="flex space-x-2 mt-1">
                      <Input
                        id="textColor"
                        type="color"
                        value={previewTextColor}
                        onChange={(e) => setPreviewTextColor(e.target.value)}
                        className="w-16 h-10 p-1 rounded"
                      />
                      <Input
                        value={previewTextColor}
                        onChange={(e) => setPreviewTextColor(e.target.value)}
                        placeholder="#ffffff"
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="borderRadius">Border Radius: {previewBorderRadius}px</Label>
                    <div className="mt-2">
                      <input
                        id="borderRadius"
                        type="range"
                        min="0"
                        max="20"
                        value={previewBorderRadius}
                        onChange={(e) => setPreviewBorderRadius(Number(e.target.value))}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-slate-500 mt-1">
                        <span>0px (Square)</span>
                        <span>20px (Rounded)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Color Presets */}
                <div>
                  <Label>Quick Color Presets</Label>
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {[
                      { bg: '#3b82f6', text: '#ffffff', name: 'Blue' },
                      { bg: '#10b981', text: '#ffffff', name: 'Green' },
                      { bg: '#f59e0b', text: '#ffffff', name: 'Orange' },
                      { bg: '#ef4444', text: '#ffffff', name: 'Red' },
                      { bg: '#8b5cf6', text: '#ffffff', name: 'Purple' },
                      { bg: '#06b6d4', text: '#ffffff', name: 'Cyan' },
                      { bg: '#000000', text: '#ffffff', name: 'Black' },
                      { bg: '#ffffff', text: '#000000', name: 'White' }
                    ].map((preset, index) => (
                      <button
                        key={index}
                        className="aspect-square rounded border-2 hover:scale-105 transition-transform"
                        style={{ 
                          backgroundColor: preset.bg,
                          borderColor: preset.bg === '#ffffff' ? '#e5e7eb' : preset.bg
                        }}
                        onClick={() => {
                          setPreviewColor(preset.bg);
                          setPreviewTextColor(preset.text);
                        }}
                        title={preset.name}
                      >
                        <span style={{ color: preset.text }} className="text-xs font-medium">
                          Aa
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Preview */}
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Live Preview</h3>
                
                <div className="space-y-6">
                  {/* Single Button Preview */}
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 text-center">
                    <h4 className="font-medium text-slate-900 mb-4">Primary Action Button</h4>
                    <button
                      style={{
                        backgroundColor: previewColor,
                        color: previewTextColor,
                        borderRadius: `${previewBorderRadius}px`
                      }}
                      className="px-6 py-3 font-medium transition-opacity hover:opacity-90 shadow-sm"
                    >
                      {buttonText}
                    </button>
                  </div>

                  {/* Multiple Buttons Preview (when applicable) */}
                  {(showBuyNowButton || showAddToCartButton) && (
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
                      <h4 className="font-medium text-slate-900 mb-4 text-center">Synchronized Button Group</h4>
                      <div className="flex flex-col space-y-2">
                        <button
                          style={{
                            backgroundColor: previewColor,
                            color: previewTextColor,
                            borderRadius: `${previewBorderRadius}px`
                          }}
                          className="px-4 py-2 font-medium transition-opacity hover:opacity-90 shadow-sm"
                        >
                          {buttonText}
                        </button>
                        
                        {showBuyNowButton && (
                          <button
                            style={{
                              backgroundColor: previewColor,
                              color: previewTextColor,
                              borderRadius: `${previewBorderRadius}px`
                            }}
                            className="px-4 py-2 font-medium transition-opacity hover:opacity-90 shadow-sm"
                          >
                            Buy Now
                          </button>
                        )}
                        
                        {showAddToCartButton && (
                          <button
                            style={{
                              backgroundColor: previewColor,
                              color: previewTextColor,
                              borderRadius: `${previewBorderRadius}px`
                            }}
                            className="px-4 py-2 font-medium transition-opacity hover:opacity-90 shadow-sm"
                          >
                            Add to Cart
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Listing Card Preview */}
                  <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
                    <h4 className="font-medium text-slate-900 text-center mb-4">In Directory Context</h4>
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="font-semibold text-slate-900">Sample Business</h5>
                        <p className="text-sm text-slate-600">123 Main Street</p>
                        {showPrice && (
                          <p className="text-lg font-bold text-green-600">$29.99</p>
                        )}
                      </div>
                      <div className="text-yellow-500">★★★★★</div>
                    </div>
                    <button
                      style={{
                        backgroundColor: previewColor,
                        color: previewTextColor,
                        borderRadius: `${previewBorderRadius}px`
                      }}
                      className="w-full px-4 py-2 font-medium transition-opacity hover:opacity-90 shadow-sm"
                    >
                      {buttonText}
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Slide>,

    // Slide 6: Header Code
    <Slide key={6}>
      <div className="space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-slate-900">Header Code</h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Copy this CSS code and paste it in your GoHighLevel page's header tracking code section.
          </p>
        </div>

        <div className="max-w-5xl mx-auto space-y-6">
          {/* Instructions */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Installation Instructions</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-medium text-slate-900">1. Copy the code below</h4>
                  <h4 className="font-medium text-slate-900">2. Go to your GoHighLevel page</h4>
                  <h4 className="font-medium text-slate-900">3. Open Settings → Tracking Code</h4>
                </div>
                <div className="space-y-3">
                  <h4 className="font-medium text-slate-900">4. Paste in Header section</h4>
                  <h4 className="font-medium text-slate-900">5. Save and publish</h4>
                  <h4 className="font-medium text-slate-900">6. Test on your live page</h4>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Code Display */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900">Header CSS Code</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(generatedCode?.headerCode || '', setHeaderCodeCopied)}
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
                      <span>Copy Code</span>
                    </>
                  )}
                </Button>
              </div>
              
              <div className="bg-slate-900 text-slate-100 p-4 rounded-lg h-96 overflow-auto">
                <pre className="text-sm whitespace-pre-wrap break-words overflow-wrap-anywhere">
                  {generatedCode?.headerCode || '/* Paste GoHighLevel form embed code in previous slide to generate CSS */'}
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Slide>,

    // Slide 7: Footer Code
    <Slide key={7}>
      <div className="space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-slate-900">Footer Code</h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Copy this JavaScript code and paste it in your GoHighLevel page's footer tracking code section.
          </p>
        </div>

        <div className="max-w-5xl mx-auto space-y-6">
          {/* Instructions */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Installation Instructions</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-medium text-slate-900">1. Copy the code below</h4>
                  <h4 className="font-medium text-slate-900">2. Go to your GoHighLevel page</h4>
                  <h4 className="font-medium text-slate-900">3. Open Settings → Tracking Code</h4>
                </div>
                <div className="space-y-3">
                  <h4 className="font-medium text-slate-900">4. Paste in Footer section</h4>
                  <h4 className="font-medium text-slate-900">5. Save and publish</h4>
                  <h4 className="font-medium text-slate-900">6. Test the popup functionality</h4>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Code Display */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900">Footer JavaScript Code</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(generatedCode?.footerCode || '', setFooterCodeCopied)}
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
                      <span>Copy Code</span>
                    </>
                  )}
                </Button>
              </div>
              
              <div className="bg-slate-900 text-slate-100 p-4 rounded-lg h-96 overflow-auto">
                <pre className="text-sm whitespace-pre-wrap break-words overflow-wrap-anywhere">
                  {generatedCode?.footerCode || '/* Paste GoHighLevel form embed code in slide 3 to generate JavaScript */'}
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Slide>,

    // Slide 8: CSS Utilities
    <Slide key={8}>
      <div className="space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-slate-900">CSS Utilities</h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Essential CSS fixes for GoHighLevel eCommerce pages and element visibility controls.
          </p>
        </div>

        <div className="max-w-5xl mx-auto space-y-6">
          {/* Essential Fixes */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900">Complete GoHighLevel CSS</h3>
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

/* Prevent 2-line limit on descriptions */
body:not(.hl-builder) .c-product-details p,
body:not(.hl-builder) .hl-product-detail-product-description,
body:not(.hl-builder) [class*="product-description"],
body:not(.hl-builder) .product-description,
body:not(.hl-builder) .description {
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

/* Force visibility on all containers and content */
body:not(.hl-builder) [class*="container"],
body:not(.hl-builder) [class*="wrapper"],
body:not(.hl-builder) [class*="content"],
body:not(.hl-builder) [class*="row"],
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

/* Enhanced product detail layout */
.product-detail-container {
  max-width: 1200px !important;
  margin: 0 auto !important;
}

/* Ensure full content visibility */
.hl-product-detail-product-name {
  display: block !important;
  white-space: normal !important;
  word-wrap: break-word !important;
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
</style>`}
                </pre>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                <h4 className="font-semibold text-blue-900 mb-2">What this fixes:</h4>
                <ul className="text-blue-800 space-y-1 text-sm">
                  <li>• Prevents text truncation in product titles</li>
                  <li>• Ensures full content visibility</li>
                  <li>• Improves responsive layout</li>
                  <li>• Hides elements based on your feature selections</li>
                  <li>• Works across all GoHighLevel themes</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Slide>,

    // Slide 9: Cart Page Customization (conditional)
    showCartCustomization ? (
      <Slide key={9}>
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-slate-900">Cart Page Customization</h1>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Transform your cart page into a bookmark system by hiding checkout elements.
            </p>
          </div>

          <div className="max-w-5xl mx-auto space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Cart Page CSS */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-slate-900">Cart Page CSS</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(cartPageCssCode, setCartPageCodeCopied)}
                      className="flex items-center space-x-2"
                    >
                      {cartPageCodeCopied ? (
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
                  
                  <div className="bg-slate-900 text-slate-100 p-4 rounded-lg h-64 overflow-auto">
                    <pre className="text-sm whitespace-pre-wrap break-words overflow-wrap-anywhere">
                      {cartPageCssCode}
                    </pre>
                  </div>
                </CardContent>
              </Card>

              {/* Cart Icon CSS */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-slate-900">Cart Icon Transform</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(cartIconCssCode, setCartIconCodeCopied)}
                      className="flex items-center space-x-2"
                    >
                      {cartIconCodeCopied ? (
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
                  
                  <div className="bg-slate-900 text-slate-100 p-4 rounded-lg h-64 overflow-auto">
                    <pre className="text-sm whitespace-pre-wrap break-words overflow-wrap-anywhere">
                      {cartIconCssCode}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Effects Description */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">What This Does</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h4 className="font-medium text-slate-900">Cart Page Changes:</h4>
                    <ul className="text-slate-600 space-y-1 text-sm">
                      <li>• Hides all price elements</li>
                      <li>• Removes checkout buttons</li>
                      <li>• Hides quantity selectors</li>
                      <li>• Adds "Saved for later" messages</li>
                    </ul>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-medium text-slate-900">Icon Changes:</h4>
                    <ul className="text-slate-600 space-y-1 text-sm">
                      <li>• Transforms cart icons to bookmarks</li>
                      <li>• Uses bookmark emoji for universal compatibility</li>
                      <li>• Maintains responsive design</li>
                      <li>• Works across all themes</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </Slide>
    ) : null,

    // Slide 10: Price Removal (conditional)
    showPriceRemoval ? (
      <Slide key={10}>
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-slate-900">Price Removal</h1>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Hide all pricing elements across your GoHighLevel site.
            </p>
          </div>

          <div className="max-w-4xl mx-auto space-y-6">
            {/* Price Removal CSS */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-900">Price Removal CSS</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(priceRemovalCssCode, setPriceRemovalCodeCopied)}
                    className="flex items-center space-x-2"
                  >
                    {priceRemovalCodeCopied ? (
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
                
                <div className="bg-slate-900 text-slate-100 p-4 rounded-lg h-32 overflow-auto">
                  <pre className="text-sm whitespace-pre-wrap break-words overflow-wrap-anywhere">
                    {priceRemovalCssCode}
                  </pre>
                </div>
              </CardContent>
            </Card>

            {/* Effects Description */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">What This Does</h3>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-medium text-red-900 mb-2">Price Elements Hidden:</h4>
                  <ul className="text-red-800 space-y-1 text-sm">
                    <li>• Product detail page prices</li>
                    <li>• Listing card prices</li>
                    <li>• General price elements</li>
                    <li>• Any element with "price" in the class name</li>
                  </ul>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                  <p className="text-blue-800 text-sm">
                    <strong>Note:</strong> This CSS targets common GoHighLevel price elements. 
                    If you notice any prices still showing, inspect the element and add its 
                    specific class to the CSS rule.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </Slide>
    ) : null,

    // Slide 11: Form Preview & Testing
    <Slide key={11}>
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
                    {showMetadata && metadataFields2.length > 0 && (
                      <li>• Metadata Fields: {metadataFields2.map(f => f.label).join(', ')}</li>
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

    // Slide 12: Summary & Completion
    <Slide key={12}>
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
            <h3 className="text-lg font-semibold text-blue-800 mb-4">Next Steps</h3>
            <ol className="text-blue-700 space-y-2 text-left">
              <li>1. Copy the header CSS code and add it to your GoHighLevel page</li>
              <li>2. Copy the footer JavaScript code and add it to your page</li>
              <li>3. Test the integration on your live site</li>
              <li>4. Start adding listings to your directory</li>
              <li>5. Monitor form submissions and leads</li>
            </ol>
          </div>
        </div>
      </div>
    </Slide>
  ].filter(Boolean);

  // Filter slides based on toggle states
  const slides = useMemo(() => {
    return allSlides.filter((slide, index) => {
      // Always show core slides
      return true;
    });
  }, [showCartCustomization, showPriceRemoval]);

  const totalSlides = slides.length;

  // Adjust current slide if it becomes invalid due to filtering
  useEffect(() => {
    if (currentSlide >= totalSlides) {
      setCurrentSlide(Math.max(0, totalSlides - 1));
    }
  }, [currentSlide, totalSlides]);

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