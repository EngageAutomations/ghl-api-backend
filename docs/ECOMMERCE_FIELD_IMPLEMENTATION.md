# E-commerce Field Implementation Guide

## Overview

This guide covers the implementation of specialized e-commerce fields for pricing types and product variations, designed to replicate GoHighLevel's product form structure for embeddable directory forms.

## Field Types Implemented

### 1. Pricing Configuration Field (`pricing-type`)

**Purpose**: Handles complex pricing structures with one-time and recurring payment options.

**Features**:
- **Price Type Selection**: One-time vs Recurring
- **Amount Input**: Currency formatted pricing
- **Compare at Price**: Show original price for discounts
- **Recurring Options** (conditional):
  - Billing Period: Daily, Weekly, Monthly, Yearly
  - Trial Period: Free trial days
  - Number of Payments: Limited or unlimited
  - Setup Fee: One-time initial charge

**Data Structure**:
```typescript
interface PricingData {
  type: 'one-time' | 'recurring';
  amount: string;
  compareAtPrice?: string;
  billingPeriod?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  trialPeriod?: number;
  numberOfPayments?: number;
  setupFee?: string;
}
```

**Usage Example**:
```javascript
{
  fieldName: "product_pricing",
  fieldLabel: "Product Pricing",
  fieldType: "pricing-type",
  isRequired: true,
  listingFieldMapping: "price"
}
```

### 2. Product Variations Field (`product-variants`)

**Purpose**: Manages complex product variants with automatic combination generation.

**Features**:
- **Dynamic Variant Options**: Add size, color, material, etc.
- **Auto-extending Values**: Type one, next field appears
- **Cartesian Product Generation**: All possible combinations
- **Individual Variant Pricing**: Price per combination
- **Inventory Tracking**: Optional quantity management
- **Bulk Management**: Enable/disable variants

**Data Structure**:
```typescript
interface ProductVariantsData {
  options: VariantOption[];
  trackInventory: boolean;
  continueSellingWhenOutOfStock: boolean;
  combinations: VariantCombination[];
}

interface VariantOption {
  name: string;
  values: string[];
}

interface VariantCombination {
  id: string;
  combination: Record<string, string>;
  price: string;
  compareAtPrice: string;
  quantity: number;
  enabled: boolean;
}
```

**Usage Example**:
```javascript
{
  fieldName: "product_variations",
  fieldLabel: "Product Variations",
  fieldType: "product-variants",
  isRequired: false,
  listingFieldMapping: "variants"
}
```

### 3. Inventory Tracking Field (`inventory-tracking`)

**Purpose**: Comprehensive inventory management with shipping details.

**Features**:
- **Stock Management**: Current quantity and low stock alerts
- **Backorder Options**: Continue selling when out of stock
- **Product Identification**: SKU and barcode tracking
- **Shipping Details**: Weight and shipping requirements
- **Stock Status**: Visual indicators (In Stock, Low Stock, Out of Stock)

**Data Structure**:
```typescript
interface InventoryData {
  trackInventory: boolean;
  currentStock: number;
  lowStockThreshold: number;
  continueSellingWhenOutOfStock: boolean;
  allowBackorders: boolean;
  sku: string;
  barcode: string;
  weight: string;
  weightUnit: 'lb' | 'kg' | 'oz' | 'g';
  requiresShipping: boolean;
}
```

## Implementation Steps

### Step 1: Add Field Types to Manager

The specialized field types are already added to the `FIELD_TYPES` array:

```javascript
// E-commerce Specialized Fields
{ value: "pricing-type", label: "Pricing Configuration" },
{ value: "product-variants", label: "Product Variations" },
{ value: "inventory-tracking", label: "Inventory Management" }
```

### Step 2: GoHighLevel Integration

Field type mapping is configured for GHL synchronization:

```javascript
const mapFieldTypeToGHL = (fieldType: string) => {
  const mapping: Record<string, string> = {
    'pricing-type': 'TEXT',
    'product-variants': 'TEXT',
    'inventory-tracking': 'NUMBER'
  };
  return mapping[fieldType] || 'TEXT';
};
```

### Step 3: Form Generation

When generating embeddable forms, these fields render as specialized components:

```javascript
const renderField = (field) => {
  switch (field.fieldType) {
    case 'pricing-type':
      return <PricingTypeField field={field} />;
    case 'product-variants':
      return <ProductVariantsField field={field} />;
    case 'inventory-tracking':
      return <InventoryTrackingField field={field} />;
    default:
      return renderStandardField(field);
  }
};
```

