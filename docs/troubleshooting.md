# Troubleshooting Guide

This guide covers common issues and solutions for the directory integration system, helping you quickly resolve problems and optimize performance.

## Code Generation Issues

### Problem: Generated Code Missing Features
**Symptoms**: Code output doesn't include expected features despite toggles being enabled

**Causes & Solutions**:
```javascript
// Check 1: Verify feature state in generation function
const { headerCode, footerCode } = generateFinalIntegrationCode();

// Check 2: Ensure feature flags are properly checked
if (showDescription) {
  footerCode += descriptionCode; // ✓ Correct
}

// Common mistake:
if (config.showDescription) { // ✗ Wrong variable
  footerCode += descriptionCode;
}
```

**Quick Fix**:
1. Open browser dev tools
2. Check console for feature state: `console.log({ showDescription, showMetadata, showMaps })`
3. Verify toggle states match expected values

### Problem: Code Not Updating After Changes
**Symptoms**: Download button generates stale code

**Solution**:
```javascript
// Ensure state updates trigger re-generation
useEffect(() => {
  // Force regeneration when features change
  const { headerCode, footerCode } = generateFinalIntegrationCode();
  // Update code display
}, [showDescription, showMetadata, showMaps]);
```

## Integration Failures

### Problem: Dynamic Content Not Loading
**Symptoms**: Extended descriptions, metadata, or maps don't appear

**Debug Steps**:
```javascript
// 1. Check console for network errors
// 2. Verify API endpoints are responding
fetch('/api/descriptions?slug=test-slug')
  .then(res => res.json())
  .then(data => console.log('API Response:', data))
  .catch(err => console.error('API Error:', err));

// 3. Check slug detection
console.log('Detected slug:', window.GHLDirectory.getSlug());
```

**Common Causes**:
- **CORS issues**: API not allowing cross-origin requests
- **Incorrect slug format**: Slug contains special characters or spaces
- **API endpoint down**: Backend service not responding
- **Missing data**: No content exists for the requested slug

**Solutions**:
```javascript
// Add better error handling
fetch(`/api/descriptions?slug=${encodeURIComponent(slug)}`)
  .then(async res => {
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    }
    return res.json();
  })
  .then(data => {
    if (data.html && data.html.trim()) {
      // Inject content
    } else {
      console.warn('No content returned for slug:', slug);
    }
  })
  .catch(error => {
    console.error('Failed to load description:', error);
  });
```

### Problem: Forms Not Tracking Properly
**Symptoms**: Form submissions don't include listing information

**Debug Checklist**:
```javascript
// 1. Check if hidden fields are being added
document.querySelectorAll('input[type="hidden"]').forEach(input => {
  console.log('Hidden field:', input.name, '=', input.value);
});

// 2. Verify custom field name is correct
console.log('Custom field name:', window.GHLDirectory.customField);

// 3. Check form submission data
document.querySelectorAll('form').forEach(form => {
  form.addEventListener('submit', (e) => {
    console.log('Form data:', new FormData(form));
  });
});
```

**Common Fixes**:
- Ensure forms exist before script runs
- Check that custom field name matches GHL form setup
- Verify script loads after DOM is ready

## UI State Management Issues

### Problem: Local and Global State Out of Sync
**Symptoms**: UI shows different values than saved configuration

**Solution Pattern**:
```javascript
// Always sync local state with global config
useEffect(() => {
  setLocalValue(config.fieldName || "");
}, [config.fieldName]);

// Debounce updates to prevent conflicts
useEffect(() => {
  const timer = setTimeout(() => {
    if (localValue !== config.fieldName) {
      updateConfig({ fieldName: localValue });
    }
  }, 500);
  
  return () => clearTimeout(timer);
}, [localValue]);
```

### Problem: React State Updates Not Reflecting
**Symptoms**: Component doesn't re-render after state changes

**Common Causes**:
```javascript
// ✗ Mutating state directly
config.featureEnabled = true;

// ✓ Using proper state update
updateConfig({ featureEnabled: true });

// ✗ Missing dependencies in useEffect
useEffect(() => {
  doSomething();
}, []); // Missing dependencies

// ✓ Including all dependencies
useEffect(() => {
  doSomething();
}, [dependency1, dependency2]);
```

### Problem: Infinite Re-renders
**Symptoms**: Page becomes unresponsive, console shows endless updates

**Solutions**:
```javascript
// ✗ Creating new objects in render
const config = { ...someConfig }; // Creates new object every render

// ✓ Using useMemo for expensive operations
const memoizedConfig = useMemo(() => ({
  ...someConfig
}), [someConfig]);

// ✗ Missing dependency array
useEffect(() => {
  updateSomething();
}); // Runs on every render

// ✓ Proper dependency array
useEffect(() => {
  updateSomething();
}, [dependency]);
```

