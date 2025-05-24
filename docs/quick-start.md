# Quick Start Guide

Get your directory integration up and running in 5 minutes with this condensed setup guide.

## ⚡ 5-Minute Setup Checklist

### 1. Basic Configuration (2 minutes)
```tsx
// Import the wizard components
import { ConfigWizard, WizardStep } from "@/components/ui/config-wizard";
import { useConfig } from "@/context/ConfigContext";

// Basic wizard structure
export default function YourWizard() {
  const { config, updateConfig } = useConfig();
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <ConfigWizard>
        <WizardStep title="Welcome" description="Get started">
          {/* Your content */}
        </WizardStep>
      </ConfigWizard>
    </div>
  );
}
```

### 2. Add Feature Toggles (1 minute)
```tsx
<div className="flex items-center justify-between p-4 border rounded-lg">
  <div className="space-y-1">
    <Label>Enable Feature</Label>
    <p className="text-sm text-slate-500">Feature description</p>
  </div>
  <Switch
    checked={config.featureEnabled}
    onCheckedChange={(enabled) => updateConfig({ featureEnabled: enabled })}
  />
</div>
```

### 3. Configure State Management (1 minute)
```tsx
// Local state for immediate feedback
const [localValue, setLocalValue] = useState("");

// Sync with global config
useEffect(() => {
  setLocalValue(config.fieldName || "");
}, [config.fieldName]);

// Auto-save with debounce
useEffect(() => {
  const timer = setTimeout(() => {
    if (localValue !== config.fieldName) {
      updateConfig({ fieldName: localValue });
    }
  }, 500);
  return () => clearTimeout(timer);
}, [localValue]);
```

### 4. Add Code Generation (1 minute)
```tsx
const generateCode = () => {
  let code = `<!-- Base Integration -->`;
  
  if (config.featureEnabled) {
    code += `\n<!-- Feature Code -->`;
  }
  
  return code;
};

<Button onClick={() => navigator.clipboard.writeText(generateCode())}>
  Copy Code
</Button>
```

## 🎯 Essential Patterns

### Form Input with Validation
```tsx
<div className="space-y-2">
  <Label htmlFor="field">Field Name</Label>
  <Input
    id="field"
    value={localValue}
    onChange={(e) => setLocalValue(e.target.value)}
    className={errors.field ? "border-red-500" : ""}
  />
  {errors.field && (
    <p className="text-sm text-red-600">{errors.field}</p>
  )}
</div>
```

### Collapsible Advanced Options
```tsx
<Accordion type="single" collapsible>
  <AccordionItem value="advanced">
    <AccordionTrigger>Advanced Settings</AccordionTrigger>
    <AccordionContent>
      {/* Advanced controls */}
    </AccordionContent>
  </AccordionItem>
</Accordion>
```

### Code Block with Copy
```tsx
<div className="border rounded-md overflow-hidden">
  <div className="bg-slate-800 px-4 py-2 flex justify-between">
    <span className="text-slate-300 text-sm">HTML</span>
    <Button size="sm" onClick={() => copy(code)}>
      Copy
    </Button>
  </div>
  <pre className="bg-slate-900 text-slate-100 p-4">
    <code>{code}</code>
  </pre>
</div>
```

## 🚨 Common Gotchas & Solutions

### 1. State Not Syncing
**Problem**: Local state and global config out of sync
**Solution**: Always use useEffect to sync state
```tsx
useEffect(() => {
  setLocalValue(config.fieldName || "");
}, [config.fieldName]);
```

### 2. Infinite Re-renders
**Problem**: Missing dependencies in useEffect
**Solution**: Include all dependencies
```tsx
useEffect(() => {
  // Do something
}, [dependency1, dependency2]); // Include all dependencies
```

### 3. Code Not Updating
**Problem**: Conditional logic not checking feature flags
**Solution**: Always check feature state
```tsx
if (showFeature) {
  code += featureCode;
}
```

### 4. Toast Not Showing
**Problem**: Missing toast provider
**Solution**: Wrap app with Toaster
```tsx
import { Toaster } from "@/components/ui/toaster";

<App>
  <YourContent />
  <Toaster />
</App>
```

## 📋 Pre-flight Checklist

Before deploying your wizard:

- [ ] All feature toggles work correctly
- [ ] Code generation respects feature states
- [ ] Local and global state sync properly
- [ ] Form validation provides clear feedback
- [ ] Copy-to-clipboard functionality works
- [ ] Toast notifications appear
- [ ] Mobile responsiveness tested
- [ ] Error boundaries in place
- [ ] Loading states implemented

## 🔧 Development Tools

### Debug Config State
```tsx
// Add to any component to debug config
console.log('Current config:', config);
```

### Test Feature Toggles
```tsx
// Quickly test all combinations
const testConfigs = [
  { feature1: true, feature2: false },
  { feature1: false, feature2: true },
  { feature1: true, feature2: true }
];
```

### Validate Generated Code
```tsx
const validateCode = (code: string) => {
  // Check for required elements
  if (!code.includes('window.GHLDirectory')) {
    console.warn('Missing base integration');
  }
};
```

That's it! You now have a fully functional wizard following all the established patterns. For more detailed information, refer to the comprehensive guides in the documentation.