/**
 * CSS Generator for Listing Attribute-based Styling
 * 
 * This module provides functions to generate CSS for listing attributes
 * used in our selector-based styling approach.
 */

export type ListingCategoryStyle = {
  category: string;
  buttonColor?: string;
  buttonTextColor?: string;
  borderColor?: string;
  accentColor?: string;
};

export type ListingPriorityStyle = {
  priority: string;
  effect: 'gradient' | 'border' | 'badge';
  color?: string;
};

/**
 * Generates CSS for category-specific styling
 */
export function generateCategoryCSS(categoryStyles: ListingCategoryStyle[]): string {
  if (!categoryStyles || categoryStyles.length === 0) {
    return '';
  }
  
  let css = `
/* --- Category-specific Styling --- */
`;

  // Generate CSS for each category
  categoryStyles.forEach(style => {
    const categorySelector = style.category.toLowerCase().replace(/\s+/g, '-');
    
    css += `
/* Category: ${style.category} */
[data-listing-category="${categorySelector}"] {
  /* Base container styling */
  position: relative;
}
`;

    // Add styling for buttons if color specified
    if (style.buttonColor) {
      css += `
[data-listing-category="${categorySelector}"] .directory-action-button {
  background-color: ${style.buttonColor} !important;
  ${style.buttonTextColor ? `color: ${style.buttonTextColor} !important;` : ''}
}
`;
    }
    
    // Add styling for forms if border color specified
    if (style.borderColor) {
      css += `
[data-listing-category="${categorySelector}"] .directory-embedded-form {
  border-left: 4px solid ${style.borderColor} !important;
  padding-left: 16px;
}
`;
    }
    
    // Add accent color styling if specified
    if (style.accentColor) {
      css += `
[data-listing-category="${categorySelector}"] h1,
[data-listing-category="${categorySelector}"] h2,
[data-listing-category="${categorySelector}"] .category-accent {
  color: ${style.accentColor} !important;
}

[data-listing-category="${categorySelector}"] .category-accent-bg {
  background-color: ${style.accentColor} !important;
}
`;
    }
  });
  
  return css;
}

/**
 * Generates CSS for priority-based styling
 */
export function generatePriorityCSS(priorityStyles: ListingPriorityStyle[]): string {
  if (!priorityStyles || priorityStyles.length === 0) {
    return '';
  }
  
  let css = `
/* --- Priority-based Styling --- */
`;

  // Generate CSS for each priority level
  priorityStyles.forEach(style => {
    const prioritySelector = style.priority.toLowerCase().replace(/\s+/g, '-');
    const color = style.color || '#4F46E5';
    
    css += `
/* Priority: ${style.priority} */
[data-listing-priority="${prioritySelector}"] {
  position: relative;
}
`;

    // Apply different effects based on the style setting
    switch (style.effect) {
      case 'gradient':
        css += `
[data-listing-priority="${prioritySelector}"]::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, ${color}0D 0%, transparent 50%);
  pointer-events: none;
  z-index: -1;
}
`;
        break;
        
      case 'border':
        css += `
[data-listing-priority="${prioritySelector}"] {
  border-top: 3px solid ${color} !important;
}
`;
        break;
        
      case 'badge':
        css += `
[data-listing-priority="${prioritySelector}"]::after {
  content: "${style.priority}";
  position: absolute;
  top: 10px;
  right: 10px;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 4px 8px;
  border-radius: 4px;
  background-color: ${color};
  color: white;
  z-index: 5;
}
`;
        break;
    }
  });
  
  return css;
}

/**
 * Generates the complete attribute-based CSS
 */
export function generateAttributeBasedCSS(
  categoryStyles: ListingCategoryStyle[] = [],
  priorityStyles: ListingPriorityStyle[] = []
): string {
  return `
/* ==========================================================================
   URL Slug-Based Listing Association System
   Automatically generated CSS for attribute-based styling
   ========================================================================== */

/* --- Base Attribute Selectors --- */

/* Base styling for all listing containers */
[data-listing-slug] {
  position: relative; /* Ensure proper stacking context */
}

${generateCategoryCSS(categoryStyles)}

${generatePriorityCSS(priorityStyles)}

/* --- Location-based Styling --- */

/* New York locations */
[data-listing-location*="new-york"] .directory-action-button {
  border-bottom: 3px solid #2563eb !important;
}

/* California locations */
[data-listing-location*="california"] .directory-action-button {
  border-bottom: 3px solid #16a34a !important;
}

/* Texas locations */
[data-listing-location*="texas"] .directory-action-button {
  border-bottom: 3px solid #dc2626 !important;
}
`;
}

/**
 * Default category styles for common industries
 */
export const DEFAULT_CATEGORY_STYLES: ListingCategoryStyle[] = [
  {
    category: 'electronics',
    buttonColor: '#2563eb', // Blue
    buttonTextColor: '#ffffff',
    borderColor: '#93c5fd',
    accentColor: '#1d4ed8'
  },
  {
    category: 'clothing',
    buttonColor: '#7c3aed', // Purple
    buttonTextColor: '#ffffff',
    borderColor: '#c4b5fd',
    accentColor: '#6d28d9'
  },
  {
    category: 'health',
    buttonColor: '#16a34a', // Green
    buttonTextColor: '#ffffff',
    borderColor: '#86efac',
    accentColor: '#15803d'
  },
  {
    category: 'home',
    buttonColor: '#ea580c', // Orange
    buttonTextColor: '#ffffff',
    borderColor: '#fdba74',
    accentColor: '#c2410c'
  },
  {
    category: 'automotive',
    buttonColor: '#dc2626', // Red
    buttonTextColor: '#ffffff',
    borderColor: '#fca5a5',
    accentColor: '#b91c1c'
  }
];

/**
 * Default priority styles
 */
export const DEFAULT_PRIORITY_STYLES: ListingPriorityStyle[] = [
  {
    priority: 'featured',
    effect: 'gradient',
    color: '#4F46E5' // Indigo
  },
  {
    priority: 'premium',
    effect: 'badge',
    color: '#7C3AED' // Purple
  },
  {
    priority: 'standard',
    effect: 'border',
    color: '#6B7280' // Gray
  }
];