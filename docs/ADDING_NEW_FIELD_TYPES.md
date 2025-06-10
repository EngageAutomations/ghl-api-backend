# Adding New Field Types - Complete Guide

## Quick Implementation (2 minutes)

To add a new field type like "signature", "location-picker", or "multi-file-upload":

### Step 1: Add to Field Types Array
In `client/src/components/DynamicFormFieldManager.tsx`:

```javascript
const FIELD_TYPES = [
  // ... existing fields
  { value: "signature", label: "Digital Signature" },
  { value: "location-picker", label: "Location Picker" },
  { value: "multi-file-upload", label: "Multiple File Upload" },
  { value: "rich-text", label: "Rich Text Editor" },
  { value: "slider", label: "Value Slider" },
  { value: "toggle", label: "Toggle Switch" }
];
```

### Step 2: Add GoHighLevel Mapping
In `server/routes.ts`, update the mapping function:

```javascript
const mapFieldTypeToGHL = (fieldType: string) => {
  const mapping: Record<string, string> = {
    // ... existing mappings
    'signature': 'TEXT',
    'location-picker': 'TEXT',
    'multi-file-upload': 'FILE_UPLOAD',
    'rich-text': 'TEXTAREA',
    'slider': 'NUMBER',
    'toggle': 'CHECKBOX'
  };
  return mapping[fieldType] || 'TEXT';
};
```

### Step 3: Add Listing Field Mapping (Optional)
If the field maps to a specific listing property:

```javascript
const LISTING_FIELD_MAPPINGS = [
  // ... existing mappings
  { value: "businessHours", label: "Business Hours" },
  { value: "services", label: "Services Offered" },
  { value: "specialties", label: "Specialties" },
  { value: "certifications", label: "Certifications" }
];
```

That's it! The field is now available in the form builder.

## Advanced Implementation (Custom Rendering)

For fields requiring special UI components or validation:

### Step 1: Create Custom Field Component
```javascript
// client/src/components/fields/SignatureField.tsx
export function SignatureField({ field, value, onChange }) {
  const canvasRef = useRef(null);
  
  const handleSignature = (signatureData) => {
    onChange(signatureData);
  };

  return (
    <div className="signature-field">
      <canvas ref={canvasRef} width={400} height={200} />
      <button onClick={() => canvasRef.current.clear()}>Clear</button>
    </div>
  );
}
```

### Step 2: Add to Field Renderer
In the form generation logic:

```javascript
const renderField = (field) => {
  switch (field.fieldType) {
    case 'signature':
      return <SignatureField field={field} />;
    case 'location-picker':
      return <LocationPickerField field={field} />;
    case 'rich-text':
      return <RichTextEditor field={field} />;
    default:
      return renderStandardField(field);
  }
};
```

## Field Configuration Examples

### Star Rating Field
```javascript
{
  fieldName: "service_rating",
  fieldLabel: "Rate Our Service",
  fieldType: "rating",
  fieldOptions: {
    maxStars: 5,
    allowHalfStars: true,
    starColor: "#FFD700"
  },
  validationRules: {
    min: 1,
    required: true
  },
  listingFieldMapping: "rating"
}
```

### Multi-Select Categories
```javascript
{
  fieldName: "business_categories",
  fieldLabel: "Business Categories",
  fieldType: "multi-select",
  fieldOptions: {
    options: [
      "Restaurant",
      "Retail",
      "Professional Services",
      "Healthcare",
      "Entertainment"
    ],
    maxSelections: 3
  },
  listingFieldMapping: "category"
}
```

### Address Autocomplete
```javascript
{
  fieldName: "business_address",
  fieldLabel: "Business Address",
  fieldType: "address",
  fieldOptions: {
    enableAutocomplete: true,
    restrictToCountry: "US",
    includeCoordinates: true
  },
  validationRules: {
    required: true
  },
  listingFieldMapping: "location",
  ghlFieldMapping: "address1"
}
```

### Image Upload with Preview
```javascript
{
  fieldName: "business_logo",
  fieldLabel: "Business Logo",
  fieldType: "image",
  fieldOptions: {
    maxSize: "2MB",
    allowedTypes: ["jpg", "png", "svg"],
    showPreview: true,
    cropRatio: "1:1"
  },
  listingFieldMapping: "imageUrl"
}
```

## Validation Rules System

### Built-in Validation Types
```javascript
const validationRules = {
  // Text validation
  minLength: 5,
  maxLength: 100,
  pattern: "^[A-Za-z ]+$",
  
  // Number validation
  min: 0,
  max: 100,
  step: 0.1,
  
  // File validation
  maxSize: "5MB",
  allowedTypes: ["pdf", "doc", "docx"],
  
  // Custom validation
  customValidator: "function(value) { return value.includes('@'); }"
};
```

