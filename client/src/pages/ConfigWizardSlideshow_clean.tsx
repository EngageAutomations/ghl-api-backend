import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ChevronLeft, ChevronRight, Rocket, Settings, FileText, Download, FolderOpen, Building2, Upload, ExternalLink, Code, MousePointer, DownloadIcon, Layout, MapPin, AlignLeft, DollarSign, ShoppingBag, ShoppingCart, Hash, Copy, Monitor, Zap } from 'lucide-react';
import DirectoryForm from '@/pages/DirectoryForm';

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
  // Navigation state
  const [currentSlide, setCurrentSlide] = useState(0);
  const [inputKey, setInputKey] = useState(0);

  // Form configuration state - Core settings
  const [directoryName, setDirectoryName] = useState<string>('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  // Integration method configuration
  const [integrationMethod, setIntegrationMethod] = useState<string>('embed');
  
  // GoHighLevel marketplace display options
  const [showPrice, setShowPrice] = useState<boolean>(true);
  const [showBuyNowButton, setShowBuyNowButton] = useState<boolean>(true);
  const [showAddToCartButton, setShowAddToCartButton] = useState<boolean>(true);
  const [showQuantitySelector, setShowQuantitySelector] = useState<boolean>(true);
  const [showCartIcon, setShowCartIcon] = useState<boolean>(true);
  const [convertCartToBookmarks, setConvertCartToBookmarks] = useState<boolean>(false);

  // Enhanced directory components
  const [showDescription, setShowDescription] = useState<boolean>(false);
  const [showMetadata, setShowMetadata] = useState<boolean>(false);
  const [showMaps, setShowMaps] = useState<boolean>(false);

  // Navigation functions
  const goToSlide = (slideIndex: number) => {
    setCurrentSlide(Math.max(0, Math.min(slideIndex, slides.length - 1)));
    setInputKey(prev => prev + 1);
  };

  const nextSlide = () => {
    setCurrentSlide(prev => Math.min(prev + 1, slides.length - 1));
    setInputKey(prev => prev + 1);
  };

  const prevSlide = () => {
    setCurrentSlide(prev => Math.max(prev - 1, 0));
    setInputKey(prev => prev + 1);
  };

  const goToSlideNumber = (slideNumber: number) => {
    setCurrentSlide(slideNumber);
    setInputKey(prev => prev + 1);
  };

  // File handling functions
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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const slides = useMemo(() => [
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
              <Code className="w-8 h-8 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Automated Code Generation</h3>
              <p className="text-sm text-gray-600">Ready-to-use CSS and JavaScript</p>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-white/70 backdrop-blur-sm">
            <CardContent className="p-6 text-center">
              <Monitor className="w-8 h-8 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-900 mb-2">Live Preview</h3>
              <p className="text-sm text-gray-600">See changes in real-time</p>
            </CardContent>
          </Card>
        </div>

        <Button 
          onClick={() => goToSlide(1)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white text-lg py-3"
        >
          Get Started
          <ChevronRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </Slide>,

    // Slide 1: Directory Setup
    <Slide key="directory-setup" className="bg-gradient-to-br from-green-50 to-emerald-100">
      <div className="text-center max-w-2xl mx-auto">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-600 rounded-full mb-6">
            <FolderOpen className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Directory Setup</h2>
          <p className="text-lg text-gray-600 mb-8">
            Configure your directory name and branding
          </p>
        </div>

        <Card className="bg-white border border-green-200 text-left">
          <CardContent className="p-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="directory-name">Directory Name</Label>
                <Input
                  key={inputKey}
                  id="directory-name"
                  placeholder="e.g., Tech Services Directory"
                  value={directoryName}
                  onChange={(e) => setDirectoryName(e.target.value)}
                  className="text-lg"
                />
              </div>

              <div className="space-y-2">
                <Label>Directory Logo (Optional)</Label>
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    isDragOver 
                      ? 'border-green-400 bg-green-50' 
                      : 'border-gray-300 hover:border-green-400'
                  }`}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                >
                  {logoFile ? (
                    <div className="space-y-2">
                      <div className="w-16 h-16 mx-auto bg-green-100 rounded-lg flex items-center justify-center">
                        <Building2 className="w-8 h-8 text-green-600" />
                      </div>
                      <p className="text-sm font-medium text-gray-900">{logoFile.name}</p>
                      <Button
                        onClick={() => {
                          setLogoFile(null);
                          setLogoUrl('');
                        }}
                        variant="outline"
                        size="sm"
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto" />
                      <p className="text-sm text-gray-600">
                        Drag and drop your logo here, or{' '}
                        <label className="text-green-600 hover:text-green-700 cursor-pointer">
                          browse files
                          <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileChange}
                          />
                        </label>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between mt-8">
          <Button 
            onClick={() => goToSlide(0)}
            variant="outline"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button 
            onClick={() => goToSlide(2)}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            Continue
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </Slide>,

    // Slide 2: Integration Method
    <Slide key="integration-method" className="bg-gradient-to-br from-purple-50 to-indigo-100">
      <div className="text-center max-w-2xl mx-auto">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-purple-600 rounded-full mb-6">
            <ExternalLink className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Integration Method</h2>
          <p className="text-lg text-gray-600 mb-8">
            Choose how you want to integrate with GoHighLevel
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card 
            className={`cursor-pointer transition-all border-2 ${
              integrationMethod === 'embed' 
                ? 'border-purple-500 bg-purple-50' 
                : 'border-gray-200 hover:border-purple-300'
            }`}
            onClick={() => setIntegrationMethod('embed')}
          >
            <CardContent className="p-6 text-center">
              <Code className="w-12 h-12 text-purple-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Embedded Forms</h3>
              <p className="text-sm text-gray-600">
                Embed forms directly into your pages for seamless integration
              </p>
            </CardContent>
          </Card>

          <Card 
            className={`cursor-pointer transition-all border-2 ${
              integrationMethod === 'popup' 
                ? 'border-purple-500 bg-purple-50' 
                : 'border-gray-200 hover:border-purple-300'
            }`}
            onClick={() => setIntegrationMethod('popup')}
          >
            <CardContent className="p-6 text-center">
              <MousePointer className="w-12 h-12 text-purple-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Popup Forms</h3>
              <p className="text-sm text-gray-600">
                Display forms in modal popups triggered by buttons
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-between">
          <Button 
            onClick={() => goToSlide(1)}
            variant="outline"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button 
            onClick={() => goToSlide(3)}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            Continue
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </Slide>,

    // Slide 3: GoHighLevel Options
    <Slide key="gohighlevel-options" className="bg-gradient-to-br from-orange-50 to-red-100">
      <div className="text-center max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-orange-600 rounded-full mb-6">
            <ShoppingBag className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">GoHighLevel Marketplace Options</h2>
          <p className="text-lg text-gray-600 mb-8">
            Configure which marketplace elements to show or hide
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
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
                  checked={convertCartToBookmarks}
                  onCheckedChange={setConvertCartToBookmarks}
                  id="convert-cart-bookmarks" 
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

        <div className="flex justify-between">
          <Button 
            onClick={() => goToSlide(2)}
            variant="outline"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button 
            onClick={() => goToSlide(4)}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            Continue
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </Slide>,

    // Slide 4: Form Embed Code & Live Preview
    <Slide key="form-preview" className="bg-gradient-to-br from-orange-50 to-amber-100">
      <div className="text-center max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-orange-600 rounded-full mb-6">
            <Code className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Form Embed Code & Live Preview</h2>
          <p className="text-lg text-gray-600 mb-8">
            Working form preview and embed code for GoHighLevel integration
          </p>
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

          {/* Form Embed Code */}
          <div className="space-y-4">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h4 className="font-medium text-orange-800 mb-3">Form Embed Code</h4>
              <div className="space-y-3">
                <div className="bg-white border border-orange-200 rounded p-3">
                  <code className="text-xs text-slate-700 break-all">
                    {`<iframe src="${window.location.origin}/form/your-location-id/your-directory-name" width="100%" height="600" frameborder="0"></iframe>`}
                  </code>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-orange-700">
                    <strong>Usage:</strong> This code can be used to place the form on any webpage, but is recommended for internal use since any submission will lead to product creation.
                  </p>
                  <p className="text-sm text-orange-700">
                    <strong>Best Practice:</strong> Use as a custom menu link within GoHighLevel for controlled access and better integration with your existing workflows.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-between mt-8">
          <Button 
            onClick={() => goToSlide(3)}
            variant="outline"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button 
            onClick={() => goToSlide(0)}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            Complete Setup
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </Slide>
  ], [
    directoryName, logoFile, integrationMethod, showPrice, showBuyNowButton, 
    showAddToCartButton, showQuantitySelector, showCartIcon, convertCartToBookmarks,
    showDescription, showMetadata, showMaps, inputKey, isDragOver
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-medium text-gray-900">Setup Progress</h2>
            <span className="text-sm text-gray-500">{currentSlide + 1} of {slides.length}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${((currentSlide + 1) / slides.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-24 pb-8">
        {slides[currentSlide]}
      </div>

      {/* Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-t border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Button
              onClick={prevSlide}
              disabled={currentSlide === 0}
              variant="outline"
              size="sm"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>

            {/* Slide indicators */}
            <div className="flex space-x-2">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlideNumber(index)}
                  className={`w-3 h-3 rounded-full transition-all ${
                    index === currentSlide
                      ? 'bg-blue-600'
                      : index < currentSlide
                      ? 'bg-green-400'
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              ))}
            </div>

            <Button
              onClick={nextSlide}
              disabled={currentSlide === slides.length - 1}
              size="sm"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}