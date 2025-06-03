import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Rocket, Settings, FileText, Download, FolderOpen, Building2, Upload, ExternalLink, Code, Copy, MapPin, AlignLeft, DollarSign, ShoppingBag, ShoppingCart, Hash } from 'lucide-react';

// Import proven code generation functions from config wizard
import { parseEmbedCode, ParsedEmbedData } from '@/lib/embed-parser';
import { generateActionButtonPopup } from '@/lib/custom-popup-generator';
import { generateEmbeddedFormCode } from '@/lib/embedded-form-generator';
import { generateExpandedDescriptionCode } from '@/lib/expanded-description-generator';
import { generateMetadataBarCode, MetadataField } from '@/lib/metadata-bar-generator';

interface SlideProps {
  children: React.ReactNode;
  className?: string;
}

function Slide({ children, className = "" }: SlideProps) {
  return (
    <div className={`min-h-[600px] flex flex-col justify-center items-center p-8 ${className}`}>
      <div className="w-full max-w-6xl mx-auto bg-white border border-white/30 rounded-2xl p-8 shadow-lg">
        {children}
      </div>
    </div>
  );
}

export default function ConfigWizardSlideshow() {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  // Slideshow-specific state
  const [googleDriveConnected, setGoogleDriveConnected] = useState(false);
  const [directoryName, setDirectoryName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  
  // Form configuration state (copied from config wizard)
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

  // Feature toggles (copied from config wizard)
  const [showDescription, setShowDescription] = useState<boolean>(false);
  const [showMetadata, setShowMetadata] = useState<boolean>(false);
  const [showMaps, setShowMaps] = useState<boolean>(false);
  const [showPrice, setShowPrice] = useState<boolean>(false);
  const [showBuyNowButton, setShowBuyNowButton] = useState<boolean>(false);
  const [showAddToCartButton, setShowAddToCartButton] = useState<boolean>(false);
  const [showQuantitySelector, setShowQuantitySelector] = useState<boolean>(false);
  const [showCartIcon, setShowCartIcon] = useState<boolean>(true);
  const [convertCartToBookmarks, setConvertCartToBookmarks] = useState<boolean>(false);

  // Expanded description settings
  const [expandedDescriptionContent, setExpandedDescriptionContent] = useState<string>(`<h2>Product Details</h2>
<p>This is enhanced content that appears below the main product details.</p>
<p><strong>Key Features:</strong></p>
<ul>
  <li>Professional quality and service</li>
  <li>Local expertise and knowledge</li>
  <li>Competitive pricing and value</li>
</ul>`);
  const [expandedDescFadeIn, setExpandedDescFadeIn] = useState<boolean>(true);
  const [expandedDescClass, setExpandedDescClass] = useState<string>('expanded-description');

  // Metadata settings
  const [metadataTextColor, setMetadataTextColor] = useState<string>('#374151');
  const [metadataFont, setMetadataFont] = useState<string>('system-ui, sans-serif');
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

  // Parse embed code for popup dimensions (copied from config wizard)
  const parsedEmbedData = useMemo(() => {
    if (buttonType === 'popup' && formEmbedUrl) {
      return parseEmbedCode(formEmbedUrl);
    }
    return null;
  }, [buttonType, formEmbedUrl]);

  // Generate custom action button popup code (copied from config wizard)
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

  // Extract form URL from iframe embed code (copied from config wizard)
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

  // Generate element hiding CSS (comprehensive version from original slideshow)
  const generateElementHidingCSS = () => {
    let css = `<style>
/* GoHighLevel Essential Fixes - Always Applied */
body:not(.hl-builder) * { 
  text-overflow: unset !important; 
  -webkit-line-clamp: unset !important; 
  white-space: normal !important;
  overflow: visible !important;
}

body:not(.hl-builder) [class*="product-title"],
body:not(.hl-builder) [class*="product-name"],
body:not(.hl-builder) .hl-product-detail-product-name {
  white-space: normal !important;
  overflow: visible !important;
  text-overflow: unset !important;
  -webkit-line-clamp: unset !important;
  max-height: none !important;
  height: auto !important;
}`;

    // Add element hiding CSS based on feature toggles
    if (!showPrice) {
      css += `

/* Hide Price Display */
body:not(.hl-builder) .cstore-product-detail [class*="price"],
body:not(.hl-builder) .product-detail-container [class*="price"],
body:not(.hl-builder) .hl-product-price,
body:not(.hl-builder) .hl-product-detail-product-price,
body:not(.hl-builder) p.hl-product-detail-product-price {
  display: none !important;
  visibility: hidden !important;
  opacity: 0 !important;
}`;
    }

    if (!showBuyNowButton) {
      css += `

/* Hide Buy Now Button */
body:not(.hl-builder) .cstore-product-detail [class*="buy-now"],
body:not(.hl-builder) .product-detail-container [class*="buy-now"],
body:not(.hl-builder) .hl-buy-now-button,
body:not(.hl-builder) button[class*="buy-now"] {
  display: none !important;
  visibility: hidden !important;
  opacity: 0 !important;
}`;
    }

    if (!showAddToCartButton) {
      css += `

/* Hide Add to Cart Button */
body:not(.hl-builder) .cstore-product-detail [class*="add-to-cart"],
body:not(.hl-builder) .product-detail-container [class*="add-to-cart"],
body:not(.hl-builder) .hl-add-to-cart-button,
body:not(.hl-builder) button[class*="add-to-cart"],
body:not(.hl-builder) .hl-product-cart-button,
body:not(.hl-builder) [class*="add-cart"],
body:not(.hl-builder) #add-to-cart-btn,
body:not(.hl-builder) .primary-btn {
  display: none !important;
  visibility: hidden !important;
  opacity: 0 !important;
}`;
    }

    if (!showQuantitySelector) {
      css += `

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
}`;
    }

    if (!showCartIcon) {
      css += `

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
}`;
    }

    css += `
</style>`;

    return css;
  };

  // Generate code based on selection (copied from config wizard)
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

        // Combine element hiding CSS with popup code
        const elementHidingCSS = generateElementHidingCSS();
        
        return {
          headerCode: elementHidingCSS + '\n\n' + 
                     (popupCode.headerCode || '/* Paste GoHighLevel iframe embed code to generate popup CSS */') + 
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

        // Combine element hiding CSS with embedded form code
        const elementHidingCSS = generateElementHidingCSS();
        
        return {
          headerCode: elementHidingCSS + '\n\n' + embeddedFormCode.cssCode + 
                     (expandedDescCode.cssCode ? '\n\n' + expandedDescCode.cssCode : '') +
                     (metadataCode.cssCode ? '\n\n' + metadataCode.cssCode : ''),
          footerCode: embeddedFormCode.jsCode + 
                     (expandedDescCode.jsCode ? '\n\n' + expandedDescCode.jsCode : '') +
                     (metadataCode.jsCode ? '\n\n' + metadataCode.jsCode : '')
        };
      }
    } else {
      // Default directory listing template when no form URL is provided
      const expandedDescCode = generateExpandedDescriptionCode({
        enabled: showDescription,
        content: expandedDescriptionContent,
        fadeInAnimation: expandedDescFadeIn,
        customClass: expandedDescClass
      });

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

      // Combine element hiding CSS with directory listing template
      const elementHidingCSS = generateElementHidingCSS();
      
      return {
        headerCode: elementHidingCSS + `

<style>
/* GoHighLevel Directory Listing Enhancements */
.ghl-listing-button {
  background-color: ${previewColor};
  color: ${previewTextColor};
  border-radius: ${previewBorderRadius}px;
  padding: 0.5rem 1rem;
  transition: all 0.2s ease;
}
</style>` + (expandedDescCode.cssCode ? '\n\n' + expandedDescCode.cssCode : '') +
    (metadataCode.cssCode ? '\n\n' + metadataCode.cssCode : ''),
        footerCode: `<script>
// Directory Integration Script
document.addEventListener('DOMContentLoaded', function() {
  const forms = document.querySelectorAll('form');
  forms.forEach(form => {
    const hiddenField = document.createElement('input');
    hiddenField.type = 'hidden';
    hiddenField.name = '${customFieldName}';
    hiddenField.value = window.location.pathname.split('/').pop();
    form.appendChild(hiddenField);
  });
});
</script>` + (expandedDescCode.jsCode ? '\n\n' + expandedDescCode.jsCode : '') +
         (metadataCode.jsCode ? '\n\n' + metadataCode.jsCode : '')
      };
    }
  };

  // Copy to clipboard helper
  const copyToClipboard = async (text: string, setCopied: (value: boolean) => void) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  // Generate final code
  const generatedCode = useMemo(() => {
    return generateCodeForSelection();
  }, [buttonType, formEmbedUrl, customFieldName, previewColor, previewTextColor, previewBorderRadius, showDescription, showMetadata, showMaps, showPrice, showBuyNowButton, showAddToCartButton, showQuantitySelector, showCartIcon, convertCartToBookmarks, expandedDescriptionContent, expandedDescFadeIn, expandedDescClass, metadataFields, metadataTextColor, metadataFont]);

  // File upload handlers
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      setLogoFile(imageFile);
      const url = URL.createObjectURL(imageFile);
      setLogoUrl(url);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setLogoFile(file);
      const url = URL.createObjectURL(file);
      setLogoUrl(url);
    }
  };

  const handleDragEvents = (e: React.DragEvent, isDragOver: boolean) => {
    e.preventDefault();
    setIsDragOver(isDragOver);
  };

  // Navigation handlers
  const goToNextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(prev => prev + 1);
    }
  };

  const goToPrevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
    }
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  // Define slides
  const slides = [
    // Slide 1: Welcome
    <Slide key="welcome">
      <div className="text-center space-y-6">
        <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
          <Rocket className="w-10 h-10 text-white" />
        </div>
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome to GoHighLevel CSS Generator</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Create professional directory listings with advanced form integration, 
            enhanced UI elements, and custom styling options.
          </p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-2xl mx-auto">
          <h3 className="font-semibold text-blue-900 mb-2">What You'll Build:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-blue-800">
            <div className="flex items-center space-x-2">
              <Code className="w-4 h-4" />
              <span>Action Button Popups</span>
            </div>
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>Embedded Forms</span>
            </div>
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4" />
              <span>Metadata Bars with Maps</span>
            </div>
            <div className="flex items-center space-x-2">
              <AlignLeft className="w-4 h-4" />
              <span>Expanded Descriptions</span>
            </div>
          </div>
        </div>
      </div>
    </Slide>,

    // Slide 2: Directory Setup
    <Slide key="directory-setup">
      <div className="space-y-6">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-xl flex items-center justify-center mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Directory Information</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Set up your directory name and logo to personalize your listings.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Directory Name */}
          <div className="space-y-4">
            <Label htmlFor="directory-name" className="text-sm font-medium">Directory Name</Label>
            <Input
              id="directory-name"
              placeholder="My Business Directory"
              value={directoryName}
              onChange={(e) => setDirectoryName(e.target.value)}
              className="w-full"
            />
            <p className="text-sm text-gray-500">This will appear in your generated code as a reference.</p>
          </div>

          {/* Logo Upload */}
          <div className="space-y-4">
            <Label className="text-sm font-medium">Directory Logo</Label>
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                isDragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
              }`}
              onDrop={handleDrop}
              onDragOver={(e) => handleDragEvents(e, true)}
              onDragLeave={(e) => handleDragEvents(e, false)}
            >
              {logoFile ? (
                <div className="space-y-2">
                  <img src={logoUrl} alt="Logo preview" className="mx-auto h-16 w-16 object-cover rounded" />
                  <p className="text-sm text-gray-600">{logoFile.name}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="text-sm text-gray-600">Drop an image here or click to browse</p>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="logo-upload"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => document.getElementById('logo-upload')?.click()}
              >
                Choose File
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Slide>,

    // Slide 3: Integration Method
    <Slide key="integration-method">
      <div className="space-y-6">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mb-4">
            <Settings className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Choose Integration Method</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Select how you want to integrate GoHighLevel forms into your directory listings.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
          <div 
            className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
              buttonType === 'popup' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
            onClick={() => setButtonType('popup')}
          >
            <div className="flex items-center space-x-3">
              <div className="bg-blue-500 text-white p-2 rounded-md">
                <ExternalLink className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-medium">Action Button (Popup)</h3>
                <p className="text-sm text-gray-500">Opens form in a popup overlay</p>
              </div>
            </div>
          </div>

          <div 
            className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
              buttonType === 'embed' ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
            onClick={() => setButtonType('embed')}
          >
            <div className="flex items-center space-x-3">
              <div className="bg-green-500 text-white p-2 rounded-md">
                <Code className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-medium">Embedded Form</h3>
                <p className="text-sm text-gray-500">Shows form directly on page</p>
              </div>
            </div>
          </div>

          <div 
            className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
              buttonType === 'redirect' ? 'border-orange-500 bg-orange-50' : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
            onClick={() => setButtonType('redirect')}
          >
            <div className="flex items-center space-x-3">
              <div className="bg-orange-500 text-white p-2 rounded-md">
                <ExternalLink className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-medium">Redirect Button</h3>
                <p className="text-sm text-gray-500">Redirects to external form</p>
              </div>
            </div>
          </div>

          <div 
            className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
              buttonType === 'download' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
            onClick={() => setButtonType('download')}
          >
            <div className="flex items-center space-x-3">
              <div className="bg-purple-500 text-white p-2 rounded-md">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-medium">Download Link</h3>
                <p className="text-sm text-gray-500">Triggers file download</p>
              </div>
            </div>
          </div>
        </div>

        {/* Form URL Input */}
        <div className="max-w-2xl mx-auto space-y-4">
          <Label htmlFor="form-url" className="text-sm font-medium">
            {buttonType === 'popup' ? 'GoHighLevel Form URL or Embed Code' : 
             buttonType === 'embed' ? 'GoHighLevel Form URL or Embed Code' :
             buttonType === 'redirect' ? 'External Form URL' :
             'Download File URL'}
          </Label>
          <Input
            id="form-url"
            placeholder={
              buttonType === 'popup' ? 'Paste your GoHighLevel iframe embed code or form URL' :
              buttonType === 'embed' ? 'Paste your GoHighLevel iframe embed code or form URL' :
              buttonType === 'redirect' ? 'https://your-external-form.com' :
              'https://your-download-link.com/file.pdf'
            }
            value={formEmbedUrl}
            onChange={(e) => setFormEmbedUrl(e.target.value)}
            className="w-full"
          />
          <p className="text-sm text-gray-500">
            {buttonType === 'popup' || buttonType === 'embed' 
              ? 'You can paste either the full iframe embed code or just the form URL.'
              : 'Enter the complete URL where users should be redirected.'
            }
          </p>
        </div>

        {/* Custom Field Name */}
        <div className="max-w-2xl mx-auto space-y-4">
          <Label htmlFor="field-name" className="text-sm font-medium">Custom Field Name</Label>
          <Input
            id="field-name"
            placeholder="listing"
            value={customFieldName}
            onChange={(e) => setCustomFieldName(e.target.value)}
            className="w-full"
          />
          <p className="text-sm text-gray-500">
            This field will automatically capture the listing identifier for tracking purposes.
          </p>
        </div>
      </div>
    </Slide>,

    // Slide 4: Feature Options
    <Slide key="feature-options">
      <div className="space-y-6">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center mb-4">
            <Hash className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Feature Options</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Enable additional features to enhance your directory listings.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* Enhanced Description */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <AlignLeft className="w-5 h-5 text-blue-500" />
                  <h3 className="font-medium">Enhanced Description</h3>
                </div>
                <Switch
                  checked={showDescription}
                  onCheckedChange={setShowDescription}
                />
              </div>
              <p className="text-sm text-gray-500 mb-3">
                Add expandable content sections below listings
              </p>
              {showDescription && (
                <div className="text-sm text-green-600">
                  ✓ Enhanced content will be added
                </div>
              )}
            </CardContent>
          </Card>

          {/* Metadata Bar */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <Hash className="w-5 h-5 text-green-500" />
                  <h3 className="font-medium">Metadata Bar</h3>
                </div>
                <Switch
                  checked={showMetadata}
                  onCheckedChange={setShowMetadata}
                />
              </div>
              <p className="text-sm text-gray-500 mb-3">
                Display contact info, hours, and location
              </p>
              {showMetadata && (
                <div className="text-sm text-green-600">
                  ✓ Contact info bar will be added
                </div>
              )}
            </CardContent>
          </Card>

          {/* Google Maps */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <MapPin className="w-5 h-5 text-red-500" />
                  <h3 className="font-medium">Google Maps</h3>
                </div>
                <Switch
                  checked={showMaps}
                  onCheckedChange={setShowMaps}
                />
              </div>
              <p className="text-sm text-gray-500 mb-3">
                Enable location-based mapping features
              </p>
              {showMaps && (
                <div className="text-sm text-green-600">
                  ✓ Maps integration will be added
                </div>
              )}
            </CardContent>
          </Card>

          {/* E-commerce Options */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <DollarSign className="w-5 h-5 text-green-500" />
                  <h3 className="font-medium">Price Display</h3>
                </div>
                <Switch
                  checked={showPrice}
                  onCheckedChange={setShowPrice}
                />
              </div>
              <p className="text-sm text-gray-500 mb-3">
                Show/hide product prices on listings
              </p>
              {showPrice && (
                <div className="text-sm text-green-600">
                  ✓ Product prices will be visible
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <ShoppingBag className="w-5 h-5 text-purple-500" />
                  <h3 className="font-medium">Buy Now Button</h3>
                </div>
                <Switch
                  checked={showBuyNowButton}
                  onCheckedChange={setShowBuyNowButton}
                />
              </div>
              <p className="text-sm text-gray-500 mb-3">
                Show/hide buy now buttons on listings
              </p>
              {showBuyNowButton && (
                <div className="text-sm text-green-600">
                  ✓ Buy now buttons will be visible
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <ShoppingCart className="w-5 h-5 text-indigo-500" />
                  <h3 className="font-medium">Add to Cart</h3>
                </div>
                <Switch
                  checked={showAddToCartButton}
                  onCheckedChange={setShowAddToCartButton}
                />
              </div>
              <p className="text-sm text-gray-500 mb-3">
                Show/hide add to cart functionality
              </p>
              {showAddToCartButton && (
                <div className="text-sm text-green-600">
                  ✓ Add to cart buttons will be visible
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <Hash className="w-5 h-5 text-yellow-500" />
                  <h3 className="font-medium">Quantity Selector</h3>
                </div>
                <Switch
                  checked={showQuantitySelector}
                  onCheckedChange={setShowQuantitySelector}
                />
              </div>
              <p className="text-sm text-gray-500 mb-3">
                Show/hide quantity selection controls
              </p>
              {showQuantitySelector && (
                <div className="text-sm text-green-600">
                  ✓ Quantity selectors will be visible
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <ShoppingCart className="w-5 h-5 text-blue-500" />
                  <h3 className="font-medium">Cart Icon</h3>
                </div>
                <Switch
                  checked={showCartIcon}
                  onCheckedChange={setShowCartIcon}
                />
              </div>
              <p className="text-sm text-gray-500 mb-3">
                Show/hide navigation cart icon
              </p>
              {showCartIcon && (
                <div className="text-sm text-green-600">
                  ✓ Cart icon will be visible in navigation
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Slide>,

    // Slide 5: CSS Code
    <Slide key="css-code">
      <div className="space-y-6">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mb-4">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">CSS Code</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Your custom CSS for element hiding and essential GoHighLevel fixes.
          </p>
        </div>

        <Card className="max-w-6xl mx-auto">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium flex items-center space-x-2">
                <FileText className="w-5 h-5" />
                <span>CSS Code</span>
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(generateElementHidingCSS(), setCssCodeCopied)}
                className="flex items-center space-x-2"
              >
                <Copy className="w-4 h-4" />
                <span>{cssCodeCopied ? 'Copied!' : 'Copy'}</span>
              </Button>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <pre className="text-sm overflow-x-auto max-h-96 whitespace-pre-wrap">
                <code>{generateElementHidingCSS()}</code>
              </pre>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Paste this CSS code in the CSS section of your GoHighLevel page for element hiding and essential fixes.
            </p>
          </CardContent>
        </Card>

        <div className="max-w-4xl mx-auto">
          <h3 className="font-medium mb-4">What this CSS does:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Essential Fixes</h4>
              <ul className="text-blue-800 space-y-1">
                <li>• Prevents text truncation</li>
                <li>• Fixes product title display</li>
                <li>• Removes line clamping</li>
              </ul>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-green-900 mb-2">Element Hiding</h4>
              <ul className="text-green-800 space-y-1">
                <li>• {showPrice ? 'Shows' : 'Hides'} product prices</li>
                <li>• {showBuyNowButton ? 'Shows' : 'Hides'} buy now buttons</li>
                <li>• {showAddToCartButton ? 'Shows' : 'Hides'} add to cart buttons</li>
                <li>• {showQuantitySelector ? 'Shows' : 'Hides'} quantity selectors</li>
                <li>• {showCartIcon ? 'Shows' : 'Hides'} navigation cart icon</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Slide>,

    // Slide 6: Generated Code
    <Slide key="generated-code">
      <div className="space-y-6">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl flex items-center justify-center mb-4">
            <Code className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Header & Footer Code</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Your advanced integration code with action buttons, forms, and enhanced features.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-7xl mx-auto">
          {/* Header Code */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium flex items-center space-x-2">
                  <FileText className="w-5 h-5" />
                  <span>Header Code</span>
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(generatedCode.headerCode, setHeaderCodeCopied)}
                  className="flex items-center space-x-2"
                >
                  <Copy className="w-4 h-4" />
                  <span>{headerCodeCopied ? 'Copied!' : 'Copy'}</span>
                </Button>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <pre className="text-sm overflow-x-auto max-h-96 whitespace-pre-wrap">
                  <code>{generatedCode.headerCode}</code>
                </pre>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Paste this code in the Header Tracking Code section of your GoHighLevel page.
              </p>
            </CardContent>
          </Card>

          {/* Footer Code */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium flex items-center space-x-2">
                  <Code className="w-5 h-5" />
                  <span>Footer Code</span>
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(generatedCode.footerCode, setFooterCodeCopied)}
                  className="flex items-center space-x-2"
                >
                  <Copy className="w-4 h-4" />
                  <span>{footerCodeCopied ? 'Copied!' : 'Copy'}</span>
                </Button>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <pre className="text-sm overflow-x-auto max-h-96 whitespace-pre-wrap">
                  <code>{generatedCode.footerCode}</code>
                </pre>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Paste this code in the Footer Tracking Code section of your GoHighLevel page.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Configuration Summary */}
        <Card className="max-w-4xl mx-auto">
          <CardContent className="p-6">
            <h3 className="font-medium mb-4">Configuration Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Directory:</span>
                <div className="font-medium">{directoryName || 'Not specified'}</div>
              </div>
              <div>
                <span className="text-gray-500">Integration:</span>
                <div className="font-medium capitalize">{buttonType}</div>
              </div>
              <div>
                <span className="text-gray-500">Enhanced Description:</span>
                <div className="font-medium">{showDescription ? 'Enabled' : 'Disabled'}</div>
              </div>
              <div>
                <span className="text-gray-500">Metadata Bar:</span>
                <div className="font-medium">{showMetadata ? 'Enabled' : 'Disabled'}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Slide>
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-25"></div>
      
      {/* Header */}
      <div className="relative z-10 bg-white/80 backdrop-blur-sm border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Rocket className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">GoHighLevel CSS Generator</h1>
                <p className="text-sm text-gray-500">Slideshow Configuration Wizard</p>
              </div>
            </div>

            {/* Progress Indicators */}
            <div className="flex items-center space-x-2">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`w-3 h-3 rounded-full transition-all ${
                    index === currentSlide
                      ? 'bg-blue-500 scale-110'
                      : index < currentSlide
                      ? 'bg-green-500'
                      : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10">
        {slides[currentSlide]}
      </div>

      {/* Navigation */}
      <div className="relative z-10 bg-white/80 backdrop-blur-sm border-t border-white/20">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={goToPrevSlide}
              disabled={currentSlide === 0}
              className="flex items-center space-x-2"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </Button>

            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>Step {currentSlide + 1} of {slides.length}</span>
            </div>

            <Button
              onClick={goToNextSlide}
              disabled={currentSlide === slides.length - 1}
              className="flex items-center space-x-2"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}