## Real-World Use Cases

### E-commerce Product Directory

```javascript
const ecommerceFields = [
  {
    fieldName: "product_name",
    fieldLabel: "Product Name",
    fieldType: "text",
    isRequired: true,
    listingFieldMapping: "title"
  },
  {
    fieldName: "product_description",
    fieldLabel: "Product Description",
    fieldType: "textarea",
    isRequired: true,
    listingFieldMapping: "description"
  },
  {
    fieldName: "product_images",
    fieldLabel: "Product Images",
    fieldType: "image",
    isRequired: true,
    listingFieldMapping: "imageUrl"
  },
  {
    fieldName: "pricing_config",
    fieldLabel: "Pricing Configuration",
    fieldType: "pricing-type",
    isRequired: true,
    listingFieldMapping: "price"
  },
  {
    fieldName: "product_variants",
    fieldLabel: "Product Variations",
    fieldType: "product-variants",
    isRequired: false
  },
  {
    fieldName: "inventory_management",
    fieldLabel: "Inventory Management",
    fieldType: "inventory-tracking",
    isRequired: false
  }
];
```

### SaaS Product Directory

```javascript
const saasFields = [
  {
    fieldName: "software_name",
    fieldLabel: "Software Name",
    fieldType: "text",
    isRequired: true,
    listingFieldMapping: "title"
  },
  {
    fieldName: "pricing_plans",
    fieldLabel: "Pricing Plans",
    fieldType: "pricing-type",
    isRequired: true,
    fieldOptions: {
      defaultType: "recurring",
      allowedBillingPeriods: ["monthly", "yearly"]
    }
  },
  {
    fieldName: "plan_features",
    fieldLabel: "Plan Features",
    fieldType: "product-variants",
    fieldOptions: {
      variantNames: ["Plan Type", "User Limit", "Storage"]
    }
  }
];
```

### Service Provider Directory

```javascript
const serviceFields = [
  {
    fieldName: "service_name",
    fieldLabel: "Service Name",
    fieldType: "text",
    isRequired: true,
    listingFieldMapping: "title"
  },
  {
    fieldName: "service_pricing",
    fieldLabel: "Service Pricing",
    fieldType: "pricing-type",
    fieldOptions: {
      showCompareAtPrice: false,
      allowRecurring: true
    }
  },
  {
    fieldName: "service_packages",
    fieldLabel: "Service Packages",
    fieldType: "product-variants",
    fieldOptions: {
      trackInventory: false,
      variantNames: ["Package Type", "Duration", "Add-ons"]
    }
  }
];
```

## Form Embedding

### Generated HTML Structure

When these fields are included in a form, they generate comprehensive HTML:

```html
<!-- Pricing Configuration -->
<div class="pricing-field-container">
  <label>Product Pricing *</label>
  <div class="pricing-config">
    <select name="pricing_type">
      <option value="one-time">One-time</option>
      <option value="recurring">Recurring</option>
    </select>
    <input type="text" name="pricing_amount" placeholder="$0.00" required>
    <!-- Conditional recurring fields -->
    <div class="recurring-options" style="display: none;">
      <select name="billing_period">
        <option value="monthly">Monthly</option>
        <option value="yearly">Yearly</option>
      </select>
      <input type="number" name="trial_period" placeholder="Trial Days">
    </div>
  </div>
</div>

<!-- Product Variants -->
<div class="variants-field-container">
  <label>Product Variations</label>
  <div class="variant-builder">
    <button type="button" class="add-variant">Add Variant</button>
    <div class="variants-table">
      <!-- Dynamically generated variant combinations -->
    </div>
  </div>
</div>
```

### JavaScript Integration

Forms include JavaScript for dynamic behavior:

```javascript
// Auto-expand variant values
document.querySelectorAll('.variant-value-input').forEach(input => {
  input.addEventListener('input', function() {
    if (this.value && !this.nextElementSibling) {
      addNewVariantValueField(this.parentNode);
    }
  });
});

// Generate variant combinations
function generateVariantCombinations(options) {
  const combinations = cartesianProduct(options.map(opt => opt.values));
  updateVariantsTable(combinations);
}

// Format currency inputs
document.querySelectorAll('.currency-input').forEach(input => {
  input.addEventListener('input', function() {
    this.value = formatCurrency(this.value);
  });
});
```

