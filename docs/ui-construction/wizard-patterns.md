# Wizard UI Construction Patterns

This document outlines the UI construction patterns used in the directory integration wizard, providing reusable templates for building similar multi-step interfaces quickly.

## Core Wizard Structure

### Base Component Pattern
```tsx
import { ConfigWizard, WizardStep } from "@/components/ui/config-wizard";

export default function YourWizard() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <ConfigWizard>
        <WizardStep title="Step Title" description="Step description">
          {/* Step content */}
        </WizardStep>
        {/* More steps */}
      </ConfigWizard>
    </div>
  );
}
```

### State Management Pattern
```tsx
// Local state for immediate UI feedback
const [localValue, setLocalValue] = useState("");

// Global config state for persistence
const { config, updateConfig } = useConfig();

// Sync pattern
useEffect(() => {
  setLocalValue(config.someField || "");
}, [config.someField]);
```

## Common Step Types

### 1. Welcome/Introduction Step
**Purpose**: Set expectations and provide overview

```tsx
<WizardStep 
  title="Welcome to Setup" 
  description="Let's configure your integration"
>
  <div className="space-y-6 py-10 text-center">
    <div className="text-6xl mb-6">🚀</div>
    <h2 className="text-2xl font-bold text-slate-800 mb-4">
      Get Started
    </h2>
    <p className="text-slate-600 max-w-lg mx-auto mb-8">
      Description of what the wizard will accomplish
    </p>
    <div className="bg-blue-50 border border-blue-100 rounded-lg p-6">
      <h3 className="text-sm font-medium text-blue-800 mb-2">
        What you'll configure:
      </h3>
      <ul className="list-disc pl-5 text-xs space-y-1 text-blue-700">
        <li>Feature one</li>
        <li>Feature two</li>
        <li>Feature three</li>
      </ul>
    </div>
  </div>
</WizardStep>
```

### 2. Basic Configuration Step
**Purpose**: Simple form inputs and toggles

```tsx
<WizardStep 
  title="Basic Settings" 
  description="Configure core options"
>
  <div className="space-y-6 py-8">
    <div className="space-y-2">
      <Label htmlFor="field-name">Field Name</Label>
      <Input
        id="field-name"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        placeholder="Enter value"
      />
      <p className="text-xs text-slate-500">
        Helper text explaining the field
      </p>
    </div>
    
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="space-y-1">
        <Label>Enable Feature</Label>
        <p className="text-sm text-slate-500">
          Description of what this toggle does
        </p>
      </div>
      <Switch
        checked={featureEnabled}
        onCheckedChange={setFeatureEnabled}
      />
    </div>
    
    <Button 
      onClick={() => updateConfig({ fieldName: localValue })}
      className="w-full"
    >
      Save Settings
    </Button>
  </div>
</WizardStep>
```

### 3. Advanced Configuration with Collapsible Sections
**Purpose**: Organize complex settings with progressive disclosure

```tsx
<WizardStep 
  title="Advanced Options" 
  description="Customize detailed settings"
>
  <div className="space-y-6 py-8">
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="styling">
        <AccordionTrigger>
          <div className="flex items-center gap-2">
            <span>Styling Options</span>
            {stylingEnabled && (
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                Configured
              </span>
            )}
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-4 pt-4">
            {/* Styling controls */}
          </div>
        </AccordionContent>
      </AccordionItem>
      
      <AccordionItem value="integration">
        <AccordionTrigger>Integration Settings</AccordionTrigger>
        <AccordionContent>
          {/* Integration controls */}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  </div>
</WizardStep>
```

### 4. Preview/Review Step
**Purpose**: Show configured settings and allow final adjustments

```tsx
<WizardStep 
  title="Review Configuration" 
  description="Verify your settings"
>
  <div className="space-y-6 py-8">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <h3 className="font-medium text-slate-800">Configuration Summary</h3>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Directory Name:</span>
            <span className="font-medium">{config.directoryName}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Action Button:</span>
            <span className="font-medium">
              {config.enableActionButton ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        </div>
      </div>
      
      <div className="space-y-4">
        <h3 className="font-medium text-slate-800">Live Preview</h3>
        <div className="border border-slate-200 rounded-md p-4 bg-slate-50">
          {/* Preview component */}
        </div>
      </div>
    </div>
  </div>
</WizardStep>
```

### 5. Code Generation Step
**Purpose**: Display generated code with copy functionality

