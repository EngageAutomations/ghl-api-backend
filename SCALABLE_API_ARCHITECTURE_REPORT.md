# Scalable GoHighLevel API Architecture
**Complete Multi-Endpoint System for Railway Backend**

## Architecture Overview

### Scalable Design Principles
- **Dynamic Routing**: Single API manager handles all GoHighLevel endpoints
- **Category-Based Organization**: APIs grouped by functionality (Products, Contacts, etc.)
- **Automatic Authentication**: OAuth tokens injected automatically from stored installations
- **Flexible Parameter Handling**: Supports both query parameters and headers for configuration

## API Categories Implemented

### 1. Products API
- `POST /api/ghl/products` - Create products
- `GET /api/ghl/products` - List products with pagination
- `GET /api/ghl/products/:productId` - Get specific product
- `PUT /api/ghl/products/:productId` - Update product
- `DELETE /api/ghl/products/:productId` - Delete product
- `POST /api/ghl/products/:productId/prices` - Create pricing
- `GET /api/ghl/products/:productId/prices` - Get product prices

### 2. Contacts API
- `POST /api/ghl/contacts` - Create contacts
- `GET /api/ghl/contacts` - List contacts with pagination
- `GET /api/ghl/contacts/:contactId` - Get specific contact
- `PUT /api/ghl/contacts/:contactId` - Update contact

### 3. Locations API
- `GET /api/ghl/locations` - List all locations
- `GET /api/ghl/locations/:locationId` - Get specific location

### 4. Opportunities API
- `POST /api/ghl/opportunities` - Create opportunities
- `GET /api/ghl/opportunities` - List opportunities

### 5. Workflows API
- `GET /api/ghl/workflows` - List workflows
- `POST /api/ghl/workflows/:workflowId/contacts/:contactId` - Trigger workflow

### 6. Forms API
- `GET /api/ghl/forms` - List forms
- `GET /api/ghl/forms/:formId/submissions` - Get form submissions

### 7. Media API
- `POST /api/ghl/media/upload` - Upload media files
- `GET /api/ghl/media` - List media files

### 8. User Info API
- `GET /api/ghl/user/info` - Get OAuth user info
- `GET /api/ghl/user/me` - Get detailed user profile

## Key Features

### Authentication System
- **Automatic Token Injection**: Uses stored OAuth tokens from installations
- **Installation Selection**: Support for multiple installations via headers or query params
- **Location ID Management**: Auto-assigns location IDs from installation data

### Request Handling
- **Universal Router**: Single class handles all API categories
- **Dynamic Method Mapping**: Routes requests to appropriate API manager methods
- **Error Standardization**: Consistent error responses across all endpoints

### Utility Endpoints
- `GET /api/ghl/docs` - Complete API documentation
- `GET /api/ghl/test/all` - Test all endpoints with stored authentication
- `GET /api/ghl/health` - Health check for API connectivity

## Usage Examples

### Create Product
```bash
curl -X POST https://dir.engageautomations.com/api/ghl/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Digital Course",
    "productType": "DIGITAL",
    "description": "Complete training course",
    "availableInStore": true
  }'
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

### Get All Forms
```bash
curl https://dir.engageautomations.com/api/ghl/forms
```

### Upload Media
```bash
curl -X POST https://dir.engageautomations.com/api/ghl/media/upload \
  -H "Content-Type: multipart/form-data" \
  -F "file=@image.jpg"
```

## Advanced Features

### Multi-Installation Support
```bash
# Use specific installation
curl -H "x-installation-id: 2" https://dir.engageautomations.com/api/ghl/products

# Override location ID
curl -H "x-location-id: loc_custom123" https://dir.engageautomations.com/api/ghl/products
```

### Pagination Support
```bash
# Get products with pagination
curl "https://dir.engageautomations.com/api/ghl/products?limit=50&offset=100"
```

### Error Handling
- **Standardized Responses**: Consistent error format across all endpoints
- **Status Code Mapping**: Proper HTTP status codes for different error types
- **Detailed Error Messages**: Includes GoHighLevel API error details

## Scalability Benefits

### Adding New Endpoints
1. Add method to `GoHighLevelAPIManager` class
2. Add route configuration to endpoint array
3. Auto-routing handles the rest

### Supporting New API Categories
1. Add new category enum value
2. Implement category-specific methods
3. Add route patterns for new endpoints

### Performance Optimization
- **Connection Reuse**: Single API manager instance per request
- **Token Caching**: OAuth tokens cached from installations
- **Batch Operations**: Support for bulk operations where needed

## Production Deployment

The scalable API system is deployed as `railway-scalable-api-backend.js` with:
- Complete OAuth flow integration
- All API categories implemented
- Production-ready error handling
- Comprehensive logging and monitoring

## Testing Framework

### Test All Endpoints
```bash
curl https://dir.engageautomations.com/api/ghl/test/all
```

Returns comprehensive test results for all API categories using stored OAuth tokens.

This architecture provides a foundation that can easily accommodate new GoHighLevel API endpoints as they become available, with minimal code changes required.