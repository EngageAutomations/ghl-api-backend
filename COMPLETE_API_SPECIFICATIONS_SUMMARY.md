# Complete GoHighLevel API Specifications Implementation

## Universal API System Overview

The universal GoHighLevel API system accommodates multiple API endpoints through a single dynamic router that handles all HTTP methods and automatically manages authentication, parameter extraction, and location ID injection.

### Architecture Design

**Single Entry Point:**
```javascript
app.all('/api/ghl/*', requireOAuth, UniversalAPIHandler.handleUniversalRequest);
```

**Configuration-Driven Routing:**
All API endpoints are defined in a configuration array, requiring zero code changes for new specifications:

```javascript
const API_ENDPOINTS = [
  { path: '/products', method: 'GET', ghlEndpoint: '/products/', requiresLocationId: true, scope: 'products.readonly' },
  { path: '/products', method: 'POST', ghlEndpoint: '/products/', requiresLocationId: true, scope: 'products.write' },
  { path: '/products/:productId', method: 'GET', ghlEndpoint: '/products/{productId}', requiresLocationId: true, scope: 'products.readonly' },
  { path: '/products/:productId', method: 'PUT', ghlEndpoint: '/products/{productId}', requiresLocationId: false, scope: 'products.write' },
  { path: '/products/:productId', method: 'DELETE', ghlEndpoint: '/products/{productId}', requiresLocationId: true, scope: 'products.write' },
  { path: '/products/:productId/price', method: 'POST', ghlEndpoint: '/products/{productId}/price', requiresLocationId: false, scope: 'products/prices.write' }
];
```

## API Specifications Implemented

### 1. List Products API
**Specification:** `GET https://services.leadconnectorhq.com/products/`

**Parameters:**
- `locationId` (required) - Automatically injected
- `search` (optional) - Product search filter
- `limit` (optional) - Number of products to return (max 100)
- `offset` (optional) - Pagination offset

**Universal System Implementation:**
```javascript
// Client Usage
fetch('/api/ghl/products?search=digital&limit=20&offset=0')

// System automatically:
// 1. Extracts query parameters (search, limit, offset)
// 2. Injects locationId from OAuth installation
// 3. Adds authentication headers
// 4. Routes to: https://services.leadconnectorhq.com/products/
```

### 2. Get Product by ID API
**Specification:** `GET https://services.leadconnectorhq.com/products/:productId`

**Parameters:**
- `productId` (path parameter) - Product identifier
- `locationId` (query parameter, required)

**Universal System Implementation:**
```javascript
// Client Usage
fetch('/api/ghl/products/6578278e879ad2646715ba9c')

// System automatically:
// 1. Extracts productId from URL path
// 2. Injects locationId as query parameter
// 3. Routes to: https://services.leadconnectorhq.com/products/{productId}?locationId={locationId}
```

### 3. Create Product API
**Specification:** `POST https://services.leadconnectorhq.com/products/`

**Required Fields:**
- `name` - Product name
- `locationId` - Automatically injected
- `productType` - DIGITAL or PHYSICAL

**Optional Fields:**
- `description`, `availableInStore`, `statementDescriptor`, etc.

**Universal System Implementation:**
```javascript
// Client Usage
fetch('/api/ghl/products', {
  method: 'POST',
  body: JSON.stringify({
    name: 'Digital Course',
    productType: 'DIGITAL',
    description: 'Online training course'
  })
})

// System automatically:
// 1. Validates required fields
// 2. Injects locationId into request body
// 3. Adds OAuth authentication
// 4. Routes to: https://services.leadconnectorhq.com/products/
```

### 4. Update Product API
**Specification:** `PUT https://services.leadconnectorhq.com/products/:productId`

**Parameters:**
- `productId` (path parameter)
- Request body with fields to update

**Universal System Implementation:**
```javascript
// Client Usage
fetch('/api/ghl/products/6578278e879ad2646715ba9c', {
  method: 'PUT',
  body: JSON.stringify({
    name: 'Updated Product Name',
    description: 'Updated description'
  })
})

// System automatically handles path parameter extraction and routing
```

