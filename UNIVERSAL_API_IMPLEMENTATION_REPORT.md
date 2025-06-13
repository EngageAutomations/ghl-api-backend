# Universal GoHighLevel API Implementation
**Complete Dynamic System for All API Endpoints**

## Architecture Overview

### Universal Router Design
- **Single Entry Point**: `/api/ghl/*` handles all GoHighLevel endpoints automatically
- **Dynamic Endpoint Matching**: Recognizes API patterns and routes to appropriate handlers
- **Automatic Parameter Extraction**: Path parameters, query strings, and request bodies processed automatically
- **OAuth Integration**: Uses stored tokens from marketplace installations

## Comprehensive Endpoint Support

### Products API (Updated per Documentation)
- `GET /api/ghl/products` - List products with search, pagination, locationId
- `POST /api/ghl/products` - Create products
- `GET /api/ghl/products/:productId` - Get specific product
- `PUT /api/ghl/products/:productId` - Update product
- `DELETE /api/ghl/products/:productId` - Delete product

### Product Prices API
- `GET /api/ghl/products/:productId/prices` - List product prices
- `POST /api/ghl/products/:productId/prices` - Create pricing
- `GET /api/ghl/products/:productId/prices/:priceId` - Get specific price
- `PUT /api/ghl/products/:productId/prices/:priceId` - Update price
- `DELETE /api/ghl/products/:productId/prices/:priceId` - Delete price

### Contacts API
- `GET /api/ghl/contacts` - List contacts with filtering
- `POST /api/ghl/contacts` - Create contacts
- `GET /api/ghl/contacts/:contactId` - Get specific contact
- `PUT /api/ghl/contacts/:contactId` - Update contact
- `DELETE /api/ghl/contacts/:contactId` - Delete contact

### Opportunities API
- `GET /api/ghl/opportunities` - List opportunities
- `POST /api/ghl/opportunities` - Create opportunities
- `GET /api/ghl/opportunities/:opportunityId` - Get specific opportunity
- `PUT /api/ghl/opportunities/:opportunityId` - Update opportunity
- `DELETE /api/ghl/opportunities/:opportunityId` - Delete opportunity

### Additional APIs
- **Locations**: List, get, update location data
- **Workflows**: List workflows, trigger workflow actions
- **Forms**: List forms, get form submissions
- **Surveys**: List surveys, get survey submissions
- **Media**: Upload files, list media, manage media files
- **Calendars**: List calendars, manage calendar events
- **User Info**: OAuth user info, user profile data

## Key Features

### Dynamic Request Handling
```javascript
// Single universal handler processes all requests
app.all('/api/ghl/*', requireOAuth, UniversalAPIHandler.handleUniversalRequest);
```

### Automatic Parameter Processing
- **Path Parameters**: `:productId`, `:contactId` extracted automatically
- **Query Parameters**: `limit`, `offset`, `search` forwarded to GoHighLevel
- **Location ID Management**: Auto-injected from OAuth installations
- **Request Body**: JSON data passed through to API endpoints

### Error Handling
- **Standardized Responses**: Consistent error format across all endpoints
- **GoHighLevel Error Forwarding**: Original API errors preserved
- **Authentication Validation**: OAuth token verification before requests

## Usage Examples

### List Products with Search
```bash
curl "https://dir.engageautomations.com/api/ghl/products?search=awesome&limit=20&offset=0"
```

### Create Contact
```bash
curl -X POST https://dir.engageautomations.com/api/ghl/contacts \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe", 
    "email": "john@example.com",
    "phone": "+1234567890"
  }'
```

### Update Product
```bash
curl -X PUT https://dir.engageautomations.com/api/ghl/products/prod123 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Product Name",
    "description": "New description"
  }'
```

### Upload Media File
```bash
curl -X POST https://dir.engageautomations.com/api/ghl/media/upload \
  -F "file=@image.jpg"
```

## Advanced Configuration

### Multi-Installation Support
```bash
# Use specific installation
curl -H "x-installation-id: 2" https://dir.engageautomations.com/api/ghl/products

# Override location ID
curl -H "x-location-id: custom123" https://dir.engageautomations.com/api/ghl/contacts
```

### API Documentation
- `GET /api/ghl/docs` - Complete endpoint documentation
- Lists all supported endpoints with parameters
- Shows required scopes and authentication methods

### Testing Framework
- `GET /api/ghl/test/all` - Test all API categories
- Validates OAuth tokens and API connectivity
- Returns success/failure status for each endpoint category

## Implementation Benefits

### Accommodating Many API Calls
1. **Single Configuration**: All endpoints defined in one array
2. **Pattern Matching**: Automatic routing based on HTTP method and path
3. **Parameter Extraction**: Dynamic handling of path and query parameters
4. **Authentication Reuse**: OAuth tokens shared across all endpoints

### Adding New Endpoints
```javascript
// Simply add to configuration array
{ 
  path: '/new-endpoint', 
  method: 'GET', 
  ghlEndpoint: '/api/new-endpoint', 
  requiresLocationId: true, 
  scope: 'new.readonly' 
}
```

### Scalability Features
- **Zero Code Changes**: New endpoints require only configuration
- **Automatic Validation**: OAuth and parameter validation built-in
- **Error Consistency**: Standardized error handling across all endpoints
- **Performance Optimization**: Single request handler for all APIs

## Production Deployment

### Railway Backend Ready
- File: `railway-universal-api-backend.js`
- Complete OAuth integration with stored tokens
- Universal routing handles all GoHighLevel endpoints
- Production error handling and logging

### API Response Format
```json
{
  "success": true,
  "data": {
    "products": [...],
    "total": [{"total": 20}]
  },
  "status": 200
}
```

### Error Response Format
```json
{
  "success": false,
  "error": "API error message",
  "status": 400,
  "details": { /* GoHighLevel error details */ }
}
```

## System Capabilities

This universal system can accommodate unlimited GoHighLevel API endpoints by:
- Dynamically routing requests based on path patterns
- Automatically extracting and forwarding parameters
- Reusing OAuth authentication across all endpoints
- Providing consistent error handling and response formatting
- Supporting all HTTP methods (GET, POST, PUT, DELETE, PATCH)

The implementation scales effortlessly as new GoHighLevel APIs become available, requiring only configuration updates rather than code changes.