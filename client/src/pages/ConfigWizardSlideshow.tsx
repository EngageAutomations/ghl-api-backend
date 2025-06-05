import { useState, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

import { Switch } from '@/components/ui/switch';
import { ChevronLeft, ChevronRight, Rocket, Settings, FileText, Download, FolderOpen, Building2, Upload, ExternalLink, Code, MousePointer, DownloadIcon, Layout, MapPin, AlignLeft, DollarSign, ShoppingBag, ShoppingCart, Hash, Copy, Monitor, Zap, Plus } from 'lucide-react';
import { CheckCircle } from 'lucide-react';

// Import wizard's proven code generation functions
import { generateActionButtonPopup } from '@/lib/custom-popup-generator';
import { generateEmbeddedFormCode } from '@/lib/embedded-form-generator';
import { generateExpandedDescriptionCode } from '@/lib/expanded-description-generator';
import { generateMetadataBarCode } from '@/lib/metadata-bar-generator';

interface SlideProps {
  children: React.ReactNode;
  className?: string;
}

function Slide({ children, className = "" }: SlideProps) {
  return (
    <div className={`h-screen flex flex-col items-center pt-8 px-8 overflow-hidden ${className}`}>
      <div className="w-full max-w-6xl mx-auto bg-white border border-white/30 rounded-2xl p-8 shadow-lg mb-8 overflow-y-auto max-h-[calc(100vh-200px)]">
        {children}
      </div>
      <div className="flex-1"></div>
    </div>
  );
}







export default function ConfigWizardSlideshow() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [currentSlide, setCurrentSlide] = useState(0);
  const [googleDriveConnected, setGoogleDriveConnected] = useState(false);
  const [directoryName, setDirectoryName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [buttonType, setButtonType] = useState<'popup' | 'redirect' | 'download' | 'embed'>('popup');
  // Completely isolated form state - no external dependencies
  const [wizardFormData, setWizardFormData] = useState({
    embedCode: '',
    fieldName: 'listing'
  });

  // Force re-render of inputs when slide changes
  const [inputKey, setInputKey] = useState(0);
  const [showDescription, setShowDescription] = useState(false);
  const [showMetadata, setShowMetadata] = useState(false);
  const [showMaps, setShowMaps] = useState(false);
  const [showPrice, setShowPrice] = useState(false);

  const [showQuantitySelector, setShowQuantitySelector] = useState(false);
  const [integrationMethod, setIntegrationMethod] = useState('popup');

  const [buttonText, setButtonText] = useState('Get Info');
  const [buttonColor, setButtonColor] = useState('#3b82f6');
  const [previewColor, setPreviewColor] = useState('#3b82f6');
  const [previewTextColor, setPreviewTextColor] = useState('#ffffff');

  // Create directory mutation
  const createDirectoryMutation = useMutation({
    mutationFn: async (directoryData: any) => {
      return apiRequest('/api/directories', {
        method: 'POST',
        data: directoryData
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/directories'] });
      toast({
        title: "Directory Created",
        description: "Your directory configuration has been saved successfully!",
      });
      setLocation('/directories');
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create directory. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Helper function to extract form URL from embed code
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

  // Generate custom action button popup code (matches config wizard exactly)
  const generateFullPopupCode = () => {
    if (integrationMethod === 'popup' && wizardFormData.embedCode) {
      const result = generateActionButtonPopup({
        buttonText: 'Get More Info',
        buttonColor: '#3b82f6',
        buttonTextColor: '#ffffff',
        buttonBorderRadius: 8,
        customFieldName: wizardFormData.fieldName || 'listing',
        formUrl: wizardFormData.embedCode,
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

  // Generate code using wizard's proven logic
  const generateCodeForSelection = () => {
    if (wizardFormData.embedCode && wizardFormData.embedCode.trim()) {
      if (integrationMethod === 'popup') {
        // Generate popup template with 100px spacing (matches config wizard)
        const popupCode = generateFullPopupCode();
        
        // Generate expanded description code if enabled
        const expandedDescCode = generateExpandedDescriptionCode({
          enabled: showDescription,
          content: `<h2>Product Details</h2>
<p>This is enhanced content that appears below the main product details.</p>
<p><strong>Key Features:</strong></p>
<ul>
  <li>Professional quality and service</li>
  <li>Local expertise and knowledge</li>
  <li>Competitive pricing and value</li>
</ul>`,
          fadeInAnimation: true,
          customClass: 'expanded-description'
        });

        // Generate metadata bar code if enabled
        const metadataCode = generateMetadataBarCode({
          enabled: showMetadata,
          position: 'bottom',
          fields: [
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
            }
          ],
          customClass: 'listing-metadata-bar',
          backgroundColor: 'transparent',
          textColor: '#374151',
          borderRadius: 0,
          fontFamily: 'system-ui, sans-serif',
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
        const cleanFormUrl = extractFormUrl(wizardFormData.embedCode);
        
        // Generate embedded form template using wizard function
        const embeddedFormCode = generateEmbeddedFormCode({
          formUrl: cleanFormUrl,
          animationType: "fade-squeeze",
          borderRadius: 8,
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
          customFieldName: wizardFormData.fieldName || 'listing',
          metadataFields: []
        });

        // Generate expanded description code if enabled
        const expandedDescCode = generateExpandedDescriptionCode({
          enabled: showDescription,
          content: `<h2>Product Details</h2>
<p>This is enhanced content that appears below the main product details.</p>
<p><strong>Key Features:</strong></p>
<ul>
  <li>Professional quality and service</li>
  <li>Local expertise and knowledge</li>
  <li>Competitive pricing and value</li>
</ul>`,
          fadeInAnimation: true,
          customClass: 'expanded-description'
        });

        // Generate metadata bar code if enabled
        const metadataCode = generateMetadataBarCode({
          enabled: showMetadata,
          position: 'bottom',
          fields: [
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
            }
          ],
          customClass: 'listing-metadata-bar',
          backgroundColor: 'transparent',
          textColor: '#374151',
          borderRadius: 0,
          fontFamily: 'system-ui, sans-serif',
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
        content: `<h2>Product Details</h2>
<p>This is enhanced content that appears below the main product details.</p>
<p><strong>Key Features:</strong></p>
<ul>
  <li>Professional quality and service</li>
  <li>Local expertise and knowledge</li>
  <li>Competitive pricing and value</li>
</ul>`,
        fadeInAnimation: true,
        customClass: 'expanded-description'
      });

      // Generate metadata bar code if enabled
      const metadataCode = generateMetadataBarCode({
        enabled: showMetadata,
        position: 'bottom',
        fields: [
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
          }
        ],
        customClass: 'listing-metadata-bar',
        backgroundColor: 'transparent',
        textColor: '#374151',
        borderRadius: 0,
        fontFamily: 'system-ui, sans-serif',
        showMaps: showMaps
      });

      return {
        headerCode: `/* Directory Listing CSS */
.ghl-listing-button {
  background-color: #3b82f6;
  color: #ffffff;
  border-radius: 8px;
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
    hiddenField.name = '${wizardFormData.fieldName || 'listing'}';
    hiddenField.value = window.location.pathname.split('/').pop();
    form.appendChild(hiddenField);
  });
});
</script>` + (expandedDescCode.jsCode ? '\n\n' + expandedDescCode.jsCode : '') +
         (metadataCode.jsCode ? '\n\n' + metadataCode.jsCode : '')
      };
    }
  };

  // Handle wizard completion
  const handleCompleteWizard = async () => {
    if (!directoryName.trim()) {
      toast({
        title: "Directory Name Required",
        description: "Please enter a directory name before completing the wizard.",
        variant: "destructive",
      });
      return;
    }

    const config = generateCodeForSelection();
    
    const directoryData = {
      directoryName: directoryName.trim(),
      logoUrl: logoUrl || null,
      locationId: 'wizard-generated',
      userId: 1, // Default user for now
      config: {
        features: {
          showDescription,
          showMetadata,
          showMaps,
          showPrice,
          showQuantitySelector
        },
        button: {
          type: buttonType,
          text: buttonText,
          color: previewColor,
          textColor: previewTextColor
        },
        form: {
          embedCode: wizardFormData.embedCode,
          fieldName: wizardFormData.fieldName
        },
        integrationMethod,
        generatedCode: config
      },
      actionButtonColor: previewColor,
      isActive: true
    };

    createDirectoryMutation.mutate(directoryData);
  };

  // Generate CSS for hiding prices globally across all GoHighLevel pages
  const generateGlobalPriceCSS = () => {
    return `<style>
/* Global Price Hiding CSS - Apply to all GoHighLevel pages */
/* Listing/Collection Pages */
body:not(.hl-builder) .cstore-products [class*="price"],
body:not(.hl-builder) .product-grid [class*="price"],
body:not(.hl-builder) .product-list [class*="price"],
body:not(.hl-builder) .collection-grid [class*="price"],
body:not(.hl-builder) .search-results [class*="price"],

/* Product Cards */
body:not(.hl-builder) .product-card [class*="price"],
body:not(.hl-builder) .cstore-product-card [class*="price"],
body:not(.hl-builder) .hl-product-card [class*="price"],

/* Generic Price Selectors */
body:not(.hl-builder) [class*="product-price"],
body:not(.hl-builder) [class*="item-price"],
body:not(.hl-builder) [class*="listing-price"],
body:not(.hl-builder) .price-display,
body:not(.hl-builder) .price-container,
body:not(.hl-builder) .product-pricing,

/* Currency and Dollar Signs */
body:not(.hl-builder) .currency,
body:not(.hl-builder) .price-currency,
body:not(.hl-builder) span[class*="dollar"],
body:not(.hl-builder) span[class*="currency"] {
  display: none !important;
  visibility: hidden !important;
  opacity: 0 !important;
}
</style>`;
  };

  // Base CSS for element hiding
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
  max-width: 600px !important;
  word-wrap: break-word !important;
  overflow-wrap: break-word !important;
  hyphens: auto !important;
}`;

    // Add element hiding CSS based on toggles (when toggle is OFF, hide the element)
    if (!showPrice) {
      css += `

/* Hide Price Display */
body:not(.hl-builder) .cstore-product-detail [class*="price"],
body:not(.hl-builder) .product-detail-container [class*="price"],
body:not(.hl-builder) .hl-product-price,
body:not(.hl-builder) .hl-product-detail-product-price {
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



    css += `
</style>`;

    return css;
  };

  // Main CSS generation function using wizard logic
  const generateFinalCSS = () => {
    const generatedCode = generateCodeForSelection();
    const elementHidingCSS = generateElementHidingCSS();
    
    // Combine element hiding CSS with the wizard's advanced features
    return elementHidingCSS + '\n\n' + generatedCode.headerCode + '\n\n' + generatedCode.footerCode;
  };

  // Handle file drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      setLogoFile(imageFile);
      // Create a preview URL for the dropped file
      const url = URL.createObjectURL(imageFile);
      setLogoUrl(url);
    }
  };

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setLogoFile(file);
      const url = URL.createObjectURL(file);
      setLogoUrl(url);
    }
  };

  // Handle drag events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const slides = useMemo(() => {
    const baseSlides: JSX.Element[] = [
    // Slide 0: Get Started
    <Slide key="get-started" className="bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center max-w-2xl mx-auto">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-full mb-6">
            <Rocket className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Add Enhancements To Your Ecommerce Site</h1>
          <p className="text-xl text-gray-600 mb-8">
            Transform your GoHighLevel marketplace with advanced form generation, 
            metadata displays, and enhanced customer experiences.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-blue-200 bg-white/70 backdrop-blur-sm">
            <CardContent className="p-6 text-center">
              <Settings className="w-8 h-8 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Easy Configuration</h3>
              <p className="text-sm text-gray-600">Guided, no-code wizard that gets you live in minutes

</p>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-white/70 backdrop-blur-sm">
            <CardContent className="p-6 text-center">
              <FileText className="w-8 h-8 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Rich Content</h3>
              <p className="text-sm text-gray-600">Showcase detailed descriptions, metadata, and media

</p>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-white/70 backdrop-blur-sm">
            <CardContent className="p-6 text-center">
              <Download className="w-8 h-8 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Ready to Deploy</h3>
              <p className="text-sm text-gray-600">Clean, embeddable code tailored for your website

</p>
            </CardContent>
          </Card>
        </div>


      </div>
    </Slide>,

    // Slide 1: Google Drive Connection
    <Slide key="google-drive" className="bg-gradient-to-br from-red-50 to-pink-100">
      <div className="text-center max-w-2xl mx-auto">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-500 rounded-full mb-6">
            <FolderOpen className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Connect Google Drive</h2>
          <p className="text-lg text-gray-600 mb-8">
            Connect your Google Drive for image storage and management
          </p>
        </div>

        <div className="text-center">
          {!googleDriveConnected ? (
            <div>
              <Button 
                onClick={() => setGoogleDriveConnected(true)}
                className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 text-lg"
              >
                Connect Google Drive
              </Button>
            </div>
          ) : (
            <div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                <div className="flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-green-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  <h3 className="text-xl font-semibold text-green-800">Google Drive Connected!</h3>
                </div>
                <p className="text-green-700 mb-4">
                  Your Google Drive is now connected and ready to use.
                </p>
                <div className="bg-white rounded-lg p-4 border border-green-200">
                  <p className="text-sm text-green-800">
                    <strong>Storage Location:</strong> Directory Images folder<br/>
                    <strong>Status:</strong> Ready for image uploads<br/>
                    <strong>Access:</strong> Full read/write permissions
                  </p>
                </div>
              </div>
              <Button 
                onClick={() => setGoogleDriveConnected(false)}
                variant="outline"
                className="border-red-300 text-red-600 hover:bg-red-50"
              >
                Disconnect
              </Button>
            </div>
          )}
        </div>
      </div>
    </Slide>,

    // Slide 2: Directory Setup
    <Slide key="directory-setup" className="bg-gradient-to-br from-blue-50 to-cyan-100">
      <div className="text-center max-w-2xl mx-auto">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-full mb-6">
            <Building2 className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Directory Setup</h2>
          <p className="text-lg text-gray-600 mb-8">
            Name your directory and set up basic information
          </p>
        </div>

        <Card className="bg-white/80 backdrop-blur-sm border border-blue-200 max-w-lg mx-auto">
          <CardContent className="p-8">
            <div className="space-y-6">
              {/* Directory Name Field */}
              <div className="space-y-3">
                <Label htmlFor="directory-name" className="text-left block text-lg font-medium text-gray-700">
                  Directory Name
                </Label>
                <Input
                  id="directory-name"
                  placeholder="My Business Directory"
                  value={directoryName}
                  onChange={(e) => setDirectoryName(e.target.value)}
                  className="text-lg p-4 h-auto"
                />
                <p className="text-sm text-gray-600 text-left">
                  Give your directory a memorable name for organization
                </p>
              </div>

              {/* Logo Upload Field */}
              <div className="space-y-3">
                <Label className="text-left block text-lg font-medium text-gray-700">Add Your Logo</Label>
                <div className="space-y-2">
                  {/* Drag and Drop Area */}
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    className={`
                      border-2 border-dashed rounded-lg p-4 text-center transition-all cursor-pointer
                      ${isDragOver 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'
                      }
                    `}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      id="logo-upload"
                    />
                    <label htmlFor="logo-upload" className="cursor-pointer">
                      <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm font-medium text-gray-700">
                        {isDragOver ? 'Drop logo here' : 'Upload logo'}
                      </p>
                    </label>
                  </div>
                  {logoFile && (
                    <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
                      ✓ Uploaded: {logoFile.name} ({(logoFile.size / 1024).toFixed(1)}KB)
                    </div>
                  )}
                </div>
              </div>


            </div>
          </CardContent>
        </Card>
      </div>
    </Slide>,

    // Slide 3: Integration Method
    <Slide key="integration-method" className="bg-gradient-to-br from-green-50 to-emerald-100">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-full mb-4">
            <Settings className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Integration Method</h2>
          <p className="text-gray-600 mb-6">
            Choose how visitors interact with your listings and configure button options
          </p>
        </div>

        {/* Integration Options Grid - Streamlined */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <Card 
            className={`cursor-pointer transition-all border-2 ${
              integrationMethod === 'popup' ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
            onClick={() => setIntegrationMethod('popup')}
          >
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-3">
                <div className="bg-blue-500 text-white p-2 rounded-md">
                  <MousePointer className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <h3 className="font-medium">Action Button (Popup)</h3>
                  <p className="text-sm text-gray-500">Opens form in a popup overlay</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className={`cursor-pointer transition-all border-2 ${
              integrationMethod === 'embed' ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
            onClick={() => setIntegrationMethod('embed')}
          >
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-3">
                <div className="bg-purple-500 text-white p-2 rounded-md">
                  <Code className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <h3 className="font-medium">Embedded Form</h3>
                  <p className="text-sm text-gray-500">Displays form directly on page</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className={`cursor-pointer transition-all border-2 ${
              integrationMethod === 'redirect' ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
            onClick={() => setIntegrationMethod('redirect')}
          >
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-3">
                <div className="bg-green-500 text-white p-2 rounded-md">
                  <ExternalLink className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <h3 className="font-medium">Action Button (Redirect)</h3>
                  <p className="text-sm text-gray-500">Redirects to external form page</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card 
            className={`cursor-pointer transition-all border-2 ${
              integrationMethod === 'download' ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
            onClick={() => setIntegrationMethod('download')}
          >
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-3">
                <div className="bg-orange-500 text-white p-2 rounded-md">
                  <DownloadIcon className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <h3 className="font-medium">Action Button (Download)</h3>
                  <p className="text-sm text-gray-500">Downloads file directly</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Button Configuration for Action Button Types */}
        {(integrationMethod === 'popup' || integrationMethod === 'redirect' || integrationMethod === 'download') && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Button Configuration</h3>
              
              <div className="space-y-6">
                {/* Button Text */}
                <div className="space-y-3">
                  <Label htmlFor="buttonText" className="text-sm font-medium text-gray-900">Button Text</Label>
                  <Input
                    id="buttonText"
                    value={buttonText}
                    onChange={(e) => setButtonText(e.target.value)}
                    placeholder={
                      integrationMethod === 'popup' ? 'Get Info' :
                      integrationMethod === 'download' ? 'Download' :
                      'Learn More'
                    }
                    className="w-full"
                  />
                </div>

                {/* Button Styling */}
                <div className="space-y-4">
                  <Label className="text-sm font-medium text-gray-900">Button Styling</Label>
                  
                  <div className="grid grid-cols-3 gap-4">
                    {/* Button Color */}
                    <div>
                      <Label htmlFor="buttonColor" className="text-xs text-gray-600">Background Color</Label>
                      <div className="flex space-x-2 mt-1">
                        <input
                          id="buttonColor"
                          type="color"
                          value={previewColor}
                          onChange={(e) => setPreviewColor(e.target.value)}
                          className="w-10 h-8 rounded border border-gray-300 cursor-pointer"
                        />
                        <Input
                          value={previewColor}
                          onChange={(e) => setPreviewColor(e.target.value)}
                          placeholder="#3b82f6"
                          className="flex-1 text-xs"
                        />
                      </div>
                    </div>

                    {/* Text Color */}
                    <div>
                      <Label htmlFor="textColor" className="text-xs text-gray-600">Text Color</Label>
                      <div className="flex space-x-2 mt-1">
                        <input
                          id="textColor"
                          type="color"
                          value={previewTextColor}
                          onChange={(e) => setPreviewTextColor(e.target.value)}
                          className="w-10 h-8 rounded border border-gray-300 cursor-pointer"
                        />
                        <Input
                          value={previewTextColor}
                          onChange={(e) => setPreviewTextColor(e.target.value)}
                          placeholder="#ffffff"
                          className="flex-1 text-xs"
                        />
                      </div>
                    </div>

                    {/* Button Preview */}
                    <div>
                      <Label className="text-xs text-gray-600">Preview</Label>
                      <div className="flex items-center justify-center mt-1 p-3 bg-gray-50 rounded border h-[42px]">
                        <button
                          className="px-4 py-1.5 font-medium transition-colors hover:opacity-90 text-sm"
                          style={{ 
                            backgroundColor: previewColor,
                            color: previewTextColor
                          }}
                        >
                          {buttonText || (
                            integrationMethod === 'popup' ? 'Get Info' :
                            integrationMethod === 'download' ? 'Download' :
                            'Learn More'
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Configuration Card */}
        <div className="max-w-2xl mx-auto text-center">
          <div>
            {/* Redirect Action Button Info */}
            {integrationMethod === 'redirect' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <div className="flex items-center space-x-3">
                  <ExternalLink className="w-6 h-6 text-green-600" />
                  <div className="text-left">
                    <h4 className="text-lg font-medium text-green-800">Redirect Button</h4>
                    <p className="text-green-700 mt-2">Redirect URLs will be configured when creating the listings. The button will redirect users to external pages.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Download Action Button Info */}
            {integrationMethod === 'download' && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
                <div className="flex items-center space-x-3">
                  <DownloadIcon className="w-6 h-6 text-orange-600" />
                  <div className="text-left">
                    <h4 className="text-lg font-medium text-orange-800">Direct Download Button</h4>
                    <p className="text-orange-700 mt-2">Download URLs will be configured when creating a listing. The button will trigger direct file downloads.</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Configuration Summary - Skip problematic inputs */}
            {(integrationMethod === 'popup' || integrationMethod === 'embed') && (
              <div className="space-y-6">
                
                {/* Form Embed Code - Completely rebuilt from scratch */}
                <div className="space-y-3">
                  <label className="text-left block text-lg font-medium text-gray-700">
                    {integrationMethod === 'popup' ? 'GoHighLevel Iframe Embed Code' : 'GoHighLevel Form Embed Code'}
                  </label>
                  <textarea
                    key={`embed-input-${inputKey}`}
                    rows={3}
                    placeholder="Paste your GoHighLevel form embed code here..."
                    defaultValue={wizardFormData.embedCode}
                    onChange={(e) => {
                      setWizardFormData(prev => ({...prev, embedCode: e.target.value}));
                    }}
                    className="w-full text-lg p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
                  />
                </div>

                {/* Custom Field Name - Completely rebuilt from scratch */}
                <div className="space-y-3">
                  <label className="text-left block text-lg font-medium text-gray-700">
                    Custom Field Name
                  </label>
                  <input
                    key={`field-input-${inputKey}`}
                    type="text"
                    placeholder="listing"
                    defaultValue={wizardFormData.fieldName}
                    onChange={(e) => setWizardFormData(prev => ({...prev, fieldName: e.target.value}))}
                    className="w-full text-lg p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
                    <div className="text-sm text-blue-700 text-left">
                      <p className="font-medium mb-2">💡 Setup Instructions:</p>
                      <ol className="space-y-1">
                        <li>1. Create a single line custom field in High Level</li>
                        <li>2. Place the field in the form and make it hidden</li>
                        <li>3. Add the field name here</li>
                        <li>4. When a visitor fills out your form, you will know which listing the form was on</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>
            )}




          </div>
        </div>
      </div>
    </Slide>,

    // Slide 4: GoHighLevel Page Options
    <Slide key="ghl-page-options" className="bg-gradient-to-br from-indigo-50 to-blue-100">
      <div className="text-center max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-600 rounded-full mb-6">
            <Settings className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">GoHighLevel Page Options</h2>
          <p className="text-lg text-gray-600 mb-8">
            Control which ecommerce elements to show or hide on your marketplace pages
          </p>
        </div>

        {/* GoHighLevel Options Grid - 2x2 Square Formation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 max-w-4xl mx-auto">
          <Card className="bg-white/80 backdrop-blur-sm border border-indigo-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-50 p-2 rounded-md">
                    <DollarSign className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-medium">Show Listing Price</h3>
                    <p className="text-sm text-gray-500">Display product pricing information</p>
                  </div>
                </div>
                <Switch 
                  checked={showPrice}
                  onCheckedChange={setShowPrice}
                  id="show-price" 
                />
              </div>

            </CardContent>
          </Card>



          <Card className="bg-white/80 backdrop-blur-sm border border-indigo-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-purple-50 p-2 rounded-md">
                    <Hash className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-medium">Show Quantity Selector</h3>
                    <p className="text-sm text-gray-500">Display quantity input and controls</p>
                  </div>
                </div>
                <Switch 
                  checked={showQuantitySelector}
                  onCheckedChange={setShowQuantitySelector}
                  id="show-quantity" 
                />
              </div>

            </CardContent>
          </Card>


        </div>


      </div>
    </Slide>,

    // Slide 5: Directory Components
    <Slide key="directory-components" className="bg-gradient-to-br from-purple-50 to-violet-100">
      <div className="text-center max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-purple-600 rounded-full mb-6">
            <Layout className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Directory Enhancement Components</h2>
          <p className="text-lg text-gray-600 mb-8">
            Add enhanced components to make your directory more engaging
          </p>
        </div>

        {/* Component Toggle Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-white/80 backdrop-blur-sm border border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-indigo-50 p-2 rounded-md">
                    <AlignLeft className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-medium">Expanded Description</h3>
                    <p className="text-sm text-gray-500">Rich content with images and HTML</p>
                  </div>
                </div>
                <Switch 
                  checked={showDescription}
                  onCheckedChange={setShowDescription}
                  id="show-description" 
                />
              </div>
              {showDescription && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-left">
                  <p className="text-sm text-green-700">
                    ✓ Enhanced product descriptions with custom HTML content and URL-based content system
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-green-50 p-2 rounded-md">
                    <FileText className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-medium">Metadata Bar</h3>
                    <p className="text-sm text-gray-500">Additional business information</p>
                  </div>
                </div>
                <Switch 
                  checked={showMetadata}
                  onCheckedChange={setShowMetadata}
                  id="show-metadata" 
                />
              </div>
              {showMetadata && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-left">
                  <p className="text-sm text-green-700">
                    ✓ Business contact information with icons and customizable styling
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-orange-50 p-2 rounded-md">
                    <MapPin className="w-6 h-6 text-orange-600" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-medium">Google Maps Widget</h3>
                    <p className="text-sm text-gray-500">Interactive location display</p>
                  </div>
                </div>
                <Switch 
                  checked={showMaps}
                  onCheckedChange={setShowMaps}
                  id="show-maps" 
                />
              </div>
              {showMaps && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-left">
                  <p className="text-sm text-green-700">
                    ✓ Embedded Google Maps for location-based businesses
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>


      </div>
    </Slide>,

    // Slide 6: Configuration Summary
    <Slide key="configuration-summary" className="bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-full mb-6">
            <FileText className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Configuration Summary</h2>
          <p className="text-lg text-gray-600 mb-8">
            Review your settings before generating the final code
          </p>
        </div>

        {/* Configuration Summary */}
        <Card className="bg-white border border-blue-200 max-w-4xl mx-auto">
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
              {/* Directory Settings */}
              <div>
                <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                  <Building2 className="w-5 h-5 mr-2 text-blue-600" />
                  Directory Settings
                </h4>
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex items-center">
                    <span className="w-6 text-center">📁</span>
                    <span className="ml-2"><strong>Name:</strong> {directoryName || 'My Directory'}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-6 text-center">🖼️</span>
                    <span className="ml-2"><strong>Logo:</strong> {logoFile ? logoFile.name : 'Default logo'}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-6 text-center">🔗</span>
                    <span className="ml-2"><strong>Integration:</strong> {integrationMethod}</span>
                  </div>
                </div>
              </div>

              {/* GoHighLevel Options */}
              <div>
                <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                  <Settings className="w-5 h-5 mr-2 text-blue-600" />
                  Page Elements
                </h4>
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex items-center">
                    <span className="w-6 text-center">💰</span>
                    <span className="ml-2"><strong>Price Display:</strong> {showPrice ? 'Visible' : 'Hidden'}</span>
                  </div>


                  <div className="flex items-center">
                    <span className="w-6 text-center">🔢</span>
                    <span className="ml-2"><strong>Quantity Selector:</strong> {showQuantitySelector ? 'Visible' : 'Hidden'}</span>
                  </div>

                </div>
              </div>

              {/* Enhancement Components */}
              <div>
                <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                  <Zap className="w-5 h-5 mr-2 text-blue-600" />
                  Enhancement Components
                </h4>
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex items-center">
                    <span className="w-6 text-center">📝</span>
                    <span className="ml-2"><strong>Expanded Description:</strong> {showDescription ? 'Enabled' : 'Disabled'}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-6 text-center">📊</span>
                    <span className="ml-2"><strong>Metadata Bar:</strong> {showMetadata ? 'Enabled' : 'Disabled'}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-6 text-center">🗺️</span>
                    <span className="ml-2"><strong>Google Maps:</strong> {showMaps ? 'Enabled' : 'Disabled'}</span>
                  </div>
                </div>
              </div>
            </div>


          </CardContent>
        </Card>
      </div>
    </Slide>,

    // Slide 7: Form Preview
    <Slide key="form-preview" className="bg-gradient-to-br from-purple-50 to-indigo-100">
      <div className="text-center max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-purple-600 rounded-full mb-6">
            <FileText className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Generated Form Preview</h2>
          <p className="text-lg text-gray-600 mb-8">
            This is how your directory's listing creation form will appear based on your configuration
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Preview */}
          <Card className="bg-white/90 backdrop-blur-sm border border-purple-200">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">Create New Listing</h3>
              
              <div className="space-y-4">
                {/* Always show basic fields */}
                <div>
                  <Label className="text-sm font-medium text-gray-700">Listing Title *</Label>
                  <Input placeholder="Enter listing title" className="mt-1" />
                </div>

                {showDescription !== false && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Description</Label>
                    <textarea 
                      className="w-full mt-1 p-3 border border-gray-300 rounded-md resize-none"
                      rows={3}
                      placeholder="Describe your listing"
                    />
                  </div>
                )}

                <div>
                  <Label className="text-sm font-medium text-gray-700">Image URL</Label>
                  <Input placeholder="https://example.com/image.jpg" className="mt-1" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Contact Email</Label>
                    <Input placeholder="contact@example.com" className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Contact Phone</Label>
                    <Input placeholder="(555) 123-4567" className="mt-1" />
                  </div>
                </div>

                {showPrice !== false && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Price</Label>
                    <Input placeholder="$50,000" className="mt-1" />
                  </div>
                )}

                {showMaps !== false && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Location/Address</Label>
                    <Input placeholder="123 Main St, City, State" className="mt-1" />
                  </div>
                )}

                {showMetadata !== false && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Additional Details</Label>
                    <Input placeholder="Business hours, contact info, etc." className="mt-1" />
                  </div>
                )}

                {/* Action Button Preview */}
                <div className="border-t pt-4 mt-6">
                  <Label className="text-sm font-medium text-gray-700 block mb-2">Generated Action Button</Label>
                  <button
                    type="button"
                    className="px-4 py-2 rounded font-medium"
                    style={{
                      backgroundColor: previewColor,
                      color: '#ffffff',
                    }}
                  >
                    {buttonText || 'Get Info'}
                  </button>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <Button variant="outline">Cancel</Button>
                  <Button className="bg-purple-600 hover:bg-purple-700">Create Listing</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Configuration Summary */}
          <Card className="bg-white/90 backdrop-blur-sm border border-purple-200">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Form Configuration</h3>
              
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <Settings className="w-4 h-4 mr-2 text-purple-600" />
                    Enabled Fields
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center text-green-600">
                      <span className="w-4 h-4 mr-2">✓</span>
                      <span>Title (required)</span>
                    </div>
                    {showDescription !== false && (
                      <div className="flex items-center text-green-600">
                        <span className="w-4 h-4 mr-2">✓</span>
                        <span>Description</span>
                      </div>
                    )}
                    <div className="flex items-center text-green-600">
                      <span className="w-4 h-4 mr-2">✓</span>
                      <span>Image URL</span>
                    </div>
                    <div className="flex items-center text-green-600">
                      <span className="w-4 h-4 mr-2">✓</span>
                      <span>Contact Information</span>
                    </div>
                    {showPrice !== false && (
                      <div className="flex items-center text-green-600">
                        <span className="w-4 h-4 mr-2">✓</span>
                        <span>Price</span>
                      </div>
                    )}
                    {showMaps !== false && (
                      <div className="flex items-center text-green-600">
                        <span className="w-4 h-4 mr-2">✓</span>
                        <span>Location/Address</span>
                      </div>
                    )}
                    {showMetadata !== false && (
                      <div className="flex items-center text-green-600">
                        <span className="w-4 h-4 mr-2">✓</span>
                        <span>Additional Details</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <MousePointer className="w-4 h-4 mr-2 text-purple-600" />
                    Button Configuration
                  </h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div><strong>Type:</strong> {integrationMethod === 'popup' ? 'Popup' : 'Embedded Form'}</div>
                    <div><strong>Text:</strong> {buttonText || 'Get Info'}</div>
                    <div><strong>Color:</strong> <span className="inline-block w-4 h-4 rounded ml-1" style={{backgroundColor: previewColor}}></span></div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <Code className="w-4 h-4 mr-2 text-purple-600" />
                    Integration Details
                  </h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div><strong>Method:</strong> {integrationMethod}</div>
                    <div><strong>Field Name:</strong> {wizardFormData.fieldName || 'listing'}</div>
                    <div><strong>Directory:</strong> {directoryName || 'My Directory'}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-600 mb-4">
            This form will be generated automatically when users click "Create New Listing" in your directory
          </p>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 max-w-2xl mx-auto">
            <p className="text-sm text-purple-800">
              <strong>Integration Note:</strong> The form fields shown above will be dynamically generated based on your configuration. 
              Users will be able to create listings that match your directory's requirements.
            </p>
          </div>
        </div>
      </div>
    </Slide>,

    // Slide 8: Generate Code
    <Slide key="generate-code" className="bg-gradient-to-br from-green-50 to-emerald-100">
      <div className="text-center max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-600 rounded-full mb-6">
            <Code className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Your Integration Code is Ready!</h2>
          <p className="text-lg text-gray-600 mb-8">
            Copy the code below and paste it into your GoHighLevel page's header section
          </p>
        </div>

        {/* Generated Complete Code */}
        <Card className="bg-white/90 backdrop-blur-sm border border-green-200 text-left">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Complete GoHighLevel Integration Code</h3>
              <Button
                onClick={() => {
                  const generatedCode = generateCodeForSelection();
                  const completeCode = `${generatedCode.headerCode}\n\n${generatedCode.footerCode}`;
                  navigator.clipboard.writeText(completeCode);
                }}
                className="bg-green-600 hover:bg-green-700"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy Complete Code
              </Button>
            </div>
            
            <div className="bg-gray-900 text-gray-100 p-4 rounded-lg max-h-96 overflow-y-auto">
              <pre className="text-sm whitespace-pre-wrap">
{(() => {
  const generatedCode = generateCodeForSelection();
  return `${generatedCode.headerCode}\n\n${generatedCode.footerCode}`;
})()}
              </pre>
            </div>
          </CardContent>
        </Card>


      </div>
    </Slide>
  ];

    // Add conditional slides based on configuration options
    
    // 1. Product Details Page CSS - Always after Configuration Summary
    baseSlides.splice(-1, 0,
      <Slide key="product-details-css" className="bg-gradient-to-br from-indigo-50 to-blue-100">
        <div className="text-center max-w-4xl mx-auto">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-600 rounded-full mb-6">
              <Code className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Product Details Page CSS</h2>
            <p className="text-lg text-gray-600 mb-8">
              Main CSS code for your product details pages
            </p>
          </div>

          {/* Configuration Instructions */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-4">Add this code to the CSS field inside your product listing page.</h4>
            <div className="bg-white rounded-lg p-4 border border-blue-200">
              <img 
                src="https://storage.googleapis.com/msgsndr/WAvk87RmW9rBSDJHeOpH/media/6841b837e142b60d3a41ea1f.png" 
                alt="GoHighLevel CSS field location screenshot" 
                className="w-full max-w-2xl mx-auto rounded border shadow-sm"
              />
            </div>
          </div>

          <Card className="bg-white border border-indigo-200 text-left">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Product Details Page CSS</h3>
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      const config = {
                        directoryName,
                        integrationMethod,
                        showDescription,
                        showMetadata,
                        showMaps,
                        showPrice,
                        showQuantitySelector,
                        formEmbedUrl: wizardFormData.embedCode || "PASTE_YOUR_GOHIGHLEVEL_FORM_CODE_HERE",
                        customFieldName: wizardFormData.fieldName
                      };
                      const configJson = JSON.stringify(config, null, 2);
                      const blob = new Blob([configJson], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${directoryName || 'directory'}-config.json`;
                      a.click();
                    }}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Config
                  </Button>
                  <Button
                    onClick={() => {
                      const cssCode = generateFinalCSS();
                      navigator.clipboard.writeText(cssCode);
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy CSS
                  </Button>
                </div>
              </div>
              
              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg max-h-96 overflow-y-auto">
                <pre className="text-sm whitespace-pre-wrap">
                  {generateFinalCSS()}
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>
      </Slide>
    );

    // 2. Product Details Page Header - Always after CSS
    baseSlides.splice(-1, 0,
      <Slide key="product-details-header" className="bg-gradient-to-br from-emerald-50 to-green-100">
        <div className="text-center max-w-4xl mx-auto">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-600 rounded-full mb-6">
              <FileText className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Product Details Page Header</h2>
            <p className="text-lg text-gray-600 mb-8">
              Header code for enhanced product page functionality
            </p>
          </div>

          {/* Configuration Instructions */}
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
            <h4 className="font-medium text-emerald-800 mb-4">Add this code to the Header Tracking Code in your GoHighLevel site settings.</h4>
            <div className="bg-white rounded-lg p-4 border border-emerald-200">
              <img 
                src="https://storage.googleapis.com/msgsndr/WAvk87RmW9rBSDJHeOpH/media/6841b9c175ad7e7ddd0c2f0a.png" 
                alt="GoHighLevel header tracking code location" 
                className="w-full max-w-2xl mx-auto rounded border shadow-sm"
              />
            </div>
          </div>

          <Card className="bg-white border border-emerald-200 text-left">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Header Code</h3>
                <Button
                  onClick={() => {
                    const generatedCode = generateCodeForSelection();
                    navigator.clipboard.writeText(generatedCode.headerCode);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Header
                </Button>
              </div>
              
              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg max-h-96 overflow-y-auto">
                <pre className="text-sm whitespace-pre-wrap">
{generateCodeForSelection().headerCode}
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>
      </Slide>
    );

    // 3. Product Details Page Footer - Always after Header
    baseSlides.splice(-1, 0,
      <Slide key="product-details-footer" className="bg-gradient-to-br from-purple-50 to-violet-100">
        <div className="text-center max-w-4xl mx-auto">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-purple-600 rounded-full mb-6">
              <Layout className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Product Details Page Footer</h2>
            <p className="text-lg text-gray-600 mb-8">
              Footer code for form integration and enhanced features
            </p>
          </div>

          {/* Configuration Instructions */}
          <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <h4 className="font-medium text-purple-800 mb-4">Add this code to the Footer Tracking Code in your GoHighLevel site settings.</h4>
            <div className="bg-white rounded-lg p-4 border border-purple-200">
              <img 
                src="https://storage.googleapis.com/msgsndr/WAvk87RmW9rBSDJHeOpH/media/6841b9c175ad7e7ddd0c2f0a.png" 
                alt="GoHighLevel footer tracking code location" 
                className="w-full max-w-2xl mx-auto rounded border shadow-sm"
              />
            </div>
          </div>

          <Card className="bg-white border border-purple-200 text-left">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Footer Code</h3>
                <Button
                  onClick={() => {
                    const generatedCode = generateCodeForSelection();
                    navigator.clipboard.writeText(generatedCode.footerCode);
                  }}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Footer
                </Button>
              </div>
              
              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg max-h-96 overflow-y-auto">
                <pre className="text-sm whitespace-pre-wrap">
{generateCodeForSelection().footerCode}
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>
      </Slide>
    );

    // Add global price hiding CSS slide when price display is disabled
    if (!showPrice) {
      baseSlides.splice(-1, 0,
        <Slide key="global-price-css" className="bg-gradient-to-br from-orange-50 to-amber-100">
          <div className="text-center max-w-4xl mx-auto">
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-orange-600 rounded-full mb-6">
                <DollarSign className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Global Price CSS</h2>
              <p className="text-lg text-gray-600 mb-8">Add this code to the product list page and any other page you decide to display featured products. This will vary based on your sites design.</p>
            </div>

            <Card className="bg-white border border-orange-200 text-left">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Global Price Hiding CSS</h3>
                  <Button
                    onClick={() => {
                      const globalPriceCSS = generateGlobalPriceCSS();
                      navigator.clipboard.writeText(globalPriceCSS);
                    }}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy CSS
                  </Button>
                </div>
                
                <div className="bg-gray-900 text-gray-100 p-4 rounded-lg max-h-96 overflow-y-auto">
                  <pre className="text-sm whitespace-pre-wrap">
{generateGlobalPriceCSS()}
                  </pre>
                </div>
                

              </CardContent>
            </Card>
          </div>
        </Slide>
      );
    }

    // Final completion slide
    baseSlides.push(
      <Slide key="completion" className="bg-gradient-to-br from-green-50 to-emerald-100">
        <div className="text-center max-w-4xl mx-auto">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-600 rounded-full mb-6">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Setup Complete!</h2>
            <p className="text-lg text-gray-600 mb-8">Your GoHighLevel marketplace enhancement is ready to deploy. Download all generated code for reference. You can also view your code and modify it in the directory management tab.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="border-green-200 bg-white/70 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <FileText className="w-8 h-8 text-green-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">CSS Code</h3>
                <p className="text-sm text-gray-600">Product page styling and element visibility controls</p>
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-white/70 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <Settings className="w-8 h-8 text-green-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Header Code</h3>
                <p className="text-sm text-gray-600">Enhanced functionality and form integration</p>
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-white/70 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <Layout className="w-8 h-8 text-green-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Footer Code</h3>
                <p className="text-sm text-gray-600">JavaScript for popups and interactive features</p>
              </CardContent>
            </Card>
          </div>

          <Button 
            onClick={() => {
              // Generate all code files
              const generatedCode = generateCodeForSelection();
              const elementHidingCSS = generateElementHidingCSS();
              
              // Create zip file content
              const files = [
                {
                  name: 'css-code.html',
                  content: elementHidingCSS
                },
                {
                  name: 'header-code.html', 
                  content: generatedCode.headerCode || '<!-- No header code generated -->'
                },
                {
                  name: 'footer-code.html',
                  content: generatedCode.footerCode || '<!-- No footer code generated -->'
                },
                {
                  name: 'implementation-guide.txt',
                  content: `GoHighLevel Implementation Guide

1. CSS Code (css-code.html):
   - Go to your product page in GoHighLevel editor
   - Find the CSS field in styling options
   - Copy and paste the CSS code from css-code.html

2. Header Code (header-code.html):
   - Go to Settings → Custom Code in GoHighLevel
   - Find the Header Tracking Code section
   - Paste the header code

3. Footer Code (footer-code.html):
   - Go to Settings → Custom Code in GoHighLevel
   - Find the Footer Tracking Code section
   - Paste the footer code

4. Save and publish your changes

Your marketplace enhancement is now active!`
                }
              ];
              
              // Create and download files individually (simplified approach)
              files.forEach(file => {
                const blob = new Blob([file.content], { type: 'text/html' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = file.name;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              });
            }}
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg"
          >
            <Download className="w-5 h-5 mr-2" />
            Download All Files
          </Button>
        </div>
      </Slide>
    );

    return baseSlides;
  }, [directoryName, logoFile, integrationMethod, showPrice, showQuantitySelector, showDescription, showMetadata, showMaps, wizardFormData.embedCode, wizardFormData.fieldName]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
    setInputKey(prev => prev + 1); // Force input refresh
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    setInputKey(prev => prev + 1); // Force input refresh
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setInputKey(prev => prev + 1); // Force input refresh
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <h1 className="text-xl font-semibold text-gray-900">Directory Engine Setup Wizard</h1>
          
          {/* Progress indicator */}
          <div className="flex items-center space-x-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  index === currentSlide 
                    ? 'bg-blue-600' 
                    : index < currentSlide 
                      ? 'bg-green-500' 
                      : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
      
      {/* Main Content - Takes remaining space */}
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
      
      {/* Navigation Footer - Fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4 z-50">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <Button
            variant="outline"
            onClick={prevSlide}
            disabled={currentSlide === 0}
            className="flex items-center space-x-2"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </Button>

          <div className="text-sm text-gray-500">
            Step {currentSlide + 1} of {slides.length}
          </div>

          {currentSlide === slides.length - 1 ? (
            <Button 
              onClick={handleCompleteWizard}
              disabled={createDirectoryMutation.isPending}
              className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{createDirectoryMutation.isPending ? 'Saving...' : 'Complete Wizard'}</span>
            </Button>
          ) : (
            <Button
              onClick={nextSlide}
              className="flex items-center space-x-2"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}