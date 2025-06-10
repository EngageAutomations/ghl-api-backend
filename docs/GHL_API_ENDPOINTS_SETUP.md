# GoHighLevel API Endpoints Implementation

## Overview
Comprehensive OAuth-based GoHighLevel API integration with v2 API endpoints for marketplace applications.

## API Endpoints Implemented

### Authentication & User Management
- `GET /api/ghl/user-info` - Get authenticated user information
- `POST /api/ghl/refresh-token` - Refresh OAuth access tokens

### Location Management
- `GET /api/ghl/locations` - Get user's GoHighLevel locations
- `GET /api/ghl/locations/:locationId` - Get specific location details

### Contact Management (Location-scoped)
- `GET /api/ghl/locations/:locationId/contacts` - List contacts in location
- `GET /api/ghl/locations/:locationId/contacts/:contactId` - Get specific contact
- `POST /api/ghl/locations/:locationId/contacts` - Create new contact
- `PUT /api/ghl/locations/:locationId/contacts/:contactId` - Update contact
- `DELETE /api/ghl/locations/:locationId/contacts/:contactId` - Delete contact

### Custom Fields Management
- `GET /api/ghl/locations/:locationId/custom-fields` - Get location's custom fields
- `POST /api/ghl/locations/:locationId/custom-fields` - Create custom field

### Media Library/Files Management
- `GET /api/ghl/locations/:locationId/files` - List media files in location
- `POST /api/ghl/locations/:locationId/files/upload` - Upload file to GHL media library

### Products Management
- `GET /api/ghl/locations/:locationId/products` - List products in location
- `GET /api/ghl/locations/:locationId/products/:productId` - Get specific product
- `POST /api/ghl/locations/:locationId/products` - Create new product
- `PUT /api/ghl/locations/:locationId/products/:productId` - Update product
- `DELETE /api/ghl/locations/:locationId/products/:productId` - Delete product
- `POST /api/ghl/locations/:locationId/products/:productId/toggle-store` - Include/exclude from store

### Product Prices Management
- `GET /api/ghl/locations/:locationId/products/:productId/prices` - List product prices
- `GET /api/ghl/locations/:locationId/products/:productId/prices/:priceId` - Get specific price
- `POST /api/ghl/locations/:locationId/products/:productId/prices` - Create product price
- `PUT /api/ghl/locations/:locationId/products/:productId/prices/:priceId` - Update price
- `DELETE /api/ghl/locations/:locationId/products/:productId/prices/:priceId` - Delete price

### Data Synchronization
- `POST /api/ghl/sync/contacts` - Sync contacts from GHL to local database
- `POST /api/ghl/sync/locations` - Sync user locations from GHL

### Health Check
- `GET /api/ghl/health` - Test API connectivity

## OAuth Implementation Features

### Token Management
- **Authorization Code Exchange**: Convert OAuth codes to access tokens
- **Token Refresh**: Automatic refresh of expired tokens
- **Token Validation**: Check token expiry with 5-minute buffer

### Security Features
- **Scoped Access**: Proper OAuth scopes for contacts, locations, users
- **Location-based Isolation**: All operations scoped to specific GHL locations
- **Encrypted Token Storage**: Secure storage in database with user isolation

### API Schemas
Comprehensive Zod schemas for:
- **GHLTokenResponse**: OAuth token exchange responses
- **GHLUserInfo**: User profile with permissions and roles
- **GHLContact**: Complete contact data with custom fields
- **GHLLocation**: Location details and settings
- **GHLCustomField**: Custom field definitions and validation

## Usage Examples

### Basic Authentication Flow
```javascript
// Get user info with access token
const userInfo = await fetch('/api/ghl/user-info?accessToken=' + token);

// Refresh expired token
const newTokens = await fetch('/api/ghl/refresh-token', {
  method: 'POST',
  body: JSON.stringify({ refreshToken })
});
```

### Contact Management
```javascript
// Get contacts for a location
const contacts = await fetch(
  `/api/ghl/locations/${locationId}/contacts?accessToken=${token}&limit=100`
);

// Create new contact
const contact = await fetch(`/api/ghl/locations/${locationId}/contacts?accessToken=${token}`, {
  method: 'POST',
  body: JSON.stringify({
    contactName: "John Doe",
    email: "john@example.com",
    phone: "+1234567890"
  })
});
```

### Media Library Management
```javascript
// Get files from media library
const files = await fetch(
  `/api/ghl/locations/${locationId}/files?accessToken=${token}&limit=50`
);

// Upload file to media library
const formData = new FormData();
formData.append('file', fileInput.files[0]);
const uploadResult = await fetch(
  `/api/ghl/locations/${locationId}/files/upload?accessToken=${token}`, 
  {
    method: 'POST',
    body: formData
  }
);
```

