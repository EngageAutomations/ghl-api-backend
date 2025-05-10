# Action Button CSS Generator

## Overview

The Action Button CSS Generator dynamically creates CSS code based on user configurations for action buttons. This ensures that buttons match the user's design preferences while maintaining consistent styling across the application.

## Key Features

- **Real-Time Generation**: Updates CSS code as configuration changes
- **Customization Options**: Supports multiple styling parameters
- **Preview Integration**: Provides live preview of button appearance
- **Color Management**: Handles color selection for background and text
- **Border Radius Control**: Adjusts button corner roundness
- **Button Type Support**: Adapts CSS for different button types (popup, URL, download)

## Implementation Details

### CSS Generation Process

The CSS generation is handled by the `generateCss` function in the `AdvancedStylingConfig` component, which:

1. Takes current configuration values (either from context or passed directly)
2. Builds CSS based on the selected options
3. Returns a complete CSS string that can be inserted into the page

### Button CSS Helper Function

A dedicated helper function handles the creation of button-specific CSS:

```typescript
// Function to generate CSS for action buttons based on configuration
const getActionButtonCSS = (config: any) => {
  const buttonColor = config.buttonColor || "#4F46E5";
  const buttonTextColor = config.buttonTextColor || "#FFFFFF";
  const borderRadius = config.buttonBorderRadius || 4;
  
  return `
/* Action Button Styling */
.hightlevel-action-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background-color: ${buttonColor};
  color: ${buttonTextColor};
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: ${borderRadius}px;
  cursor: pointer;
  transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
  border: none;
  outline: none;
  text-decoration: none;
}

.hightlevel-action-button:hover {
  opacity: 0.9;
}

.hightlevel-action-button:focus {
  outline: 2px solid transparent;
  outline-offset: 2px;
  box-shadow: 0 0 0 2px rgba(${parseInt(buttonColor.slice(1, 3), 16)}, ${parseInt(buttonColor.slice(3, 5), 16)}, ${parseInt(buttonColor.slice(5, 7), 16)}, 0.3);
}`;
};
```

### Main CSS Generation Function

The primary generation function combines all CSS elements:

```typescript
// Generate CSS based on config options
const generateCss = (configOverride?: any) => {
  // Use override config if provided, otherwise use current config
  const configToUse = configOverride || config;
  
  console.log("Generating CSS with config:", {
    hidePriceEnabled,
    enableActionButton: configToUse.enableActionButton,
    enableEmbeddedForm: configToUse.enableEmbeddedForm,
    buttonType: configToUse.buttonType,
    buttonColor: configToUse.buttonColor,
    buttonTextColor: configToUse.buttonTextColor,
    buttonBorderRadius: configToUse.buttonBorderRadius
  });
  
  let css = CORE_CSS;
  
  // Add optional CSS based on local toggle states
  if (hidePriceEnabled) {
    css += "\n" + HIDE_PRICE_CSS;
  }
  
  // Add Action Button CSS if enabled
  if (configToUse.enableActionButton) {
    css += "\n" + getActionButtonCSS(configToUse);
    console.log("Added Action Button CSS");
  }
  
  // Add Embedded Form CSS if enabled
  if (configToUse.enableEmbeddedForm) {
    css += "\n" + EMBEDDED_FORM_CSS;
    console.log("Added Embedded Form CSS");
  }
  
  return css;
};
```

## Configuration Options

The CSS generator supports the following configuration options:

| Option | Type | Description | Default |
|--------|------|-------------|---------|
| `enableActionButton` | boolean | Whether to include action button CSS | `false` |
| `enableEmbeddedForm` | boolean | Whether to include embedded form CSS | `false` |
| `buttonType` | string | Type of button ('popup', 'url', 'download') | `'popup'` |
| `buttonColor` | string | Background color (hex value) | `'#4F46E5'` |
| `buttonTextColor` | string | Text color (hex value) | `'#FFFFFF'` |
| `buttonBorderRadius` | number | Corner roundness in pixels | `4` |
| `hidePrice` | boolean | Whether to include CSS for hiding prices | `false` |

## Integration with Component Communication

The CSS generator integrates with the [Component Communication System](./component-communication.md) to ensure real-time updates:

1. The CSS generator component subscribes to update events:

```typescript
useEffect(() => {
  const unsubscribe = cssUpdateEmitter.subscribe((configOverrides: any) => {
    console.log("CSS Update event received, regenerating CSS with:", configOverrides);
    // Use the received config overrides if available
    const configToUse = configOverrides || config;
    const generatedCss = generateCss(configToUse);
    setCssCode(generatedCss);
    updateConfig({ customCssCode: generatedCss });
  });
  
  return unsubscribe;
}, []);
```

2. Configuration components emit update events when saved:

```typescript
const updatedConfig = {
  ...config,
  enableActionButton: true,
  enableEmbeddedForm: false,
  buttonType: buttonType,
  buttonUrl: localUrlValue,
  buttonLabel: previewButtonText,
  buttonColor: previewColor,
  buttonTextColor: previewTextColor,
  buttonBorderRadius: previewBorderRadius
};

cssUpdateEmitter.emit(updatedConfig);
```

## Usage Example

To use the CSS generator in a new component:

1. Import the necessary utilities:
```typescript
import { cssUpdateEmitter } from "@/lib/events";
```

2. Set up a listener for CSS updates:
```typescript
useEffect(() => {
  const unsubscribe = cssUpdateEmitter.subscribe((config) => {
    // Process updated CSS
  });
  
  return unsubscribe;
}, []);
```

3. Trigger CSS updates when needed:
```typescript
const handleSave = () => {
  // Update your configuration
  const updatedConfig = {
    // Your configuration properties
  };
  
  // Emit the update event
  cssUpdateEmitter.emit(updatedConfig);
};
```

## Best Practices

1. **CSS Organization**: Keep related CSS rules grouped together
2. **Descriptive Comments**: Include comments to explain CSS sections
3. **Avoid Conflicts**: Use specific selectors to avoid style conflicts
4. **Efficiency**: Only regenerate CSS when configuration actually changes
5. **Fallbacks**: Include default values for all styling properties

## Future Enhancements

- **CSS Minification**: Optimize generated CSS for production
- **Animated Transitions**: Add options for animated button states
- **Advanced Selectors**: Support more complex CSS targeting
- **Custom Templates**: Allow users to select from predefined styles
- **CSS Variables**: Use CSS variables for more flexible theming