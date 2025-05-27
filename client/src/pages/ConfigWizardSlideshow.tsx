import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Rocket, Settings, FileText, Download } from 'lucide-react';

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

    // Slide 1: Form Configuration (placeholder for now)
    <Slide key="form-config" className="bg-gradient-to-br from-green-50 to-emerald-100">
      <div className="text-center max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Form Configuration</h2>
        <p className="text-lg text-gray-600 mb-8">
          Configure your form integration settings
        </p>
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-8 border border-green-200">
          <p className="text-gray-600">Form configuration options will appear here...</p>
        </div>
      </div>
    </Slide>,

    // Slide 2: Content Settings (placeholder for now)
    <Slide key="content-settings" className="bg-gradient-to-br from-purple-50 to-violet-100">
      <div className="text-center max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Content Settings</h2>
        <p className="text-lg text-gray-600 mb-8">
          Customize your content display options
        </p>
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-8 border border-purple-200">
          <p className="text-gray-600">Content settings will appear here...</p>
        </div>
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