### Adding Custom Validation
```javascript
const customValidations = {
  businessHours: (value) => {
    const timePattern = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timePattern.test(value) || "Invalid time format";
  },
  
  phoneNumber: (value) => {
    const phonePattern = /^\(\d{3}\) \d{3}-\d{4}$/;
    return phonePattern.test(value) || "Format: (123) 456-7890";
  },
  
  website: (value) => {
    try {
      new URL(value);
      return true;
    } catch {
      return "Please enter a valid URL";
    }
  }
};
```

## Field Dependencies and Conditional Logic

### Show/Hide Based on Other Fields
```javascript
{
  fieldName: "delivery_radius",
  fieldLabel: "Delivery Radius (miles)",
  fieldType: "number",
  conditionalLogic: {
    showWhen: {
      fieldName: "offers_delivery",
      operator: "equals",
      value: true
    }
  }
}
```

### Dynamic Options Based on Selection
```javascript
{
  fieldName: "service_type",
  fieldLabel: "Service Type",
  fieldType: "select",
  fieldOptions: {
    dependsOn: "business_category",
    optionsMap: {
      "restaurant": ["Dine-in", "Takeout", "Delivery", "Catering"],
      "retail": ["In-store", "Online", "Wholesale", "Custom Orders"],
      "healthcare": ["Consultation", "Treatment", "Emergency", "Preventive"]
    }
  }
}
```

## Integration with External APIs

### Google Places Integration
```javascript
{
  fieldName: "business_location",
  fieldType: "address",
  apiIntegration: {
    provider: "google-places",
    apiKey: "your-google-api-key",
    autoComplete: true,
    returnCoordinates: true
  }
}
```

### Stripe Payment Integration
```javascript
{
  fieldName: "listing_fee",
  fieldType: "payment",
  paymentConfig: {
    provider: "stripe",
    amount: 2500, // $25.00
    currency: "usd",
    description: "Directory listing fee"
  }
}
```

## Real-World Examples

### Restaurant Directory Fields
```javascript
const restaurantFields = [
  {
    fieldName: "cuisine_type",
    fieldLabel: "Cuisine Type",
    fieldType: "multi-select",
    fieldOptions: {
      options: ["Italian", "Mexican", "Chinese", "American", "Thai", "Indian"]
    }
  },
  {
    fieldName: "price_range",
    fieldLabel: "Price Range",
    fieldType: "select",
    fieldOptions: {
      options: ["$", "$$", "$$$", "$$$$"]
    }
  },
  {
    fieldName: "business_hours",
    fieldLabel: "Business Hours",
    fieldType: "textarea",
    fieldPlaceholder: "Mon-Fri: 11AM-10PM\nSat-Sun: 10AM-11PM"
  }
];
```

### Healthcare Directory Fields
```javascript
const healthcareFields = [
  {
    fieldName: "specialties",
    fieldLabel: "Medical Specialties",
    fieldType: "multi-select",
    fieldOptions: {
      options: ["Cardiology", "Dermatology", "Pediatrics", "Orthopedics"]
    }
  },
  {
    fieldName: "accepts_insurance",
    fieldLabel: "Accepted Insurance",
    fieldType: "checkbox"
  },
  {
    fieldName: "board_certifications",
    fieldLabel: "Board Certifications",
    fieldType: "tags"
  }
];
```

## Performance Optimization

### Lazy Loading Components
```javascript
const fieldComponents = {
  signature: lazy(() => import('./fields/SignatureField')),
  richText: lazy(() => import('./fields/RichTextEditor')),
  locationPicker: lazy(() => import('./fields/LocationPicker'))
};
```

### Field Validation Caching
```javascript
const validationCache = new Map();

const validateField = (field, value) => {
  const cacheKey = `${field.id}-${value}`;
  if (validationCache.has(cacheKey)) {
    return validationCache.get(cacheKey);
  }
  
  const result = performValidation(field, value);
  validationCache.set(cacheKey, result);
  return result;
};
```

## Summary

The dynamic field system is designed for maximum extensibility:

1. **Simple fields**: Just add to the `FIELD_TYPES` array
2. **Complex fields**: Create custom components and renderers
3. **Validation**: Use built-in rules or create custom validators
4. **Integration**: Connect with external APIs and services
5. **Performance**: Implement lazy loading and caching as needed

The system automatically handles:
- Database storage
- GoHighLevel synchronization
- Form generation
- Validation
- Field ordering and visibility
- Listing creation from submissions

This architecture allows you to add any field type efficiently while maintaining full integration with the existing system.