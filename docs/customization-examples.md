# Customization Examples

This guide provides real-world examples of customizing the directory integration system for various use cases and requirements.

## Custom Button Styling Variations

### 1. E-commerce Product Buttons
Create buttons that match modern e-commerce design patterns:

```tsx
// Gradient button with hover animation
const EcommerceButton = ({ children, onClick }: { children: ReactNode; onClick: () => void }) => (
  <button
    onClick={onClick}
    className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300 hover:from-blue-700 hover:to-purple-700 hover:shadow-lg hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
  >
    <span className="relative z-10">{children}</span>
    <div className="absolute inset-0 bg-white opacity-0 hover:opacity-10 transition-opacity duration-300" />
  </button>
);

// Configuration for e-commerce style
const ecommerceConfig = {
  buttonColor: "#4f46e5",
  buttonTextColor: "#ffffff", 
  buttonBorderRadius: 8,
  buttonStyle: "gradient",
  hoverEffect: "scale-lift"
};
```

### 2. Minimalist Professional Buttons
Clean, corporate-style buttons for B2B applications:

```tsx
const MinimalistButton = ({ children, onClick }: { children: ReactNode; onClick: () => void }) => (
  <button
    onClick={onClick}
    className="bg-white border-2 border-gray-300 text-gray-700 px-6 py-2 rounded-sm font-medium transition-all duration-200 hover:border-gray-800 hover:text-gray-900 focus:outline-none focus:border-blue-500"
  >
    {children}
  </button>
);

// Minimalist configuration
const minimalistConfig = {
  buttonColor: "#ffffff",
  buttonTextColor: "#374151",
  buttonBorderRadius: 2,
  buttonBorder: "2px solid #d1d5db",
  hoverEffect: "border-color-change"
};
```

### 3. Call-to-Action Buttons with Icons
High-conversion buttons with visual cues:

```tsx
const CTAButton = ({ children, icon, onClick }: { 
  children: ReactNode; 
  icon: ReactNode; 
  onClick: () => void 
}) => (
  <button
    onClick={onClick}
    className="inline-flex items-center gap-2 bg-orange-500 text-white px-6 py-3 rounded-full font-bold text-lg shadow-lg hover:bg-orange-600 hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
  >
    {icon}
    {children}
  </button>
);

// Usage with icon
<CTAButton 
  icon={<Download className="w-5 h-5" />}
  onClick={handleDownload}
>
  Get Free Download
</CTAButton>
```

## Advanced Metadata Configurations

### 1. Real Estate Listing Metadata
Comprehensive property information display:

```tsx
const RealEstateMetadata = ({ listing }: { listing: any }) => {
  const metadataConfig = {
    layout: "grid", // 2x2 grid layout
    fields: [
      {
        id: 1,
        label: "Price",
        icon: "https://cdn.example.com/icons/price.svg",
        value: "$450,000",
        priority: "high"
      },
      {
        id: 2, 
        label: "Bedrooms",
        icon: "https://cdn.example.com/icons/bed.svg",
        value: "3 BR",
        priority: "high"
      },
      {
        id: 3,
        label: "Square Feet", 
        icon: "https://cdn.example.com/icons/area.svg",
        value: "2,100 sqft",
        priority: "medium"
      },
      {
        id: 4,
        label: "Year Built",
        icon: "https://cdn.example.com/icons/calendar.svg", 
        value: "2018",
        priority: "low"
      }
    ]
  };

  return (
    <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
      {metadataConfig.fields.map(field => (
        <div key={field.id} className="flex items-center gap-2">
          <img src={field.icon} alt="" className="w-4 h-4" />
          <span className="text-sm font-medium">{field.value}</span>
        </div>
      ))}
    </div>
  );
};
```

### 2. Restaurant Menu Item Metadata
Food service specific information:

