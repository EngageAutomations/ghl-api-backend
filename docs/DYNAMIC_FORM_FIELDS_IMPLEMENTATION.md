# Dynamic Form Field Management Implementation

## Overview

Efficient system for adding and managing custom form fields that automatically create listings from form submissions.

## Architecture Components

### 1. Database Schema
```sql
-- Dynamic form fields table
CREATE TABLE form_fields (
  id SERIAL PRIMARY KEY,
  form_config_id INTEGER NOT NULL,
  field_name TEXT NOT NULL,           -- Technical name (e.g., "business_category")
  field_label TEXT NOT NULL,          -- Display label (e.g., "Business Category")
  field_type TEXT NOT NULL,           -- text, email, phone, select, textarea, etc.
  field_placeholder TEXT,
  is_required BOOLEAN DEFAULT false,
  is_visible BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  
  -- Field configuration
  validation_rules JSONB,             -- Min/max length, patterns, etc.
  field_options JSONB,                -- For select/radio fields
  default_value TEXT,
  
  -- Integration mappings
  ghl_custom_field_id TEXT,           -- Maps to GHL custom field
  ghl_field_mapping TEXT,             -- Maps to standard GHL fields
  listing_field_mapping TEXT,         -- Maps to listing table columns
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 2. Field Types Supported
- **Text Input**: Basic text fields
- **Email**: Email validation
- **Phone**: Phone number formatting
- **Textarea**: Multi-line text
- **Number**: Numeric input
- **Select**: Dropdown options
- **Radio**: Radio button groups
- **Checkbox**: Boolean fields
- **Date**: Date picker
- **File**: File upload
- **URL**: Website links
- **Hidden**: Hidden tracking fields

### 3. API Endpoints

#### Field Management
```javascript
GET    /api/form-fields/:formConfigId     // List fields for form
POST   /api/form-fields                   // Create new field
PUT    /api/form-fields/:id               // Update field
DELETE /api/form-fields/:id               // Delete field
POST   /api/form-fields/duplicate/:id     // Duplicate field
POST   /api/form-fields/reorder           // Reorder fields
```

#### GHL Integration
```javascript
POST   /api/form-fields/:id/sync-ghl      // Sync field to GoHighLevel
```

### 4. Field Mapping System

#### Automatic Listing Creation
```javascript
const fieldMappings = {
  // Direct mappings to listing fields
  title: ['business_name', 'company_name', 'listing_title'],
  description: ['description', 'about', 'business_description'],
  location: ['address', 'location', 'city', 'full_address'],
  category: ['category', 'business_type', 'industry'],
  price: ['price', 'cost', 'rate', 'pricing'],
  
  // Contact information
  linkUrl: ['website', 'website_url', 'company_website'],
  popupUrl: ['contact_form', 'inquiry_form', 'contact_url']
};
```

#### GoHighLevel Field Mapping
```javascript
const ghlMappings = {
  firstName: 'First Name',
  lastName: 'Last Name', 
  email: 'Email',
  phone: 'Phone',
  companyName: 'Company Name',
  address1: 'Address',
  city: 'City',
  state: 'State',
  website: 'Website'
};
```

## Implementation Flow

### 1. Form Configuration Setup
```javascript
// Create form configuration with directory
const formConfig = {
  locationId: "ghl_location_123",
  directoryName: "restaurant_directory",
  config: { /* directory settings */ }
};