## Advanced Features

### Conditional Logic

Fields can show/hide based on other field values:

```javascript
{
  fieldName: "shipping_weight",
  fieldLabel: "Shipping Weight",
  fieldType: "number",
  conditionalLogic: {
    showWhen: {
      fieldName: "inventory_management",
      path: "requiresShipping",
      operator: "equals",
      value: true
    }
  }
}
```

### Custom Validation

Specialized validation for e-commerce fields:

```javascript
const ecommerceValidation = {
  pricing: {
    amount: (value) => {
      const num = parseFloat(value.replace(/[^0-9.]/g, ''));
      return num > 0 || "Price must be greater than $0";
    },
    recurringSetup: (data) => {
      if (data.type === 'recurring' && !data.billingPeriod) {
        return "Billing period is required for recurring pricing";
      }
      return true;
    }
  },
  variants: {
    combinations: (variants) => {
      const enabledCombinations = variants.combinations.filter(c => c.enabled);
      return enabledCombinations.length > 0 || "At least one variant combination must be enabled";
    }
  }
};
```

### Bulk Operations

For forms with many variants, bulk operations are supported:

```javascript
// Bulk price update
function updateAllVariantPrices(basePrice, markup) {
  variants.combinations.forEach(combination => {
    combination.price = calculateVariantPrice(basePrice, markup, combination);
  });
}

// Bulk enable/disable
function toggleAllVariants(enabled) {
  variants.combinations.forEach(combination => {
    combination.enabled = enabled;
  });
}
```

## Integration with GoHighLevel

### Custom Field Mapping

E-commerce fields automatically create corresponding custom fields in GoHighLevel:

```javascript
// Pricing field creates multiple GHL custom fields
const ghlPricingFields = {
  'product_price_type': field.value.type,
  'product_price_amount': field.value.amount,
  'product_billing_period': field.value.billingPeriod,
  'product_trial_period': field.value.trialPeriod
};

// Variants create JSON custom field
const ghlVariantsField = {
  'product_variants': JSON.stringify(field.value.combinations)
};
```

### Automatic Product Creation

When forms are submitted, they can automatically create products in GoHighLevel:

```javascript
const createGHLProduct = async (formSubmission) => {
  const pricingData = JSON.parse(formSubmission.pricing_config);
  const variantsData = JSON.parse(formSubmission.product_variants);
  
  // Create base product
  const product = await ghlAPI.createProduct({
    name: formSubmission.product_name,
    description: formSubmission.product_description,
    price: pricingData.amount,
    type: pricingData.type
  });
  
  // Create variants if any
  if (variantsData.combinations.length > 0) {
    for (const variant of variantsData.combinations) {
      await ghlAPI.createProductVariant(product.id, {
        name: Object.values(variant.combination).join(' - '),
        price: variant.price,
        inventory: variant.quantity
      });
    }
  }
  
  return product;
};
```

## Performance Optimization

### Lazy Loading

Complex e-commerce components are loaded only when needed:

```javascript
const EcommerceFields = {
  PricingType: lazy(() => import('./fields/PricingTypeField')),
  ProductVariants: lazy(() => import('./fields/ProductVariantsField')),
  InventoryTracking: lazy(() => import('./fields/InventoryTrackingField'))
};
```

### Debounced Updates

Variant combination generation is debounced to prevent excessive recalculation:

```javascript
const debouncedGenerateCombinations = debounce(generateCombinations, 300);

useEffect(() => {
  if (options.length > 0) {
    debouncedGenerateCombinations();
  }
}, [options]);
```

### Memoized Calculations

Complex calculations are memoized for performance:

```javascript
const variantCombinations = useMemo(() => {
  return generateCartesianProduct(
    options.map(opt => opt.values.filter(v => v.trim()))
  );
}, [options]);
```

## Summary

The e-commerce field implementation provides:

1. **Complete Pricing Management**: One-time and recurring pricing with all GoHighLevel features
2. **Advanced Product Variations**: Dynamic variant generation with inventory tracking
3. **Professional Inventory Management**: SKU, barcode, and shipping integration
4. **Embeddable Forms**: Generate forms that work on any website
5. **GoHighLevel Integration**: Automatic product and custom field creation
6. **Performance Optimized**: Lazy loading and efficient calculations

These fields enable creation of sophisticated e-commerce directory forms that automatically generate product listings with complex pricing and variant structures, matching GoHighLevel's native product management capabilities while being embeddable on any website.