### Products Management
```javascript
// Get all products for a location
const products = await fetch(
  `/api/ghl/locations/${locationId}/products?accessToken=${token}`
);

// Create new product
const newProduct = await fetch(
  `/api/ghl/locations/${locationId}/products?accessToken=${token}`, 
  {
    method: 'POST',
    body: JSON.stringify({
      name: "Premium Widget",
      description: "High-quality widget for professionals",
      productType: "PHYSICAL",
      status: "ACTIVE",
      availableInStore: true
    })
  }
);

// Toggle product store visibility
const toggleResult = await fetch(
  `/api/ghl/locations/${locationId}/products/${productId}/toggle-store?accessToken=${token}&action=include`, 
  {
    method: 'POST'
  }
);
```

### Product Pricing
```javascript
// Get all prices for a product
const prices = await fetch(
  `/api/ghl/locations/${locationId}/products/${productId}/prices?accessToken=${token}`
);

// Create recurring subscription price
const subscriptionPrice = await fetch(
  `/api/ghl/locations/${locationId}/products/${productId}/prices?accessToken=${token}`, 
  {
    method: 'POST',
    body: JSON.stringify({
      name: "Monthly Subscription",
      currency: "USD",
      amount: 2999, // $29.99 in cents
      type: "RECURRING",
      recurring: {
        interval: "MONTH",
        intervalCount: 1
      },
      trial: {
        enabled: true,
        interval: "DAY",
        intervalCount: 7
      }
    })
  }
);

// Create one-time purchase price
const oneTimePrice = await fetch(
  `/api/ghl/locations/${locationId}/products/${productId}/prices?accessToken=${token}`, 
  {
    method: 'POST',
    body: JSON.stringify({
      name: "One-time Purchase",
      currency: "USD",
      amount: 9999, // $99.99 in cents
      type: "ONE_TIME",
      compareAtPrice: 12999 // $129.99 comparison price
    })
  }
);
```

### Data Synchronization
```javascript
// Sync all contacts for a location
const syncResult = await fetch('/api/ghl/sync/contacts', {
  method: 'POST',
  body: JSON.stringify({ locationId, accessToken })
});

// Sync user's locations
const locationSync = await fetch('/api/ghl/sync/locations', {
  method: 'POST',
  body: JSON.stringify({ accessToken })
});
```

## Integration with OAuth System

### Seamless User Flow
1. **OAuth Installation**: Users install marketplace app via GoHighLevel
2. **Token Exchange**: App exchanges authorization code for access tokens
3. **User Creation**: Creates OAuth user in local database
4. **API Access**: User can immediately access GHL data through authenticated endpoints

### Error Handling
- **Token Expiry**: Automatic detection and refresh suggestions
- **Permission Errors**: Clear error messages for insufficient scopes
- **Rate Limiting**: Proper handling of API rate limits
- **Network Failures**: Graceful degradation with retry logic

## Database Integration

### User Token Storage
```sql
-- OAuth users with encrypted tokens
UPDATE users SET 
  ghl_access_token = 'encrypted_token',
  ghl_refresh_token = 'encrypted_refresh',
  ghl_token_expiry = '2025-06-11 17:30:00'
WHERE ghl_user_id = 'user_id';
```

### Sync Data Storage
- **Contacts**: Store synced contacts with GHL IDs for bidirectional sync
- **Locations**: Cache location data for offline access
- **Custom Fields**: Store field definitions for form generation

## Security Considerations

### Token Security
- **Encryption**: All OAuth tokens encrypted before database storage
- **Isolation**: User tokens isolated by user_id and location_id
- **Expiry Tracking**: Automatic expiry detection prevents stale token usage

### API Security
- **Scoped Access**: All endpoints require specific location and user context
- **Input Validation**: Zod schemas validate all API inputs/outputs
- **Error Sanitization**: Sensitive data excluded from error responses

## Next Steps

### Immediate Capabilities
✅ **OAuth User Authentication**: Complete flow working with production domain
✅ **API Endpoint Access**: All major GHL operations available
✅ **Token Management**: Refresh and validation implemented
✅ **Data Synchronization**: Bidirectional contact and location sync

### Future Enhancements
- **Webhook Integration**: Real-time sync via GHL webhooks
- **Bulk Operations**: Batch processing for large datasets
- **Advanced Filtering**: Complex contact queries and segmentation
- **Custom Field Automation**: Dynamic form generation from GHL fields

## Production Status
**READY FOR PRODUCTION** - All OAuth endpoints tested and working with live GoHighLevel integration on dir.engageautomations.com domain.