// Add custom fields to form
const fields = [
  {
    fieldName: "cuisine_type",
    fieldLabel: "Cuisine Type",
    fieldType: "select",
    fieldOptions: {
      options: ["Italian", "Mexican", "Chinese", "American"]
    },
    isRequired: true,
    listingFieldMapping: "category"
  },
  {
    fieldName: "delivery_available", 
    fieldLabel: "Offers Delivery?",
    fieldType: "checkbox",
    ghlFieldMapping: "custom_delivery"
  }
];
```

### 2. Form Submission Processing
```javascript
// Automatic listing creation from form data
app.post("/api/form-submit/:locationId/:directoryName", async (req, res) => {
  const formData = req.body;
  const fields = await getFormFieldsByConfig(formConfigId);
  
  // 1. Create GoHighLevel contact
  const ghlContact = await createGHLContact(formData, fields);
  
  // 2. Map form data to listing
  const listingData = mapFormDataToListing(formData, fields);
  
  // 3. Create listing automatically
  const listing = await createListing(listingData);
  
  // 4. Track submission status
  await createFormSubmission({
    formConfigId,
    submissionData: formData,
    ghlData: ghlContact,
    status: "processed"
  });
});
```

### 3. Field Management Interface
React component provides:
- **Drag-and-drop reordering**
- **Visual field editor with validation**
- **Real-time preview**
- **GHL synchronization**
- **Field duplication and templates**

### 4. Dynamic Form Generation
```javascript
// Generate form HTML from field configuration
const generateFormHTML = (fields) => {
  return fields
    .filter(field => field.isVisible)
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map(field => renderField(field))
    .join('');
};

// Field rendering based on type
const renderField = (field) => {
  switch (field.fieldType) {
    case 'select':
      return renderSelectField(field);
    case 'textarea':
      return renderTextareaField(field);
    case 'checkbox':
      return renderCheckboxField(field);
    default:
      return renderInputField(field);
  }
};
```

## Benefits

### 1. Efficiency
- **No Code Changes**: Add fields without touching codebase
- **Instant Deployment**: New fields appear immediately
- **Bulk Operations**: Import/export field configurations

### 2. Integration
- **GoHighLevel Sync**: Automatic custom field creation
- **Listing Automation**: Form submissions become listings
- **Validation**: Field-level validation rules

### 3. Flexibility
- **Conditional Logic**: Show/hide fields based on other values
- **Multi-step Forms**: Break complex forms into steps
- **Custom Validation**: Regular expressions and custom rules

### 4. User Experience
- **Visual Editor**: Drag-and-drop field management
- **Live Preview**: See changes in real-time
- **Field Templates**: Reusable field configurations

## Usage Examples

### Adding a Business Hours Field
```javascript
const businessHoursField = {
  fieldName: "business_hours",
  fieldLabel: "Business Hours",
  fieldType: "textarea", 
  fieldPlaceholder: "Mon-Fri: 9AM-5PM\nSat: 10AM-3PM\nSun: Closed",
  isRequired: true,
  listingFieldMapping: "description", // Append to description
  validationRules: {
    maxLength: 200
  }
};
```

### Creating a Service Category Dropdown
```javascript
const serviceCategoryField = {
  fieldName: "service_category",
  fieldLabel: "Service Category", 
  fieldType: "select",
  fieldOptions: {
    options: [
      "Professional Services",
      "Healthcare", 
      "Retail",
      "Restaurant",
      "Beauty & Wellness"
    ]
  },
  isRequired: true,
  listingFieldMapping: "category",
  ghlFieldMapping: "companyName" // Map to existing GHL field
};
```

### Price Range Field with Validation
```javascript
const priceRangeField = {
  fieldName: "price_range",
  fieldLabel: "Price Range",
  fieldType: "select",
  fieldOptions: {
    options: ["$", "$$", "$$$", "$$$$"]
  },
  listingFieldMapping: "price",
  validationRules: {
    required: true
  }
};
```

## Integration with Existing System

### Form Configuration Workflow
1. **Create Directory Configuration** → Form config created
2. **Add Custom Fields** → Dynamic field management
3. **Generate Form** → Auto-generated HTML with custom fields
4. **Process Submissions** → Automatic listing creation
5. **Manage Data** → View submissions and created listings

### GoHighLevel Integration
- **Automatic Field Sync**: Custom fields created in GHL
- **Contact Creation**: Form submissions create GHL contacts
- **Data Mapping**: Form data maps to both listings and GHL

### Directory System Integration
- **Directory-Specific Fields**: Each directory has unique field set
- **Styling Integration**: Fields respect directory styling
- **Code Generation**: Custom fields included in generated embed codes

This implementation provides a complete solution for efficiently adding and managing form fields while maintaining seamless integration with the existing GoHighLevel marketplace and directory management system.