```tsx
const RestaurantMetadata = () => {
  const menuMetadata = {
    dietary: ["vegetarian", "gluten-free"],
    spiceLevel: 2,
    prepTime: "15-20 min",
    calories: 450,
    allergens: ["nuts", "dairy"]
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-green-600 text-sm">🌱 Vegetarian</span>
        <span className="text-blue-600 text-sm">🌾 Gluten-Free</span>
      </div>
      <div className="flex items-center gap-4 text-sm text-gray-600">
        <span>🌶️ Mild</span>
        <span>⏱️ 15-20 min</span>
        <span>📊 450 cal</span>
      </div>
    </div>
  );
};
```

### 3. Service Provider Metadata
Professional services information:

```tsx
const ServiceProviderMetadata = () => {
  const serviceConfig = {
    rating: 4.9,
    reviewCount: 127,
    experience: "8 years",
    certifications: ["Google Certified", "Microsoft Partner"],
    responseTime: "< 2 hours"
  };

  return (
    <div className="flex flex-wrap gap-3">
      <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded">
        <span className="text-yellow-500">⭐</span>
        <span className="text-sm font-medium">{serviceConfig.rating}</span>
        <span className="text-xs text-gray-500">({serviceConfig.reviewCount})</span>
      </div>
      <div className="bg-blue-50 px-2 py-1 rounded text-sm">
        {serviceConfig.experience} experience
      </div>
      <div className="bg-green-50 px-2 py-1 rounded text-sm">
        Responds {serviceConfig.responseTime}
      </div>
    </div>
  );
};
```

## Complex Form Integration Patterns

### 1. Multi-Step Lead Capture
Progressive form that captures increasing detail:

```tsx
const MultiStepForm = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({});

  const steps = [
    {
      title: "Contact Info",
      fields: ["name", "email"]
    },
    {
      title: "Project Details", 
      fields: ["projectType", "budget", "timeline"]
    },
    {
      title: "Additional Info",
      fields: ["company", "message"]
    }
  ];

  return (
    <div className="max-w-md mx-auto">
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-500">
          <span>Step {step} of {steps.length}</span>
          <span>{Math.round((step / steps.length) * 100)}% complete</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(step / steps.length) * 100}%` }}
          />
        </div>
      </div>
      
      {/* Render current step fields */}
      <form onSubmit={handleStepSubmit}>
        {/* Step content based on current step */}
      </form>
    </div>
  );
};
```

### 2. Conditional Field Display
Forms that adapt based on user selections:

```tsx
const ConditionalForm = () => {
  const [serviceType, setServiceType] = useState("");
  
  return (
    <form className="space-y-4">
      <div>
        <Label>Service Type</Label>
        <Select onValueChange={setServiceType}>
          <SelectTrigger>
            <SelectValue placeholder="Choose service" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="design">Design Services</SelectItem>
            <SelectItem value="development">Development</SelectItem>
            <SelectItem value="marketing">Marketing</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {serviceType === "design" && (
        <div className="space-y-3 p-3 bg-blue-50 rounded">
          <Label>Design Requirements</Label>
          <Checkbox id="logo">Logo Design</Checkbox>
          <Checkbox id="website">Website Design</Checkbox>
          <Checkbox id="branding">Brand Identity</Checkbox>
        </div>
      )}
      
      {serviceType === "development" && (
        <div className="space-y-3 p-3 bg-green-50 rounded">
          <Label>Technical Requirements</Label>
          <Checkbox id="frontend">Frontend Development</Checkbox>
          <Checkbox id="backend">Backend Development</Checkbox>
          <Checkbox id="mobile">Mobile App</Checkbox>
        </div>
      )}
    </form>
  );
};
```

### 3. File Upload Integration
Forms with drag-and-drop file handling:

```tsx
const FileUploadForm = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles(prev => [...prev, ...droppedFiles]);
  };

  return (
    <div className="space-y-4">
      <div 
        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-600">
          Drag and drop files here, or click to browse
        </p>
        <input
          type="file"
          multiple
          className="hidden"
          onChange={(e) => setFiles(Array.from(e.target.files || []))}
        />
      </div>
      
      {files.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium">Selected Files:</h4>
          {files.map((file, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="text-sm">{file.name}</span>
              <Button 
                size="sm" 
                variant="ghost"
                onClick={() => setFiles(files.filter((_, i) => i !== index))}
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

## Multi-Language Support

### 1. Language Detection and Switching
Automatic language detection with manual override:

```tsx
const MultiLanguageWizard = () => {
  const [language, setLanguage] = useState(() => {
    return navigator.language.startsWith('es') ? 'es' : 'en';
  });

  const translations = {
    en: {
      title: "Directory Setup",
      description: "Configure your directory integration",
      buttons: {
        next: "Next",
        previous: "Previous",
        finish: "Complete Setup"
      }
    },
    es: {
      title: "Configuración del Directorio", 
      description: "Configura tu integración de directorio",
      buttons: {
        next: "Siguiente",
        previous: "Anterior", 
        finish: "Completar Configuración"
      }
    }
  };

  const t = translations[language];

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Select value={language} onValueChange={setLanguage}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="en">English</SelectItem>
            <SelectItem value="es">Español</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <ConfigWizard>
        <WizardStep title={t.title} description={t.description}>
          {/* Localized content */}
        </WizardStep>
      </ConfigWizard>
    </div>
  );
};
```

### 2. RTL Language Support
Support for right-to-left languages:

```tsx
const RTLSupportedLayout = ({ language }: { language: string }) => {
  const isRTL = ['ar', 'he', 'fa'].includes(language);
  
  return (
    <div 
      className={`space-y-6 ${isRTL ? 'rtl' : 'ltr'}`}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <style jsx>{`
        .rtl .flex {
          flex-direction: row-reverse;
        }
        .rtl .text-left {
          text-align: right;
        }
        .rtl .ml-2 {
          margin-left: 0;
          margin-right: 0.5rem;
        }
      `}</style>
      
      {/* Content adapts to reading direction */}
    </div>
  );
};
```

## Advanced API Integration Examples

### 1. Real-time Data Synchronization
Live updates with WebSocket integration:

```tsx
const RealTimeMetadata = ({ slug }: { slug: string }) => {
  const [metadata, setMetadata] = useState([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const ws = new WebSocket(`wss://api.example.com/realtime/${slug}`);
    
    ws.onopen = () => setConnected(true);
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'metadata_update') {
        setMetadata(data.metadata);
      }
    };
    ws.onclose = () => setConnected(false);
    
    return () => ws.close();
  }, [slug]);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
        <span className="text-xs text-gray-500">
          {connected ? 'Live data' : 'Offline'}
        </span>
      </div>
      {/* Render metadata */}
    </div>
  );
};
```

### 2. Cached API Responses
Smart caching with automatic invalidation:

```tsx
const useCachedApi = (endpoint: string, slug: string) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cacheKey = `${endpoint}-${slug}`;
    const cached = localStorage.getItem(cacheKey);
    const cacheTime = localStorage.getItem(`${cacheKey}-time`);
    
    // Use cache if less than 5 minutes old
    if (cached && cacheTime && Date.now() - parseInt(cacheTime) < 300000) {
      setData(JSON.parse(cached));
      setLoading(false);
      return;
    }

    // Fetch fresh data
    fetch(`${endpoint}?slug=${slug}`)
      .then(res => res.json())
      .then(data => {
        setData(data);
        localStorage.setItem(cacheKey, JSON.stringify(data));
        localStorage.setItem(`${cacheKey}-time`, Date.now().toString());
      })
      .catch(setError)
      .finally(() => setLoading(false));
  }, [endpoint, slug]);

  return { data, loading, error };
};
```

These customization examples provide practical templates for adapting the directory integration system to various industries and use cases. Each example includes complete code and can be modified to fit specific requirements.