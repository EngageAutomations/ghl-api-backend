import { useState, ReactNode, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getConfig, saveConfig } from "@/lib/config-store";

interface ConfigWizardProps {
  title: string;
  description?: string;
  children: ReactNode;
}

interface WizardStepProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export function WizardStep({ title, description, children }: WizardStepProps) {
  // Check if this is the form listing step that needs preview
  const isFormStep = title === "Listing Form Embed Code" || description?.includes("form");
  
  if (isFormStep) {
    return (
      <div className="w-full bg-white p-8 rounded-lg border border-slate-100 shadow-sm mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Configuration Controls */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">Form Configuration</h2>
            {children}
          </div>
          
          {/* Live Preview */}
          <div className="border rounded-lg p-4 bg-slate-50">
            <h3 className="text-sm font-medium text-slate-600 mb-3">Live Preview</h3>
            <div className="bg-white border rounded-md shadow-sm p-4 h-[500px] overflow-auto">
              {/* Simple form preview placeholder */}
              <div className="text-center py-8">
                <div className="inline-flex justify-center items-center h-12 w-36 bg-indigo-500 rounded mb-4">
                  <span className="text-white font-semibold">Directory</span>
                </div>
                <p className="text-lg font-medium mb-6">Create New Listing</p>
                <div className="space-y-4 text-left">
                  <div className="border rounded p-3">
                    <label className="block text-sm font-medium mb-1">Title</label>
                    <input type="text" className="w-full p-2 border rounded" placeholder="Product title" />
                  </div>
                  <div className="border rounded p-3">
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea className="w-full p-2 border rounded h-20" placeholder="Description"></textarea>
                  </div>
                </div>
              </div>
              
            </div>
            <div className="mt-2 text-xs text-slate-500">
              This preview shows how your form will appear to users. Fields shown depend on your configuration.
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Regular step without preview
  return (
    <div className="w-full bg-white p-8 rounded-lg border border-slate-100 shadow-sm mb-6">
      {children}
    </div>
  );
}

export function ConfigWizard({ title, description, children }: ConfigWizardProps) {
  const [currentStep, setCurrentStep] = useState(-1); // -1 for welcome screen, 0+ for steps
  const steps = Array.isArray(children) ? children : [children];
  
  const goToNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };
  
  const goToPrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else if (currentStep === 0) {
      // Go back to welcome screen
      setCurrentStep(-1);
    }
  };
  
  const slideVariants = {
    enter: (direction: number) => {
      return {
        x: direction > 0 ? 1000 : -1000,
        opacity: 0,
        y: 0 // Keep vertical position consistent
      };
    },
    center: {
      zIndex: 1,
      x: 0,
      y: 0, // Keep vertical position consistent
      opacity: 1
    },
    exit: (direction: number) => {
      return {
        zIndex: 0,
        x: direction < 0 ? 1000 : -1000,
        y: 0, // Keep vertical position consistent
        opacity: 0
      };
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Fixed height container to prevent jumping */}
      <div className="relative min-h-[600px]">
        <AnimatePresence initial={false} mode="wait">
          {currentStep === -1 ? (
            <motion.div 
              key="welcome"
              initial={{ opacity: 0, x: -100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              transition={{ type: "tween", duration: 0.4, ease: "easeInOut" }}
              className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center text-center px-4"
            >
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              </div>
              <h1 className="text-3xl font-bold text-slate-800 mb-4">{title}</h1>
              {description && (
                <p className="text-slate-500 mb-8 max-w-2xl mx-auto leading-relaxed">{description}</p>
              )}
              <Button 
                size="lg" 
                onClick={() => setCurrentStep(0)}
                className="px-8 py-6 text-base"
              >
                Get Started
              </Button>
              <p className="text-xs text-slate-400 mt-8">This will guide you through the setup process step by step</p>
            </motion.div>
          ) : (
            <motion.div 
              key={`step-${currentStep}`}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ type: "tween", duration: 0.4, ease: "easeInOut" }}
              className="absolute top-0 left-0 w-full h-full"
            >
              <div className="px-1">
                {steps[currentStep]}
                
                <div className="flex justify-between mt-6 mb-8">
                  <Button
                    variant="outline"
                    onClick={goToPrevious}
                    disabled={currentStep === -1}
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  
                  <Button
                    onClick={goToNext}
                    disabled={currentStep === steps.length - 1}
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Step indicator dots */}
      {currentStep >= 0 && (
        <div className="flex justify-center mt-8">
          {steps.map((_, index) => (
            <button
              key={index}
              className={`w-2.5 h-2.5 rounded-full mx-1 ${
                currentStep === index ? "bg-primary" : "bg-slate-200"
              }`}
              onClick={() => setCurrentStep(index)}
              aria-label={`Go to step ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}