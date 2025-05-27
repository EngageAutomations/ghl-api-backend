import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronLeft, ChevronRight, Rocket, Settings, FileText, Download, FolderOpen, Building2, Upload } from 'lucide-react';

interface SlideProps {
  children: React.ReactNode;
  className?: string;
}

function Slide({ children, className = "" }: SlideProps) {
  return (
    <div className={`min-h-[600px] flex flex-col justify-center items-center p-8 ${className}`}>
      {children}
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

        <Card className="bg-white/80 backdrop-blur-sm border border-red-200 max-w-lg mx-auto">
          <CardContent className="p-8">
            {!googleDriveConnected ? (
              <div className="text-center">
                <div className="bg-slate-50 rounded-lg p-6 mb-6">
                  <svg className="w-16 h-16 text-slate-400 mx-auto mb-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                    <polyline points="14,2 14,8 20,8"/>
                  </svg>
                  <h3 className="text-xl font-semibold text-slate-900 mb-3">Google Drive Integration</h3>
                  <p className="text-slate-600 mb-6">
                    Store and manage your directory images with Google Drive integration. 
                    Your images will be organized in a dedicated "Directory Images" folder.
                  </p>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <h4 className="text-sm font-medium text-blue-800 mb-2">Benefits:</h4>
                    <ul className="text-sm text-blue-700 text-left space-y-1">
                      <li>• Centralized image storage and management</li>
                      <li>• Easy sharing and collaboration</li>
                      <li>• Automatic backup and sync</li>
                      <li>• Access from anywhere</li>
                    </ul>
                  </div>
                </div>
                <Button 
                  onClick={() => setGoogleDriveConnected(true)}
                  className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 text-lg"
                >
                  Connect Google Drive
                </Button>
              </div>
            ) : (
              <div className="text-center">
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
          </CardContent>
        </Card>
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
                <Label className="text-left block text-lg font-medium text-gray-700">
                  Logo Upload (Optional)
                </Label>
                <div className="space-y-2">
                  {/* Drag and Drop Area */}
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    className={`
                      border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer
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
                      <Upload className="w-10 h-10 text-gray-400 mx-auto mb-4" />
                      <div className="space-y-2">
                        <p className="text-lg font-medium text-gray-700">
                          {isDragOver ? 'Drop your logo here' : 'Drag and drop your logo'}
                        </p>
                        <p className="text-sm text-gray-500">
                          or click to browse files
                        </p>
                        <p className="text-xs text-gray-400">
                          PNG, JPG, SVG up to 5MB
                        </p>
                      </div>
                    </label>
                  </div>
                  {logoFile && (
                    <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
                      ✓ Uploaded: {logoFile.name} ({(logoFile.size / 1024).toFixed(1)}KB)
                    </div>
                  )}
                </div>
              </div>

              {/* Logo Preview */}
              {logoUrl && (
                <div className="space-y-3">
                  <Label className="text-left block text-lg font-medium text-gray-700">
                    Logo Preview
                  </Label>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex justify-center">
                    <img
                      src={logoUrl}
                      alt="Logo Preview"
                      className="max-h-16 max-w-full object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const errorDiv = document.createElement('div');
                        errorDiv.className = 'text-red-500 text-sm';
                        errorDiv.textContent = 'Unable to load image from this URL';
                        target.parentNode?.appendChild(errorDiv);
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Info Card */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Upload className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="text-left">
                    <h4 className="text-sm font-medium text-blue-800 mb-1">Logo Upload Tips:</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Use PNG or SVG format for best quality</li>
                      <li>• Recommended size: 200x60px or similar ratio</li>
                      <li>• File size should be under 5MB</li>
                      <li>• JPG, PNG, and SVG formats are supported</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Current Configuration Summary */}
              {(directoryName || logoFile) && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-green-800 mb-2">Current Configuration:</h4>
                  <div className="text-sm text-green-700 space-y-1 text-left">
                    {directoryName && <p><strong>Directory:</strong> {directoryName}</p>}
                    {logoFile && <p><strong>Logo:</strong> {logoFile.name} uploaded</p>}
                    {!directoryName && <p className="text-green-600 italic">Enter a directory name to continue</p>}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Slide>,

    // Slide 3: Generate Code (placeholder for now)
    <Slide key="generate-code" className="bg-gradient-to-br from-orange-50 to-amber-100">
      <div className="text-center max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Generate Integration Code</h2>
        <p className="text-lg text-gray-600 mb-8">
          Your customized GoHighLevel integration is ready
        </p>
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-8 border border-orange-200">
          <p className="text-gray-600">Code generation and download options will appear here...</p>
        </div>
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