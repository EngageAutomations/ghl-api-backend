# Component Architecture & Reusability

This document outlines the component architecture used in the directory integration system, focusing on reusable patterns and modular design.

## Component Hierarchy

```
ConfigWizardDemo (Main Container)
├── ConfigWizard (Step Navigation)
│   ├── WizardStep (Individual Steps)
│   │   ├── FeatureToggle Components
│   │   ├── ConfigurationCards
│   │   └── CodeGenerationBlocks
│   └── WizardNavigation (Auto-generated)
├── ConfigContext (Global State)
└── Toast System (Feedback)
```

## Core Component Patterns

### 1. Container Components
**Purpose**: Manage state and orchestrate child components

```tsx
// Pattern: Smart Container Component
export default function ConfigWizardDemo() {
  // State management
  const [localState, setLocalState] = useState();
  const { config, updateConfig } = useConfig();
  
  // Event handlers
  const handleFeatureToggle = (feature: string, enabled: boolean) => {
    updateConfig({ [feature]: enabled });
  };
  
  // Render UI
  return (
    <ConfigWizard>
      {/* Steps with props */}
    </ConfigWizard>
  );
}
```

### 2. Presentation Components
**Purpose**: Display UI without managing complex state

```tsx
// Pattern: Pure Presentation Component
interface FeatureCardProps {
  title: string;
  description: string;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  badge?: string;
}

export const FeatureCard = ({ title, description, enabled, onToggle, badge }: FeatureCardProps) => (
  <div className="flex items-start justify-between p-4 border rounded-lg">
    <div className="space-y-1 flex-1">
      <div className="flex items-center gap-2">
        <Label className="text-base font-medium">{title}</Label>
        {badge && <StatusBadge label={badge} enabled={enabled} />}
      </div>
      <p className="text-sm text-slate-500">{description}</p>
    </div>
    <Switch checked={enabled} onCheckedChange={onToggle} />
  </div>
);
```

### 3. Compound Components
**Purpose**: Group related functionality with flexible composition

```tsx
// Pattern: Compound Component with Context
const CodeBlock = ({ children }: { children: React.ReactNode }) => (
  <div className="border border-slate-200 rounded-md overflow-hidden">
    {children}
  </div>
);

const CodeHeader = ({ language, onCopy }: { language: string; onCopy: () => void }) => (
  <div className="bg-slate-800 px-4 py-2 flex justify-between items-center">
    <span className="text-slate-300 text-sm">{language}</span>
    <Button variant="ghost" size="sm" onClick={onCopy}>
      <Copy className="w-4 h-4 mr-1" />
      Copy
    </Button>
  </div>
);

const CodeContent = ({ children }: { children: React.ReactNode }) => (
  <pre className="bg-slate-900 text-slate-100 p-4 text-sm overflow-x-auto">
    <code>{children}</code>
  </pre>
);

// Usage
<CodeBlock>
  <CodeHeader language="HTML" onCopy={() => copy(headerCode)} />
  <CodeContent>{headerCode}</CodeContent>
</CodeBlock>
```

## State Management Architecture

### 1. Local State Pattern
**Use for**: UI state, form inputs, temporary values

```tsx
const [isExpanded, setIsExpanded] = useState(false);
const [localValue, setLocalValue] = useState("");
const [errors, setErrors] = useState<Record<string, string>>({});
```

### 2. Global Configuration State
**Use for**: Persistent settings, cross-component data

```tsx
// Context Provider Pattern
const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<DesignerConfig>(defaultConfig);
  
  const updateConfig = (updates: Partial<DesignerConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
    saveConfig({ ...config, ...updates });
  };
  
  return (
    <ConfigContext.Provider value={{ config, updateConfig }}>
      {children}
    </ConfigContext.Provider>
  );
}
```

### 3. Event-Driven Communication
**Use for**: Cross-component updates, real-time synchronization

```tsx
// Event Emitter Pattern
export const configUpdateEmitter = {
  listeners: new Set<Function>(),
  
  subscribe(callback: Function) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  },
  
  emit(data: any) {
    this.listeners.forEach(callback => callback(data));
  }
};
```

## Styling Architecture

