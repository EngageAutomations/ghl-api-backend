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

/* 🛒 Hide checkout and purchase buttons */
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

/* 🛒 Hide quantity controls on cart page */
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

/* 🛒 Style saved items message */
.cart-item,
.hl-cart-item {
    position: relative;
}

.cart-item::after,
.hl-cart-item::after {
    content: "📋 Saved for later";
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
  const cartIconCssCode = `/* 🔖 Transform cart icons to bookmark icons */

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

  const totalSlides = 11;

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