## Performance Optimization

### Problem: Slow Code Generation
**Symptoms**: UI freezes when generating code

**Solution**:
```javascript
// Use useMemo for expensive code generation
const generatedCode = useMemo(() => {
  return generateComplexCode(config);
}, [config.relevantFields]); // Only recompute when needed

// Debounce rapid changes
const debouncedGeneration = useDebouncedCallback((newConfig) => {
  generateCode(newConfig);
}, 300);
```

### Problem: Memory Leaks
**Symptoms**: Page gets slower over time

**Common Causes & Fixes**:
```javascript
// ✗ Not cleaning up event listeners
useEffect(() => {
  const handler = () => {};
  window.addEventListener('resize', handler);
}, []); // Missing cleanup

// ✓ Proper cleanup
useEffect(() => {
  const handler = () => {};
  window.addEventListener('resize', handler);
  return () => window.removeEventListener('resize', handler);
}, []);

// ✗ Not unsubscribing from event emitters
useEffect(() => {
  cssUpdateEmitter.subscribe(handler);
}, []); // Missing unsubscribe

// ✓ Proper unsubscribe
useEffect(() => {
  const unsubscribe = cssUpdateEmitter.subscribe(handler);
  return unsubscribe;
}, []);
```

## Browser Compatibility Issues

### Problem: Code Doesn't Work in Older Browsers
**Symptoms**: Features work in Chrome but fail in Safari/Firefox

**Solutions**:
```javascript
// Use feature detection
if ('URLSearchParams' in window) {
  // Modern approach
  const params = new URLSearchParams(window.location.search);
} else {
  // Fallback for older browsers
  const params = parseQueryString(window.location.search);
}

// Avoid modern JavaScript features
// ✗ Uses optional chaining (not supported in older browsers)
const slug = window.location?.pathname?.split('/').pop();

// ✓ Compatible version
const slug = window.location && window.location.pathname 
  ? window.location.pathname.split('/').pop() 
  : null;
```

### Problem: CSS Not Applying Correctly
**Symptoms**: Styling looks broken in certain browsers

**Debug Steps**:
1. Open browser dev tools
2. Check for CSS syntax errors in console
3. Verify CSS properties are supported
4. Test with browser prefixes if needed

**Common Fixes**:
```css
/* Add vendor prefixes for better compatibility */
.element {
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
}

/* Use fallbacks for newer properties */
.element {
  background-color: #f0f0f0; /* Fallback */
  background-color: rgba(240, 240, 240, 0.8); /* Modern */
}
```

## Network and CORS Issues

### Problem: API Calls Failing with CORS Errors
**Symptoms**: Console shows "Access-Control-Allow-Origin" errors

**Client-side Workarounds**:
```javascript
// Add error handling for CORS issues
const loadDataWithFallback = async (slug) => {
  try {
    const response = await fetch(`/api/metadata?slug=${slug}`);
    if (!response.ok) throw new Error('API request failed');
    return await response.json();
  } catch (error) {
    console.warn('API call failed, using fallback:', error);
    // Return empty result or cached data
    return { metadata: [] };
  }
};
```

**Server-side Solutions** (Request from backend team):
```javascript
// Express.js CORS configuration
const cors = require('cors');
app.use(cors({
  origin: ['https://yourdomain.com'],
  credentials: true
}));
```

## Debugging Tools

### Console Debugging Commands
```javascript
// Check current configuration
console.log('Current config:', window.configWizard?.config);

// Test slug detection
console.log('Detected slug:', window.GHLDirectory?.getSlug());

// Verify feature states
console.log('Feature states:', {
  descriptions: window.showDescription,
  metadata: window.showMetadata, 
  maps: window.showMaps
});

// Test API endpoints
fetch('/api/descriptions?slug=test').then(r => r.json()).then(console.log);
```

### Browser Extension Recommendations
- **React Developer Tools**: Debug React state and props
- **Redux DevTools**: Monitor state changes
- **Network Monitor**: Check API request/response details

### Performance Monitoring
```javascript
// Measure code generation performance
console.time('Code Generation');
const code = generateCode();
console.timeEnd('Code Generation');

// Monitor memory usage
console.log('Memory usage:', performance.memory);
```

## Quick Diagnostic Checklist

When facing issues, run through this checklist:

- [ ] Check browser console for JavaScript errors
- [ ] Verify network tab for failed API requests
- [ ] Confirm feature toggle states match expectations
- [ ] Test slug detection with `window.GHLDirectory.getSlug()`
- [ ] Validate generated code includes expected features
- [ ] Check that forms have hidden tracking fields
- [ ] Verify CSS is loading and applying correctly
- [ ] Test in different browsers if possible
- [ ] Clear browser cache and test again

Most issues can be resolved by checking these common causes and applying the appropriate solutions from this guide.