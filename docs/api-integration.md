# API Integration Guide

This guide covers the backend API requirements for the directory integration system, including endpoint specifications, response formats, and implementation recommendations.

## Required API Endpoints

The directory integration system requires three main API endpoints to support dynamic content loading:

### 1. Extended Descriptions API

**Endpoint**: `GET /api/descriptions`
**Purpose**: Fetch rich content descriptions for listings

#### Request Parameters
```
GET /api/descriptions?slug=example-listing-123
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `slug` | string | Yes | Unique identifier for the listing |

#### Expected Response Format
```json
{
  "html": "<div><h3>Extended Description</h3><p>Rich content with <strong>formatting</strong> and images.</p><img src='image.jpg' alt='Product image' /></div>"
}
```

#### Response Fields
- `html` (string): Complete HTML content to inject into the page
- Content should be sanitized and safe for innerHTML injection
- Images should use absolute URLs or be properly hosted
- HTML should be self-contained with inline styles if needed

#### Error Handling
```json
// 404 - Listing not found
{
  "error": "Listing not found",
  "code": "LISTING_NOT_FOUND"
}

// 500 - Server error
{
  "error": "Internal server error",
  "code": "INTERNAL_ERROR"
}
```

### 2. Metadata Bar API

**Endpoint**: `GET /api/metadata`
**Purpose**: Fetch structured metadata for listings

#### Request Parameters
```
GET /api/metadata?slug=example-listing-123
```

#### Expected Response Format
```json
{
  "metadata": [
    {
      "icon": "https://example.com/icons/category.svg",
      "text": "Electronics"
    },
    {
      "icon": "https://example.com/icons/location.svg", 
      "text": "New York, NY"
    },
    {
      "icon": "https://example.com/icons/rating.svg",
      "text": "4.8/5 Stars"
    }
  ]
}
```

#### Response Fields
- `metadata` (array): List of metadata items
  - `icon` (string): Absolute URL to icon image (recommended: SVG, 20x20px)
  - `text` (string): Display text for the metadata item

#### Icon Requirements
- Format: SVG preferred, PNG acceptable
- Size: 20x20 pixels recommended
- Style: Simple, monochrome icons work best
- Hosting: Must be accessible via HTTPS

### 3. Google Maps API

**Endpoint**: `GET /api/map`
**Purpose**: Fetch address information for map display

#### Request Parameters
```
GET /api/map?slug=example-listing-123
```

#### Expected Response Format
```json
{
  "address": "123 Main Street, New York, NY 10001, USA"
}
```

#### Response Fields
- `address` (string): Complete, geocodable address
- Address should be formatted for Google Maps embedding
- Include city, state/province, and country for best results

## Implementation Recommendations

### 1. Response Time Optimization
- **Target**: < 200ms response time
- **Caching**: Implement Redis or similar for frequently accessed listings
- **CDN**: Use CDN for icon and image assets
- **Database**: Index slug fields for fast lookups

### 2. Content Security
```javascript
// Server-side HTML sanitization example
const sanitizeHtml = require('sanitize-html');

const cleanHtml = sanitizeHtml(rawHtml, {
  allowedTags: ['p', 'br', 'strong', 'em', 'h1', 'h2', 'h3', 'img', 'a'],
  allowedAttributes: {
    'img': ['src', 'alt', 'title'],
    'a': ['href', 'title']
  },
  allowedSchemes: ['https']
});
```

### 3. Error Handling Best Practices
```javascript
// Express.js example
app.get('/api/descriptions', async (req, res) => {
  try {
    const { slug } = req.query;
    
    if (!slug) {
      return res.status(400).json({
        error: "Slug parameter is required",
        code: "MISSING_SLUG"
      });
    }
    
    const listing = await findListingBySlug(slug);
    
    if (!listing) {
      return res.status(404).json({
        error: "Listing not found", 
        code: "LISTING_NOT_FOUND"
      });
    }
    
    res.json({ html: listing.extendedDescription });
    
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({
      error: "Internal server error",
      code: "INTERNAL_ERROR"
    });
  }
});
```

## Database Schema Recommendations

### Listings Table
```sql
CREATE TABLE listings (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(255) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  extended_description TEXT, -- HTML content for descriptions API
  address TEXT, -- Full address for maps API
  metadata JSONB, -- Structured metadata for metadata API
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for fast slug lookups
CREATE INDEX idx_listings_slug ON listings(slug);
```

### Metadata Schema Example
```json
{
  "category": {
    "icon": "https://cdn.example.com/icons/category.svg",
    "text": "Electronics"
  },
  "location": {
    "icon": "https://cdn.example.com/icons/location.svg", 
    "text": "New York, NY"
  },
  "rating": {
    "icon": "https://cdn.example.com/icons/rating.svg",
    "text": "4.8/5 Stars"
  }
}
```

## Testing Strategies

### 1. API Testing
```javascript
// Jest test example
describe('Descriptions API', () => {
  test('should return HTML for valid slug', async () => {
    const response = await request(app)
      .get('/api/descriptions?slug=test-listing')
      .expect(200);
      
    expect(response.body).toHaveProperty('html');
    expect(typeof response.body.html).toBe('string');
  });
  
  test('should return 404 for invalid slug', async () => {
    const response = await request(app)
      .get('/api/descriptions?slug=nonexistent')
      .expect(404);
      
    expect(response.body.code).toBe('LISTING_NOT_FOUND');
  });
});
```

### 2. Content Validation
```javascript
const validateMetadata = (metadata) => {
  if (!Array.isArray(metadata)) return false;
  
  return metadata.every(item => 
    item.icon && 
    item.text && 
    item.icon.startsWith('https://')
  );
};
```

### 3. Load Testing
```bash
# Use Apache Bench for load testing
ab -n 1000 -c 10 http://localhost:3000/api/descriptions?slug=test-listing

# Use Artillery for more complex scenarios
artillery quick --count 100 --num 10 http://localhost:3000/api/metadata?slug=test-listing
```

## Frontend Integration

### Error Handling in Frontend
```javascript
// Robust API call with error handling
const loadExtendedDescription = async (slug) => {
  try {
    const response = await fetch(`/api/descriptions?slug=${encodeURIComponent(slug)}`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.html && data.html.trim()) {
      injectDescription(data.html);
    }
    
  } catch (error) {
    console.error('Error loading extended description:', error);
    // Graceful degradation - don't break the page
  }
};
```

### Rate Limiting Considerations
```javascript
// Simple rate limiting for API calls
const apiCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const getCachedData = (url) => {
  const cached = apiCache.get(url);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
};
```

## Security Considerations

### 1. Input Validation
- Always validate and sanitize slug parameters
- Use parameterized queries to prevent SQL injection
- Implement rate limiting to prevent abuse

### 2. Content Security Policy
```html
<!-- Add CSP headers for secure content loading -->
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               img-src 'self' https://cdn.example.com https://trusted-images.com;
               frame-src https://www.google.com">
```

### 3. CORS Configuration
```javascript
// Express CORS setup
app.use(cors({
  origin: ['https://yourdomain.com', 'https://www.yourdomain.com'],
  credentials: true
}));
```

This API integration guide ensures your backend properly supports all the dynamic features of the directory integration system while maintaining security and performance standards.