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
  
  // Form configuration state
  const [buttonType, setButtonType] = useState<string>('popup');
  const [formEmbedUrl, setFormEmbedUrl] = useState<string>('');
  const [customFieldName, setCustomFieldName] = useState<string>('listing');
  const [buttonText, setButtonText] = useState<string>('Get More Info');
  
  // Button styling state
  const [buttonStyle, setButtonStyle] = useState<string>('solid');
  const [borderRadius, setBorderRadius] = useState<string>('8');

  // Copy button states
  const [cssCodeCopied, setCssCodeCopied] = useState<boolean>(false);
  const [headerCodeCopied, setHeaderCodeCopied] = useState<boolean>(false);
  const [footerCodeCopied, setFooterCodeCopied] = useState<boolean>(false);

  // Component toggles
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

  // Update button text based on type
  useEffect(() => {
    if (buttonType === 'popup') {
      setButtonText('Get Info');
    } else if (buttonType === 'download') {
      setButtonText('Download');
    } else if (buttonType === 'redirect') {
      setButtonText('Learn More');
    }
  }, [buttonType]);

  // Code generation using working function from config wizard
  const generatedCode = useMemo(() => {
    console.log('useMemo triggered, formEmbedUrl length:', formEmbedUrl.length);
    return generateCodeForSelection(formEmbedUrl, customFieldName);
  }, [formEmbedUrl, customFieldName]);

  // Copy to clipboard helper
  const copyToClipboard = (text: string, setStateFn: (copied: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setStateFn(true);
    setTimeout(() => setStateFn(false), 2000);
  };

  // Working code generation function
  function generateCodeForSelection(formEmbedUrl: string, customFieldName: string) {
    console.log('generateCodeForSelection called with formEmbedUrl:', formEmbedUrl.length, 'chars');
    
    if (!formEmbedUrl.trim()) {
      console.log('No formEmbedUrl provided, returning empty code');
      return {
        headerCode: '',
        footerCode: '',
        headerLength: 0,
        footerLength: 0
      };
    }

    // Parse the embed code for proper integration
    const parsedData = parseEmbedCode(formEmbedUrl);
    
    // Generate header code based on button type
    let headerCode = '';
    let footerCode = '';

    if (buttonType === 'popup') {
      headerCode = generateActionButtonPopup(parsedData, customFieldName, buttonText, buttonStyle, borderRadius);
    } else if (buttonType === 'embedded') {
      headerCode = generateEmbeddedFormCode(parsedData, customFieldName);
    } else if (buttonType === 'redirect') {
      // Generate redirect button code
      headerCode = `<style>
/* Action Button: Redirect */
.directory-action-btn {
  display: inline-block;
  padding: 12px 24px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.3s ease;
  border-radius: ${borderRadius}px;
  cursor: pointer;
  ${buttonStyle === 'solid' 
    ? 'background-color: #3b82f6; color: white; border: 2px solid #3b82f6;'
    : buttonStyle === 'outline'
    ? 'background-color: transparent; color: #3b82f6; border: 2px solid #3b82f6;'
    : 'background-color: transparent; color: #3b82f6; border: none;'
  }
}

.directory-action-btn:hover {
  ${buttonStyle === 'solid' 
    ? 'background-color: #2563eb;'
    : buttonStyle === 'outline'
    ? 'background-color: #3b82f6; color: white;'
    : 'background-color: rgba(59, 130, 246, 0.1);'
  }
}
</style>`;
    } else if (buttonType === 'download') {
      // Generate download button code
      headerCode = `<style>
/* Action Button: Download */
.directory-download-btn {
  display: inline-block;
  padding: 12px 24px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.3s ease;
  border-radius: ${borderRadius}px;
  cursor: pointer;
  ${buttonStyle === 'solid' 
    ? 'background-color: #059669; color: white; border: 2px solid #059669;'
    : buttonStyle === 'outline'
    ? 'background-color: transparent; color: #059669; border: 2px solid #059669;'
    : 'background-color: transparent; color: #059669; border: none;'
  }
}

.directory-download-btn:hover {
  ${buttonStyle === 'solid' 
    ? 'background-color: #047857;'
    : buttonStyle === 'outline'
    ? 'background-color: #059669; color: white;'
    : 'background-color: rgba(5, 150, 105, 0.1);'
  }
}
</style>`;
    }

    // Generate footer JavaScript code
    if (buttonType === 'popup') {
      footerCode = `<script>
(function() {
  const slug = new URLSearchParams(window.location.search).get('${customFieldName}') || 
              window.location.pathname.split('/').pop() || 'default';
  
  // Add popup buttons
  const buttons = document.querySelectorAll('.directory-action-btn');
  buttons.forEach(button => {
    button.addEventListener('click', function(e) {
      e.preventDefault();
      // Create popup
      const popup = document.createElement('div');
      popup.innerHTML = \`${formEmbedUrl.replace(/`/g, '\\`')}\`;
      popup.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);z-index:10000;display:flex;align-items:center;justify-content:center;';
      document.body.appendChild(popup);
      
      // Add close functionality
      popup.addEventListener('click', function(e) {
        if (e.target === popup) {
          document.body.removeChild(popup);
        }
      });
    });
  });
})();
</script>`;
    } else if (buttonType === 'redirect') {
      footerCode = `<script>
(function() {
  const buttons = document.querySelectorAll('.directory-action-btn');
  buttons.forEach(button => {
    button.addEventListener('click', function(e) {
      e.preventDefault();
      const slug = new URLSearchParams(window.location.search).get('${customFieldName}') || 
                  window.location.pathname.split('/').pop() || 'default';
      const redirectUrl = '${formEmbedUrl}' + (formEmbedUrl.includes('?') ? '&' : '?') + '${customFieldName}=' + encodeURIComponent(slug);
      window.open(redirectUrl, '_blank');
    });
  });
})();
</script>`;
    } else if (buttonType === 'download') {
      footerCode = `<script>
(function() {
  const buttons = document.querySelectorAll('.directory-download-btn');
  buttons.forEach(button => {
    button.addEventListener('click', function(e) {
      e.preventDefault();
      const downloadUrl = '${formEmbedUrl}';
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = '';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  });
})();
</script>`;
    }

    const result = {
      headerCode,
      footerCode,
      headerLength: headerCode.length,
      footerLength: footerCode.length
    };

    console.log('Generated code result:', result);
    return result;
  }

  const slides = [
    // Slide 1: Welcome
    <Slide key={1}>
      <div className="text-center space-y-8">
        <div className="flex items-center justify-center mb-8">
          <div className="bg-blue-500 text-white p-4 rounded-full mr-4">
            <Rocket className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-slate-900">GoHighLevel Directory Wizard</h1>
            <p className="text-xl text-slate-600">Create powerful directory listings with lead capture</p>
          </div>
        </div>

        <div className="max-w-3xl mx-auto space-y-6">
          <Card>
            <CardContent className="p-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-6">What You'll Build</h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-slate-900">Features</h3>
                  <ul className="space-y-2 text-slate-600">
                    <li className="flex items-center">
                      <Check className="w-4 h-4 text-green-600 mr-2" />
                      Action buttons (Popup, Download, Redirect)
                    </li>
                    <li className="flex items-center">
                      <Check className="w-4 h-4 text-green-600 mr-2" />
                      Embedded forms
                    </li>
                    <li className="flex items-center">
                      <Check className="w-4 h-4 text-green-600 mr-2" />
                      Custom styling options
                    </li>
                    <li className="flex items-center">
                      <Check className="w-4 h-4 text-green-600 mr-2" />
                      Google Drive integration
                    </li>
                  </ul>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-slate-900">What You Get</h3>
                  <ul className="space-y-2 text-slate-600">
                    <li className="flex items-center">
                      <Check className="w-4 h-4 text-green-600 mr-2" />
                      Ready-to-use HTML/CSS/JS code
                    </li>
                    <li className="flex items-center">
                      <Check className="w-4 h-4 text-green-600 mr-2" />
                      Mobile-responsive design
                    </li>
                    <li className="flex items-center">
                      <Check className="w-4 h-4 text-green-600 mr-2" />
                      Lead tracking system
                    </li>
                    <li className="flex items-center">
                      <Check className="w-4 h-4 text-green-600 mr-2" />
                      Professional directory listings
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Slide>,

    // Slide 2: Google Drive Connection
    <Slide key={2}>
      <div className="space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-slate-900">Connect Google Drive</h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Optional: Connect your Google Drive to automatically upload and manage listing images.
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          <Card>
            <CardContent className="p-8">
              <div className="text-center space-y-6">
                <div className="bg-green-100 p-4 rounded-full w-20 h-20 mx-auto flex items-center justify-center">
                  <FolderOpen className="w-10 h-10 text-green-600" />
                </div>
                
                {!googleDriveConnected ? (
                  <>
                    <h3 className="text-xl font-semibold text-slate-900">Connect Your Google Drive</h3>
                    <p className="text-slate-600 max-w-md mx-auto">
                      Upload images directly to your Google Drive and get shareable links for your directory listings.
                    </p>
                    <Button
                      size="lg"
                      onClick={() => {
                        // Simulate connection for demo
                        setGoogleDriveConnected(true);
                        setGoogleDriveEmail('demo@example.com');
                      }}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Connect Google Drive
                    </Button>
                    <p className="text-sm text-slate-500">
                      You can skip this step and upload images manually later
                    </p>
                  </>
                ) : (
                  <>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                      <div className="flex items-center justify-center space-x-3">
                        <Check className="w-6 h-6 text-green-600" />
                        <div className="text-center">
                          <h3 className="text-lg font-semibold text-green-900">Google Drive Connected</h3>
                          <p className="text-green-700">{googleDriveEmail}</p>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setGoogleDriveConnected(false);
                        setGoogleDriveEmail('');
                      }}
                    >
                      Disconnect
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
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
                        {buttonText}
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

    // Slide 4: Summary & Code Generation
    <Slide key={4}>
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
                <span className="text-green-700">Integration Method:</span>
                <span className="font-medium text-green-800 capitalize">{buttonType}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-green-700">Google Drive:</span>
                <span className="font-medium text-green-800">{googleDriveConnected ? 'Connected' : 'Not connected'}</span>
              </div>
              {(buttonType === 'popup' || buttonType === 'download' || buttonType === 'redirect') && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-green-700">Button Style:</span>
                    <span className="font-medium text-green-800 capitalize">{buttonStyle}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-green-700">Border Radius:</span>
                    <span className="font-medium text-green-800">{borderRadius}px</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Header Code */}
          {generatedCode.headerCode && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-900">Header Code</h3>
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
                
                <div className="bg-slate-900 text-slate-100 p-4 rounded-lg h-32 overflow-auto">
                  <pre className="text-sm whitespace-pre-wrap break-words overflow-wrap-anywhere">
                    {generatedCode.headerCode}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Footer Code */}
          {generatedCode.footerCode && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-900">Footer Code</h3>
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
                
                <div className="bg-slate-900 text-slate-100 p-4 rounded-lg h-32 overflow-auto">
                  <pre className="text-sm whitespace-pre-wrap break-words overflow-wrap-anywhere">
                    {generatedCode.footerCode}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-800 mb-4">Next Steps</h3>
            <ol className="text-blue-700 space-y-2 text-left">
              <li>1. Copy the header code and add it to your GoHighLevel page</li>
              <li>2. Copy the footer code and add it to your page</li>
              <li>3. Test the integration on your live site</li>
              <li>4. Start adding listings to your directory</li>
            </ol>
          </div>
        </div>
      </div>
    </Slide>
  ];

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Navigation */}
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-10 bg-white/90 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg border border-white/20">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={prevSlide}
            disabled={currentSlide === 0}
            className="rounded-full"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <span className="font-medium text-slate-700">
            {currentSlide + 1} / {slides.length}
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={nextSlide}
            disabled={currentSlide === slides.length - 1}
            className="rounded-full"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Slide Content */}
      <div className="relative">
        {slides[currentSlide]}
      </div>

      {/* Progress Indicators */}
      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-3 h-3 rounded-full transition-colors ${
              index === currentSlide 
                ? 'bg-blue-600' 
                : 'bg-white/50 hover:bg-white/75'
            }`}
          />
        ))}
      </div>
    </div>
  );
}