```tsx
<WizardStep 
  title="Generated Code" 
  description="Copy and implement these snippets"
>
  <div className="space-y-6 py-8">
    <Accordion type="multiple" className="w-full">
      <AccordionItem value="header">
        <AccordionTrigger>
          <div className="flex items-center gap-2">
            <span>Header Code</span>
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
              Add to &lt;head&gt;
            </span>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="border border-slate-200 rounded-md overflow-hidden">
            <div className="bg-slate-800 px-4 py-2 flex justify-between items-center">
              <span className="text-slate-300 text-sm">HTML</span>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-slate-300 hover:text-white"
                onClick={() => navigator.clipboard.writeText(headerCode)}
              >
                <Copy className="w-4 h-4 mr-1" />
                Copy
              </Button>
            </div>
            <pre className="bg-slate-900 text-slate-100 p-4 text-sm overflow-x-auto">
              <code>{headerCode}</code>
            </pre>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
    
    <div className="text-center mt-8">
      <Button 
        size="lg" 
        className="px-8 py-2 text-base"
        onClick={downloadAllCode}
      >
        Download All Code
      </Button>
    </div>
  </div>
</WizardStep>
```

### 6. Success/Completion Step
**Purpose**: Celebrate completion and provide next steps

```tsx
<WizardStep 
  title="Setup Complete!" 
  description="Your integration is ready"
>
  <div className="space-y-6 py-10 text-center">
    <div className="text-6xl mb-6">🎉</div>
    <h2 className="text-2xl font-bold text-slate-800 mb-4">
      Congratulations!
    </h2>
    <p className="text-slate-600 max-w-lg mx-auto mb-8">
      Your directory integration is configured and ready to deploy.
    </p>
    
    <div className="bg-green-50 border border-green-100 rounded-lg p-6 max-w-lg mx-auto">
      <h3 className="text-sm font-medium text-green-800 mb-2">
        ✅ What's Been Set Up
      </h3>
      <ul className="text-xs text-green-700 space-y-1">
        <li>• Smart code generation system</li>
        <li>• Dynamic feature loading</li>
        <li>• Optimized integration code</li>
      </ul>
    </div>
    
    <div className="space-y-3 mt-8">
      <Button size="lg" className="w-full max-w-md">
        Deploy Integration
      </Button>
      <Button variant="outline" size="lg" className="w-full max-w-md">
        Download Documentation
      </Button>
    </div>
  </div>
</WizardStep>
```

## Reusable UI Components

### Status Badge Component
```tsx
const StatusBadge = ({ enabled, label }: { enabled: boolean; label: string }) => (
  <span className={`px-2 py-1 text-xs rounded ${
    enabled 
      ? 'bg-green-100 text-green-800' 
      : 'bg-gray-100 text-gray-600'
  }`}>
    {enabled ? '✓' : '○'} {label}
  </span>
);
```

### Configuration Summary Card
```tsx
const ConfigCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="border border-slate-200 rounded-lg p-4">
    <h4 className="font-medium text-slate-800 mb-3">{title}</h4>
    <div className="space-y-2">
      {children}
    </div>
  </div>
);
```

### Feature Toggle with Description
```tsx
const FeatureToggle = ({ 
  title, 
  description, 
  enabled, 
  onToggle 
}: {
  title: string;
  description: string;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}) => (
  <div className="flex items-start justify-between p-4 border rounded-lg">
    <div className="space-y-1 flex-1">
      <Label className="text-base font-medium">{title}</Label>
      <p className="text-sm text-slate-500">{description}</p>
    </div>
    <Switch checked={enabled} onCheckedChange={onToggle} />
  </div>
);
```

## Layout Patterns

### Two-Column Layout for Complex Steps
```tsx
<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
  <div className="space-y-6">
    {/* Configuration controls */}
  </div>
  <div className="space-y-6">
    {/* Preview or additional info */}
  </div>
</div>
```

### Progress Indicators
```tsx
<div className="mb-8">
  <div className="flex items-center justify-between text-sm text-slate-600">
    <span>Step {currentStep} of {totalSteps}</span>
    <span>{Math.round((currentStep / totalSteps) * 100)}% complete</span>
  </div>
  <div className="w-full bg-slate-200 rounded-full h-2 mt-2">
    <div 
      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
      style={{ width: `${(currentStep / totalSteps) * 100}%` }}
    />
  </div>
</div>
```

## State Management Patterns

### Local vs Global State
- **Local State**: Immediate UI feedback, form inputs, temporary values
- **Global State**: Persistent configuration, cross-step data sharing

### Validation Patterns
```tsx
const [errors, setErrors] = useState<Record<string, string>>({});

const validateStep = () => {
  const newErrors: Record<string, string> = {};
  
  if (!localValue.trim()) {
    newErrors.fieldName = "This field is required";
  }
  
  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};
```

### Auto-save Pattern
```tsx
useEffect(() => {
  const timer = setTimeout(() => {
    if (localValue !== config.fieldName) {
      updateConfig({ fieldName: localValue });
    }
  }, 500); // Debounce 500ms
  
  return () => clearTimeout(timer);
}, [localValue]);
```

These patterns provide a solid foundation for building consistent, user-friendly wizards quickly and efficiently!