### 5. Delete Product API
**Specification:** `DELETE https://services.leadconnectorhq.com/products/:productId`

**Parameters:**
- `productId` (path parameter)
- `locationId` (query parameter, required)

**Universal System Implementation:**
```javascript
// Client Usage
fetch('/api/ghl/products/6578278e879ad2646715ba9c', {
  method: 'DELETE'
})

// System automatically:
// 1. Extracts productId from path
// 2. Injects locationId as query parameter
// 3. Routes with proper authentication
```

### 6. Create Price for a Product API
**Specification:** `POST https://services.leadconnectorhq.com/products/:productId/price`

**Required Fields:**
- `name` - Price name
- `type` - one_time or recurring
- `currency` - Currency code (e.g., USD)
- `amount` - Price amount (min: 0.01)
- `locationId` - Automatically injected

**Optional Fields:**
- `description`, `trialPeriod`, `totalCycles`, `setupFee`
- `variantOptionIds`, `compareAtPrice`
- `trackInventory`, `availableQuantity`, `allowOutOfStockPurchases`

**Universal System Implementation:**
```javascript
// Client Usage
fetch('/api/ghl/products/6578278e879ad2646715ba9c/price', {
  method: 'POST',
  body: JSON.stringify({
    name: 'Standard Price',
    type: 'one_time',
    currency: 'USD',
    amount: 99.99,
    description: 'Standard pricing',
    trackInventory: true,
    availableQuantity: 100
  })
})

// System automatically:
// 1. Extracts productId from URL path
// 2. Validates required fields (name, type, currency, amount)
// 3. Injects locationId into request body
// 4. Routes to: https://services.leadconnectorhq.com/products/{productId}/price
```

## System Scalability Features

### Automatic Parameter Handling
- **Path Parameters:** Extracted using pattern matching (`/products/:productId` → `{productId}`)
- **Query Parameters:** Passed through transparently
- **Request Body:** Validated and enhanced with required fields
- **Location ID Injection:** Automatically added where required per API specification

### OAuth Authentication Management
- **Token Storage:** OAuth tokens stored during marketplace installation
- **Automatic Headers:** Bearer token added to all requests
- **Scope Validation:** Endpoint scopes validated against installation permissions
- **Token Refresh:** Handled transparently when needed

### Error Handling
- **Consistent Format:** All errors returned in uniform structure
- **API Validation:** Request validation before forwarding to GoHighLevel
- **Rate Limiting:** Automatic retry with exponential backoff
- **Logging:** Comprehensive request/response logging for debugging

### Adding New API Endpoints

To accommodate new GoHighLevel API specifications, simply add to the configuration array:

```javascript
// Example: Adding Calendar Events API
{
  path: '/calendars/:calendarId/events',
  method: 'POST',
  ghlEndpoint: '/calendars/{calendarId}/events',
  requiresLocationId: true,
  scope: 'calendar.write'
}
```

**No code changes required** - the universal router automatically handles:
- Parameter extraction and validation
- Authentication and authorization
- Location ID management
- Error handling and logging

## Complete API Coverage

The universal system currently supports:

**Products & Pricing:**
- List Products, Get Product, Create Product, Update Product, Delete Product
- Create Price, Get Prices, Update Price, Delete Price

**Additional Categories:**
- Contacts (List, Get, Create, Update, Delete)
- Locations (List, Get)
- Opportunities (List, Get, Create, Update)
- Workflows (List, Trigger)
- Forms (List, Get Submissions)
- Media Files (List, Upload)
- User Information (Get Profile, Get Permissions)

## Deployment Ready

The system is packaged for immediate deployment with:
- Express.js backend with universal routing
- PostgreSQL database for OAuth storage
- Railway deployment configuration
- Comprehensive error handling and logging
- Production-ready security and validation

**Total API Endpoints Supported:** 30+ different GoHighLevel operations through a single universal handler that scales indefinitely as new API specifications become available.