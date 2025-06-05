import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ChevronLeft, ChevronRight, Rocket, Settings, FileText, Download, FolderOpen, Building2, Upload, ExternalLink, Code, Copy, MapPin, AlignLeft, DollarSign, ShoppingBag, ShoppingCart, Hash, Check, X, CheckCircle2 as CheckCircle, Info } from 'lucide-react';

// Import working code generation functions
import { parseEmbedCode, ParsedEmbedData } from '@/lib/embed-parser';
import { generateActionButtonPopup } from '@/lib/custom-popup-generator';
import { generateEmbeddedFormCode } from '@/lib/embedded-form-generator';
import { generateExpandedDescriptionCode } from '@/lib/expanded-description-generator';
import { generateMetadataBarCode, MetadataField } from '@/lib/metadata-bar-generator';
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
  
  // Form configuration state (exact from working config wizard)
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

  // Component toggles (exact from working config wizard)
  const [showPrice, setShowPrice] = useState<boolean>(true);
  const [showBuyNowButton, setShowBuyNowButton] = useState<boolean>(true);
  const [showAddToCartButton, setShowAddToCartButton] = useState<boolean>(true);
  const [showQuantitySelector, setShowQuantitySelector] = useState<boolean>(true);
  const [showCartIcon, setShowCartIcon] = useState<boolean>(true);
  const [showDescription, setShowDescription] = useState<boolean>(false);
  const [showMetadata, setShowMetadata] = useState<boolean>(false);
  const [showMaps, setShowMaps] = useState<boolean>(false);
  
  // NEW: Additional toggle states for slideshow wizard
  const [showCartCustomization, setShowCartCustomization] = useState<boolean>(false);
  const [showPriceRemoval, setShowPriceRemoval] = useState<boolean>(false);
  
  // Expanded description configuration (exact from working config wizard)
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
  
  const [buttonText, setButtonText] = useState('Get More Info');
  
  // Metadata bar configuration (exact from working config wizard)
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

  // Copy states for new features
  const [cartPageCodeCopied, setCartPageCodeCopied] = useState<boolean>(false);
  const [cartIconCodeCopied, setCartIconCodeCopied] = useState<boolean>(false);
  const [priceRemovalCodeCopied, setPriceRemovalCodeCopied] = useState<boolean>(false);

  // Parse embed code for popup dimensions (exact from working config wizard)
  const parsedEmbedData = useMemo(() => {
    if (buttonType === 'popup' && formEmbedUrl) {
      return parseEmbedCode(formEmbedUrl);
    }
    return null;
  }, [buttonType, formEmbedUrl]);

  // Generate custom action button popup code (exact from working config wizard)
  const generateFullPopupCode = () => {
    if (buttonType === 'popup' && formEmbedUrl) {
      const result = generateActionButtonPopup({
        buttonText: buttonText,
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

  // Extract form URL from iframe embed code (exact from working config wizard)
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

  // NEW: Cart Page CSS for removing checkout buttons
  const cartPageCssCode = `/* 🛒 Hide price-related elements */
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

/* 🔢 Hide quantity section */
.hl-quantity-input-container {
  display: none !important;
}

/* 💵 Hide subtotal, total, and checkout elements */
.hl-amount-subtotal,
.cart-subtotal,
.cart-total,
.hl-checkout-btn {
  display: none !important;
}

/* 📌 Hide "My cart" heading */
.hl-cart-heading {
  display: none !important;
}`;

  // NEW: Cart Icon CSS for transforming to bookmark icon
  const cartIconCssCode = `/* Cart Icon Transformation CSS - Use on any page */
/* Transform cart icons to bookmark icons */
.hl-cart-icon,
.cart-icon,
[class*="cart-icon"],
i[class*="cart"],
.fa-shopping-cart,
.shopping-cart-icon {
  position: relative;
  overflow: hidden;
}

.hl-cart-icon::before,
.cart-icon::before,
[class*="cart-icon"]::before,
i[class*="cart"]::before,
.fa-shopping-cart::before,
.shopping-cart-icon::before {
  content: "🔖" !important;
  font-size: inherit;
  color: inherit;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: inherit;
  z-index: 2;
}

.hl-cart-icon > *,
.cart-icon > *,
[class*="cart-icon"] > *,
i[class*="cart"] > *,
.fa-shopping-cart > *,
.shopping-cart-icon > * {
  opacity: 0 !important;
  z-index: 1;
}`;

  // NEW: Price Removal CSS
  const priceRemovalCssCode = `/* 💰 Universal Price Removal CSS */
/* Hide all price-related elements on product pages */
.hl-product-detail-product-price,
.product-price,
.price,
.pricing,
.price-container,
.amount,
.cost,
span[class*="price"],
div[class*="price"],
span.text-black,
.text-price,
[data-price],
.price-display {
  display: none !important;
}

/* Hide currency symbols and price formatting */
.currency,
.dollar-sign,
.price-symbol,
[class*="currency"] {
  display: none !important;
}`;

  // Generate code based on selection (adapted from working config wizard)
  const generateCodeForSelection = () => {
    if (formEmbedUrl && formEmbedUrl.trim()) {
      if (buttonType === 'popup') {
        // Generate popup template
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

        // Combine all CSS including new features
        let combinedCSS = '';
        if (expandedDescCode.cssCode) combinedCSS += expandedDescCode.cssCode;
        if (metadataCode.cssCode) combinedCSS += '\n\n' + metadataCode.cssCode;
        if (showCartCustomization) combinedCSS += '\n\n' + cartPageCssCode + '\n\n' + cartIconCssCode;
        if (showPriceRemoval) combinedCSS += '\n\n' + priceRemovalCssCode;

        return {
          headerCode: (popupCode.headerCode || '/* Paste GoHighLevel iframe embed code to generate popup CSS */') + 
                     (combinedCSS ? '\n\n' + combinedCSS : ''),
          footerCode: (popupCode.footerCode || '/* Paste GoHighLevel iframe embed code to generate popup JavaScript */') + 
                     (expandedDescCode.jsCode ? '\n\n' + expandedDescCode.jsCode : '') +
                     (metadataCode.jsCode ? '\n\n' + metadataCode.jsCode : '')
        };
      } else {
        // Generate embedded form template
        const cleanFormUrl = extractFormUrl(formEmbedUrl);
        
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

        // Combine all CSS including new features
        let combinedCSS = embeddedFormCode.cssCode;
        if (expandedDescCode.cssCode) combinedCSS += '\n\n' + expandedDescCode.cssCode;
        if (metadataCode.cssCode) combinedCSS += '\n\n' + metadataCode.cssCode;
        if (showCartCustomization) combinedCSS += '\n\n' + cartPageCssCode + '\n\n' + cartIconCssCode;
        if (showPriceRemoval) combinedCSS += '\n\n' + priceRemovalCssCode;

        return {
          headerCode: combinedCSS,
          footerCode: embeddedFormCode.jsCode + 
                     (expandedDescCode.jsCode ? '\n\n' + expandedDescCode.jsCode : '') +
                     (metadataCode.jsCode ? '\n\n' + metadataCode.jsCode : '')
        };
      }
    }

    return { headerCode: '', footerCode: '' };
  };

  // Copy to clipboard function
  const copyToClipboard = async (text: string, setCopied: (value: boolean) => void) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  // Slide content definitions
  const slides = [
    // Slide 1: Welcome & Setup
    <Slide key="welcome">
      <div className="flex flex-col items-center text-center space-y-8 h-full justify-center">
        <div className="space-y-4">
          <Rocket className="w-16 h-16 text-blue-500 mx-auto" />
          <h1 className="text-4xl font-bold text-gray-900">GoHighLevel Directory Wizard</h1>
          <p className="text-xl text-gray-600 max-w-2xl">
            Create a professional directory with integrated lead capture forms and customizable styling
          </p>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-md">
          <h3 className="font-semibold text-blue-900 mb-2">What you'll create:</h3>
          <ul className="text-blue-800 text-sm space-y-1">
            <li>• Directory with Google Drive integration</li>
            <li>• Lead capture forms on every listing</li>
            <li>• Custom CSS for professional styling</li>
            <li>• Easy deployment to your GoHighLevel site</li>
          </ul>
        </div>

        <Button 
          onClick={() => setCurrentSlide(1)}
          size="lg"
          className="px-8 py-3 text-lg"
        >
          Get Started <ChevronRight className="ml-2 w-5 h-5" />
        </Button>
      </div>
    </Slide>,

    // Slide 2: Google Drive Setup  
    <Slide key="google-drive">
      <div className="space-y-8 h-full flex flex-col">
        <div className="text-center">
          <FolderOpen className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Connect Google Drive</h2>
          <p className="text-gray-600">Connect your Google Drive to automatically upload directory images</p>
        </div>

        <div className="flex-1 flex flex-col justify-center space-y-6">
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${googleDriveConnected ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <span className="font-medium">Google Drive Status</span>
                </div>
                <span className={`text-sm ${googleDriveConnected ? 'text-green-600' : 'text-gray-500'}`}>
                  {googleDriveConnected ? 'Connected' : 'Not Connected'}
                </span>
              </div>
              
              {googleDriveConnected && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-800">
                    <Check className="w-4 h-4 inline mr-2" />
                    Connected to: {googleDriveEmail}
                  </p>
                </div>
              )}

              <Button 
                onClick={() => {
                  setGoogleDriveConnected(true);
                  setGoogleDriveEmail('user@example.com');
                }}
                className="w-full"
                disabled={googleDriveConnected}
              >
                {googleDriveConnected ? 'Connected' : 'Connect Google Drive'}
              </Button>
            </div>
          </Card>

          <div className="text-center text-sm text-gray-500">
            <p>Your images will be uploaded to a "Directory Images" folder</p>
          </div>
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setCurrentSlide(0)}>
            <ChevronLeft className="mr-2 w-4 h-4" /> Back
          </Button>
          <Button 
            onClick={() => setCurrentSlide(2)}
            disabled={!googleDriveConnected}
          >
            Next <ChevronRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </div>
    </Slide>,

    // Slide 3: Directory Setup
    <Slide key="directory-setup">
      <div className="space-y-8 h-full flex flex-col">
        <div className="text-center">
          <Building2 className="w-12 h-12 text-purple-500 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Directory Settings</h2>
          <p className="text-gray-600">Configure your directory name and branding</p>
        </div>

        <div className="flex-1 space-y-6">
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="directory-name">Directory Name</Label>
                <Input
                  id="directory-name"
                  placeholder="e.g., Local Business Directory"
                  value={directoryName}
                  onChange={(e) => setDirectoryName(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="logo-upload">Directory Logo (Optional)</Label>
                <div 
                  className={`mt-1 border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                    isDragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
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
                    if (files[0] && files[0].type.startsWith('image/')) {
                      setLogoFile(files[0]);
                      setLogoUrl(URL.createObjectURL(files[0]));
                    }
                  }}
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) {
                        setLogoFile(file);
                        setLogoUrl(URL.createObjectURL(file));
                      }
                    };
                    input.click();
                  }}
                >
                  {logoUrl ? (
                    <div className="space-y-2">
                      <img src={logoUrl} alt="Logo preview" className="w-20 h-20 object-contain mx-auto" />
                      <p className="text-sm text-gray-600">Click to change logo</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto" />
                      <p className="text-gray-600">Drop your logo here or click to upload</p>
                      <p className="text-sm text-gray-500">PNG, JPG up to 5MB</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setCurrentSlide(1)}>
            <ChevronLeft className="mr-2 w-4 h-4" /> Back
          </Button>
          <Button 
            onClick={() => setCurrentSlide(3)}
            disabled={!directoryName.trim()}
          >
            Next <ChevronRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </div>
    </Slide>,

    // Slide 4: Integration Method
    <Slide key="integration-method">
      <div className="space-y-8 h-full flex flex-col">
        <div className="text-center">
          <Settings className="w-12 h-12 text-blue-500 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Integration Method</h2>
          <p className="text-gray-600">Choose how visitors will submit their information</p>
        </div>

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
                  <Settings className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="font-medium text-sm leading-tight">Action Button Popup</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-tight">Custom button triggers popup form</p>
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
                <div className="flex-1 min-w-0 text-left">
                  <p className="font-medium text-sm leading-tight">Direct Redirect</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-tight">Button redirects to external form</p>
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
                <div className="flex-1 min-w-0 text-left">
                  <p className="font-medium text-sm leading-tight">File Download</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-tight">Download form submissions as JSON</p>
                </div>
              </div>
            </Button>
            
            <Button
              variant={buttonType === 'embed' ? 'default' : 'outline'}
              className={`h-auto p-4 justify-start overflow-hidden ${
                buttonType === 'embed' ? 'bg-purple-50 border-purple-500 text-purple-900 hover:bg-purple-100' : 'hover:border-slate-400'
              }`}
              onClick={() => setButtonType('embed')}
            >
              <div className="flex items-start space-x-3 w-full min-w-0">
                <div className="bg-purple-500 text-white p-2 rounded-md flex-shrink-0">
                  <Code className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="font-medium text-sm leading-tight">Embedded Form</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-tight">Form appears directly on page</p>
                </div>
              </div>
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          {(buttonType === 'popup' || buttonType === 'embed') && (
            <Card className="p-6">
              <div className="space-y-2">
                <Label htmlFor="form-embed">
                  {buttonType === 'popup' ? 'GoHighLevel Iframe Embed Code' : 'GoHighLevel Form Embed Code'}
                </Label>
                <textarea
                  id="form-embed"
                  placeholder={buttonType === 'popup' 
                    ? '<iframe src="https://link.msgsndr.com/form/..." width="500" height="600"></iframe>'
                    : 'Paste your GoHighLevel form embed code here...'
                  }
                  value={formEmbedUrl}
                  onChange={(e) => setFormEmbedUrl(e.target.value)}
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  style={{ resize: 'vertical' }}
                />
                {buttonType === 'popup' && parsedEmbedData && (
                  <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
                    ✓ Form detected: {parsedEmbedData.width}×{parsedEmbedData.height}px 
                    → Popup will be {parsedEmbedData.width + 100}×{parsedEmbedData.height + 100}px (+100px spacing)
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setCurrentSlide(2)}>
            <ChevronLeft className="mr-2 w-4 h-4" /> Back
          </Button>
          <Button 
            onClick={() => setCurrentSlide(4)}
            disabled={(buttonType === 'popup' || buttonType === 'embed') && !formEmbedUrl.trim()}
          >
            Next <ChevronRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </div>
    </Slide>,

    // Slide 5: Features Selection
    <Slide key="features">
      <div className="space-y-8 h-full flex flex-col">
        <div className="text-center">
          <FileText className="w-12 h-12 text-indigo-500 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Optional Features</h2>
          <p className="text-gray-600">Customize your directory with additional features</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
          {/* Expanded Description */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <AlignLeft className="w-5 h-5 text-blue-500" />
                <div>
                  <h3 className="font-semibold">Expanded Description</h3>
                  <p className="text-sm text-gray-600">Add detailed product information</p>
                </div>
              </div>
              <Switch 
                checked={showDescription}
                onCheckedChange={setShowDescription}
              />
            </div>
            {showDescription && (
              <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
                ✓ Will add expandable content sections to listings
              </div>
            )}
          </Card>

          {/* Metadata Bar */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Info className="w-5 h-5 text-purple-500" />
                <div>
                  <h3 className="font-semibold">Contact Information</h3>
                  <p className="text-sm text-gray-600">Phone, hours, address, website</p>
                </div>
              </div>
              <Switch 
                checked={showMetadata}
                onCheckedChange={setShowMetadata}
              />
            </div>
            {showMetadata && (
              <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
                ✓ Will add contact info bar to listings
              </div>
            )}
          </Card>

          {/* Cart Page Customization */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <ShoppingCart className="w-5 h-5 text-orange-500" />
                <div>
                  <h3 className="font-semibold">Cart Page Customization</h3>
                  <p className="text-sm text-gray-600">Transform cart into bookmark system</p>
                </div>
              </div>
              <Switch 
                checked={showCartCustomization}
                onCheckedChange={setShowCartCustomization}
              />
            </div>
            {showCartCustomization && (
              <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
                ✓ Will hide prices and transform cart icons to bookmarks
              </div>
            )}
          </Card>

          {/* Price Removal */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <DollarSign className="w-5 h-5 text-red-500" />
                <div>
                  <h3 className="font-semibold">Price Removal</h3>
                  <p className="text-sm text-gray-600">Hide all price elements on product pages</p>
                </div>
              </div>
              <Switch 
                checked={showPriceRemoval}
                onCheckedChange={setShowPriceRemoval}
              />
            </div>
            {showPriceRemoval && (
              <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
                ✓ Will hide all pricing information on listings
              </div>
            )}
          </Card>
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setCurrentSlide(3)}>
            <ChevronLeft className="mr-2 w-4 h-4" /> Back
          </Button>
          <Button onClick={() => setCurrentSlide(5)}>
            Next <ChevronRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </div>
    </Slide>,

    // Slide 6: Generate & Deploy
    <Slide key="generate">
      <div className="space-y-8 h-full flex flex-col">
        <div className="text-center">
          <Code className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Generated Code</h2>
          <p className="text-gray-600">Copy and paste this code into your GoHighLevel site</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
          {/* Header/CSS Code */}
          <Card className="p-6 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Header Code (CSS)</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(generateCodeForSelection().headerCode, setHeaderCodeCopied)}
              >
                {headerCodeCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {headerCodeCopied ? 'Copied!' : 'Copy'}
              </Button>
            </div>
            <textarea
              value={generateCodeForSelection().headerCode}
              readOnly
              className="flex-1 min-h-[300px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
              placeholder="Configure your integration method and features to generate code..."
            />
          </Card>

          {/* Footer/JS Code */}
          <Card className="p-6 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Footer Code (JavaScript)</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(generateCodeForSelection().footerCode, setFooterCodeCopied)}
              >
                {footerCodeCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {footerCodeCopied ? 'Copied!' : 'Copy'}
              </Button>
            </div>
            <textarea
              value={generateCodeForSelection().footerCode}
              readOnly
              className="flex-1 min-h-[300px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
              placeholder="Configure your integration method and features to generate code..."
            />
          </Card>
        </div>

        {/* Additional CSS for enabled features */}
        {(showCartCustomization || showPriceRemoval) && (
          <div className="space-y-4">
            <h3 className="font-semibold">Additional Feature CSS</h3>
            
            {showCartCustomization && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-sm">Cart Page CSS</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(cartPageCssCode, setCartPageCodeCopied)}
                    >
                      {cartPageCodeCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    </Button>
                  </div>
                  <textarea
                    value={cartPageCssCode}
                    readOnly
                    className="w-full h-32 text-xs font-mono rounded border p-2"
                  />
                </Card>

                <Card className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-sm">Cart Icon CSS</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(cartIconCssCode, setCartIconCodeCopied)}
                    >
                      {cartIconCodeCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    </Button>
                  </div>
                  <textarea
                    value={cartIconCssCode}
                    readOnly
                    className="w-full h-32 text-xs font-mono rounded border p-2"
                  />
                </Card>
              </div>
            )}

            {showPriceRemoval && (
              <Card className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-sm">Price Removal CSS</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(priceRemovalCssCode, setPriceRemovalCodeCopied)}
                  >
                    {priceRemovalCodeCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  </Button>
                </div>
                <textarea
                  value={priceRemovalCssCode}
                  readOnly
                  className="w-full h-32 text-xs font-mono rounded border p-2"
                />
              </Card>
            )}
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h4 className="font-semibold text-blue-900 mb-2">Deployment Instructions:</h4>
          <ol className="text-blue-800 text-sm space-y-1">
            <li>1. Copy the Header Code and paste it in your GoHighLevel site's header</li>
            <li>2. Copy the Footer Code and paste it in your GoHighLevel site's footer</li>
            <li>3. Create your directory listings using the form at /form</li>
            <li>4. Test the integration on your live site</li>
          </ol>
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setCurrentSlide(4)}>
            <ChevronLeft className="mr-2 w-4 h-4" /> Back
          </Button>
          <Button onClick={() => setCurrentSlide(6)}>
            Directory Form <ChevronRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </div>
    </Slide>,

    // Slide 7: Directory Form
    <Slide key="form">
      <div className="space-y-6 h-full flex flex-col">
        <div className="text-center">
          <FileText className="w-12 h-12 text-blue-500 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Directory Form</h2>
          <p className="text-gray-600">Add listings to your directory</p>
        </div>

        <div className="flex-1 overflow-auto">
          <DirectoryForm />
        </div>

        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={() => setCurrentSlide(5)}>
            <ChevronLeft className="mr-2 w-4 h-4" /> Back to Code
          </Button>
          <Button onClick={() => setCurrentSlide(0)}>
            Start Over <Rocket className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </div>
    </Slide>
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Progress indicator */}
      <div className="fixed top-0 left-0 w-full bg-white border-b z-50">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-600">Step {currentSlide + 1} of {slides.length}</span>
            </div>
            <div className="flex-1 mx-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentSlide + 1) / slides.length) * 100}%` }}
                ></div>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              {['Setup', 'Drive', 'Directory', 'Integration', 'Features', 'Code', 'Form'][currentSlide]}
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="pt-20">
        {slides[currentSlide]}
      </div>

      {/* Navigation dots */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2">
        <div className="flex space-x-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-colors ${
                index === currentSlide ? 'bg-blue-500' : 'bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}