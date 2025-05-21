import { useState, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
  return (
    <div className="w-full bg-white p-8 rounded-lg border border-slate-100 shadow-sm">
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
        opacity: 0
      };
    },
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => {
      return {
        zIndex: 0,
        x: direction < 0 ? 1000 : -1000,
        opacity: 0
      };
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <AnimatePresence initial={false} custom={currentStep}>
        {currentStep === -1 ? (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="text-center py-16 px-4"
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
            custom={currentStep}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 }
            }}
            className="w-full"
          >
            {steps[currentStep]}
            
            <div className="flex justify-between mt-6">
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
          </motion.div>
        )}
      </AnimatePresence>
      
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