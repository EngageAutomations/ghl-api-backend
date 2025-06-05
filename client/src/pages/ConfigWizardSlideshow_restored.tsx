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

/* Hide original cart icon content */
.hl-cart-icon > *,
.cart-icon > *,
[class*="cart-icon"] > *,
i[class*="cart"] > *,
.fa-shopping-cart > *,
.shopping-cart-icon > * {
  opacity: 0;
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
    // Keep all your original slides structure exactly as they were...
    // Only replacing the code display slides (6-7) with dynamic content
    
    // Slide 6: Header Code with dynamic content
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

    // Slide 7: Footer Code with dynamic content
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
    </Slide>
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Your original navigation and layout structure... */}
      
      {/* Slide Content */}
      <div className="relative">
        {slides[currentSlide]}
      </div>
    </div>
  );
}