### 1. Utility-First Approach
**Tailwind CSS classes for rapid development**

```tsx
// Standard spacing and sizing patterns
const SPACING = {
  section: "space-y-6 py-8",
  card: "p-4 border rounded-lg",
  field: "space-y-2",
  button: "px-4 py-2"
};

const COLORS = {
  success: "bg-green-50 border-green-100 text-green-800",
  info: "bg-blue-50 border-blue-100 text-blue-800",
  warning: "bg-amber-50 border-amber-100 text-amber-800"
};
```

### 2. Component Variants
**Consistent styling with variant props**

```tsx
interface ButtonVariant {
  variant: 'primary' | 'secondary' | 'success' | 'danger';
  size: 'sm' | 'md' | 'lg';
}

const getButtonClasses = ({ variant, size }: ButtonVariant) => {
  const base = "font-medium rounded transition-colors";
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "bg-slate-100 text-slate-700 hover:bg-slate-200",
    success: "bg-green-600 text-white hover:bg-green-700",
    danger: "bg-red-600 text-white hover:bg-red-700"
  };
  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg"
  };
  
  return `${base} ${variants[variant]} ${sizes[size]}`;
};
```

## Data Flow Patterns

### 1. Unidirectional Data Flow
```
User Action → Event Handler → State Update → UI Re-render
```

### 2. State Synchronization
```tsx
// Pattern: Sync local and global state
useEffect(() => {
  setLocalValue(config.fieldName || "");
}, [config.fieldName]);

useEffect(() => {
  const timer = setTimeout(() => {
    if (localValue !== config.fieldName) {
      updateConfig({ fieldName: localValue });
    }
  }, 500);
  
  return () => clearTimeout(timer);
}, [localValue]);
```

### 3. Conditional Rendering
```tsx
// Pattern: Feature-based rendering
{showAdvancedOptions && (
  <AdvancedOptionsPanel 
    config={config}
    onUpdate={updateConfig}
  />
)}

{config.enableFeature ? (
  <FeatureConfiguration />
) : (
  <FeaturePrompt onEnable={() => updateConfig({ enableFeature: true })} />
)}
```

## Performance Patterns

### 1. Lazy Loading
```tsx
const AdvancedPanel = lazy(() => import('./AdvancedPanel'));

// Usage with Suspense
<Suspense fallback={<LoadingSpinner />}>
  {showAdvanced && <AdvancedPanel />}
</Suspense>
```

### 2. Memoization
```tsx
const ExpensiveComponent = memo(({ data, onUpdate }) => {
  // Heavy computation or rendering
}, (prevProps, nextProps) => {
  return prevProps.data === nextProps.data;
});

const memoizedValue = useMemo(() => {
  return computeExpensiveValue(config);
}, [config.relevantFields]);
```

### 3. Debounced Updates
```tsx
const useDebouncedCallback = (callback: Function, delay: number) => {
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  return useCallback((...args: any[]) => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => callback(...args), delay);
  }, [callback, delay]);
};
```

## Error Handling Patterns

### 1. Form Validation
```tsx
const useFormValidation = (schema: ValidationSchema) => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const validate = (data: any) => {
    const newErrors: Record<string, string> = {};
    
    Object.keys(schema).forEach(field => {
      const result = schema[field](data[field]);
      if (!result.valid) {
        newErrors[field] = result.message;
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  return { errors, validate, clearErrors: () => setErrors({}) };
};
```

### 2. Error Boundaries
```tsx
class WizardErrorBoundary extends Component {
  state = { hasError: false, error: null };
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-red-600 mb-2">
            Something went wrong
          </h3>
          <p className="text-slate-600 mb-4">
            Please refresh the page and try again
          </p>
          <Button onClick={() => window.location.reload()}>
            Refresh Page
          </Button>
        </div>
      );
    }
    
    return this.props.children;
  }
}
```

This architecture promotes:
- **Reusability**: Components can be easily reused across different wizards
- **Maintainability**: Clear separation of concerns and consistent patterns
- **Scalability**: Modular design supports adding new features easily
- **Performance**: Optimized rendering and state management
- **Developer Experience**: Predictable patterns and clear documentation