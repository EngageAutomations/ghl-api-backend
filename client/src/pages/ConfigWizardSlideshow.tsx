import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ChevronLeft, ChevronRight, Rocket, Settings, FileText, Download, FolderOpen, Building2, Upload, ExternalLink, Code, MousePointer, DownloadIcon, Layout, MapPin, AlignLeft, DollarSign, ShoppingBag, ShoppingCart, Hash, Copy, Monitor, Zap } from 'lucide-react';

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
  const [googleDriveConnected, setGoogleDriveConnected] = useState(false);
  const [directoryName, setDirectoryName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [buttonType, setButtonType] = useState<'popup' | 'redirect' | 'download' | 'embed'>('popup');
  const [formEmbedUrl, setFormEmbedUrl] = useState('');
  const [customFieldName, setCustomFieldName] = useState('listing');
  const [showDescription, setShowDescription] = useState(false);
  const [showMetadata, setShowMetadata] = useState(false);
  const [showMaps, setShowMaps] = useState(false);
  const [showPrice, setShowPrice] = useState(false);
  const [showBuyNowButton, setShowBuyNowButton] = useState(false);
  const [showAddToCartButton, setShowAddToCartButton] = useState(false);
  const [showQuantitySelector, setShowQuantitySelector] = useState(false);
  const [showCartIcon, setShowCartIcon] = useState(true);
  const [integrationMethod, setIntegrationMethod] = useState('popup');

  // CSS Generation Function
  const generateFinalCSS = () => {
    let css = `<style>
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
}`;

    // Add element hiding CSS based on toggles
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
body:not(.hl-builder) button[class*="add-to-cart"] {
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

  const slides = [
    // Slide 0: Get Started
    <Slide key="get-started" className="bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center max-w-2xl mx-auto">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-full mb-6">
            <Rocket className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            GoHighLevel Marketplace Extension
          </h1>
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
              <p className="text-sm text-gray-600">Simple wizard-driven setup process</p>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-white/70 backdrop-blur-sm">
            <CardContent className="p-6 text-center">
              <FileText className="w-8 h-8 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Rich Content</h3>
              <p className="text-sm text-gray-600">Enhanced descriptions and metadata</p>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-white/70 backdrop-blur-sm">
            <CardContent className="p-6 text-center">
              <Download className="w-8 h-8 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Ready to Deploy</h3>
              <p className="text-sm text-gray-600">Generated code ready for integration</p>
            </CardContent>
          </Card>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border border-blue-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">What You'll Create:</h3>
          <ul className="text-left text-gray-700 space-y-2">
            <li className="flex items-center">
              <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
              Dynamic form integration with embedded popups or redirects
            </li>
            <li className="flex items-center">
              <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
              Rich product descriptions with custom content management
            </li>
            <li className="flex items-center">
              <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
              Business metadata displays with icons and contact information
            </li>
            <li className="flex items-center">
              <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
              Google Maps integration for location-based listings
            </li>
          </ul>
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
      <div className="text-center max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-600 rounded-full mb-6">
            <Settings className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Choose Integration Method</h2>
          <p className="text-lg text-gray-600 mb-8">
            Select how you want to integrate GoHighLevel forms
          </p>
        </div>

        {/* Integration Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
                    <p className="text-green-700 mt-2">
                      Redirect URLs will be configured through your form submissions. The button will redirect users to external pages.
                    </p>
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
                    <p className="text-orange-700 mt-2">
                      Download URLs will be configured through your form submissions. The button will trigger direct file downloads.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Popup Configuration */}
            {integrationMethod === 'popup' && (
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-center space-x-3">
                    <div className="bg-blue-600 text-white p-2 rounded-md">
                      <Monitor className="w-5 h-5" />
                    </div>
                    <div className="text-center">
                      <h4 className="font-medium text-blue-800">Action Button Popup Setup</h4>
                      <p className="text-sm text-blue-700 mt-1">Display forms in an overlay popup window</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="form-embed" className="text-left block text-lg font-medium text-gray-700">
                    GoHighLevel Iframe Embed Code
                  </Label>
                  <Textarea
                    id="form-embed"
                    placeholder="Paste your GoHighLevel form embed code here..."
                    value={formEmbedUrl}
                    onChange={(e) => setFormEmbedUrl(e.target.value)}
                    className="min-h-[120px] text-sm"
                  />
                </div>
              </div>
            )}

            {/* Embed Configuration */}
            {integrationMethod === 'embed' && (
              <div className="space-y-6">
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-center space-x-3">
                    <div className="bg-purple-600 text-white p-2 rounded-md">
                      <Code className="w-5 h-5" />
                    </div>
                    <div className="text-center">
                      <h4 className="font-medium text-purple-800">Embedded Form Setup</h4>
                      <p className="text-sm text-purple-700 mt-1">Embed forms directly into your listing pages</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <Label htmlFor="form-embed" className="text-left block text-lg font-medium text-gray-700">
                    GoHighLevel Form Embed Code
                  </Label>
                  <Textarea
                    id="form-embed"
                    placeholder="Paste your GoHighLevel form embed code here..."
                    value={formEmbedUrl}
                    onChange={(e) => setFormEmbedUrl(e.target.value)}
                    className="min-h-[120px] text-sm"
                  />
                </div>
              </div>
            )}

            {/* Common Custom Field Configuration for both popup and embed */}
            {(integrationMethod === 'popup' || integrationMethod === 'embed') && (
              <div className="space-y-3">
                <Label htmlFor="field-name" className="text-left block text-lg font-medium text-gray-700">
                  Custom Field Name
                </Label>
                <Input
                  id="field-name"
                  placeholder="listing"
                  value={customFieldName}
                  onChange={(e) => setCustomFieldName(e.target.value)}
                  className="text-lg p-4 h-auto"
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
                  <div className="bg-red-50 p-2 rounded-md">
                    <ShoppingBag className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-medium">Show Buy Now Button</h3>
                    <p className="text-sm text-gray-500">Display GoHighLevel's buy now button</p>
                  </div>
                </div>
                <Switch 
                  checked={showBuyNowButton}
                  onCheckedChange={setShowBuyNowButton}
                  id="show-buy-now" 
                />
              </div>

            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border border-indigo-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-yellow-50 p-2 rounded-md">
                    <ShoppingCart className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-medium">Convert Cart To Bookmarks</h3>
                    <p className="text-sm text-gray-500">Converts the cart feature into a book marking system.</p>
                  </div>
                </div>
                <Switch 
                  checked={showAddToCartButton}
                  onCheckedChange={setShowAddToCartButton}
                  id="show-add-cart" 
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
                    <span className="w-6 text-center">🛒</span>
                    <span className="ml-2"><strong>Buy Now Button:</strong> {showBuyNowButton ? 'Visible' : 'Hidden'}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-6 text-center">➕</span>
                    <span className="ml-2"><strong>Add to Cart:</strong> {showAddToCartButton ? 'Visible' : 'Hidden'}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-6 text-center">🔢</span>
                    <span className="ml-2"><strong>Quantity Selector:</strong> {showQuantitySelector ? 'Visible' : 'Hidden'}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-6 text-center">🛍️</span>
                    <span className="ml-2"><strong>Cart Icon:</strong> {showCartIcon ? 'Visible' : 'Hidden'}</span>
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

            {/* Summary Stats */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {[showDescription, showMetadata, showMaps].filter(Boolean).length}
                  </div>
                  <div className="text-sm text-blue-800">Enhanced Components</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {[showPrice, showBuyNowButton, showAddToCartButton, showQuantitySelector, showCartIcon].filter(Boolean).length}
                  </div>
                  <div className="text-sm text-blue-800">Visible Elements</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {
                      [showDescription, showMetadata, showMaps].filter(Boolean).length === 0 ? 'Basic' :
                      [showDescription, showMetadata, showMaps].filter(Boolean).length === 1 ? 'Enhanced' :
                      [showDescription, showMetadata, showMaps].filter(Boolean).length === 2 ? 'Advanced' : 'Premium'
                    }
                  </div>
                  <div className="text-sm text-blue-800">Configuration Level</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Slide>,

    // Slide 7: Generate Code
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

        {/* Generated CSS Code */}
        <Card className="bg-white/90 backdrop-blur-sm border border-green-200 text-left">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">GoHighLevel CSS Integration</h3>
              <Button
                onClick={() => {
                  const cssCode = generateFinalCSS();
                  navigator.clipboard.writeText(cssCode);
                }}
                className="bg-green-600 hover:bg-green-700"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy Code
              </Button>
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
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <h1 className="text-xl font-semibold text-gray-900">
            GoHighLevel Configuration Wizard
          </h1>
          
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

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <div className="max-w-6xl mx-auto">
          {slides[currentSlide]}
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="bg-white border-t border-gray-200 px-6 py-4">
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
            <Button className="flex items-center space-x-2 bg-green-600 hover:bg-green-700">
              <Download className="w-4 h-4" />
              <span>Download Code</span>
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