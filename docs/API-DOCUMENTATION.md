# API Documentation

## Base URL
`http://localhost:5000/api`

## Authentication
Currently uses session-based authentication with userId = 1 for development. Ready for expansion to full OAuth/JWT implementation.

## API Endpoints

### Directories API

#### GET /api/directories
Get all directories for the authenticated user.

**Response:**
```json
[
  {
    "id": 1,
    "userId": 1,
    "directoryName": "Land for sale",
    "locationId": "wizard-generated-location",
    "enableActionButton": true,
    "buttonType": "download",
    "buttonLabel": "Download Info",
    "buttonUrl": null,
    "logoUrl": "https://example.com/logo.png",
    "actionButtonColor": "#3B82F6",
    "isActive": true,
    "createdAt": "2025-06-06T05:23:35.385Z",
    "updatedAt": "2025-06-06T05:23:35.385Z"
  }
]
```

#### GET /api/directories/:directoryName
Get specific directory by name.

**Parameters:**
- `directoryName` (string): URL-encoded directory name

**Response:** Single directory object (same structure as above)

#### POST /api/directories
Create a new directory.

**Request Body:**
```json
{
  "directoryName": "New Directory",
  "locationId": "location-123",
  "enableActionButton": true,
  "buttonType": "link",
  "buttonLabel": "Visit Site",
  "buttonUrl": "https://example.com",
  "logoUrl": "https://example.com/logo.png",
  "actionButtonColor": "#10B981"
}
```

#### PATCH /api/directories/:id
Update existing directory.

**Parameters:**
- `id` (number): Directory ID

**Request Body:** Partial directory object with fields to update

#### DELETE /api/directories/:id
Delete directory and all associated data.

**Parameters:**
- `id` (number): Directory ID

---

### Listings (Products) API

#### GET /api/listings/:directoryName
Get all listings for a specific directory.

**Parameters:**
- `directoryName` (string): URL-encoded directory name

**Response:**
```json
[
  {
    "id": 1,
    "userId": 1,
    "title": "Premium Property",
    "slug": "premium-property",
    "directoryName": "Land for sale",
    "category": "Residential",
    "location": "123 Main St, City, State 12345",
    "description": "Beautiful 3-bedroom home with modern amenities...",
    "price": "$450,000",
    "downloadUrl": null,
    "linkUrl": "https://example.com/property",
    "popupUrl": null,
    "embedFormUrl": null,
    "imageUrl": "https://example.com/property.jpg",
    "isActive": true,
    "createdAt": "2025-06-06T05:23:35.385Z",
    "updatedAt": "2025-06-06T05:23:35.385Z"
  }
]
```

#### GET /api/listings/id/:id
Get specific listing by ID.

**Parameters:**
- `id` (number): Listing ID

**Response:** Single listing object (same structure as above)

#### GET /api/listings/slug/:slug
Get specific listing by slug.

**Parameters:**
- `slug` (string): Listing slug

**Response:** Single listing object

#### POST /api/listings
Create a new listing.

**Request Body:**
```json
{
  "title": "New Property",
  "directoryName": "Land for sale",
  "category": "Commercial",
  "location": "456 Business Ave",
  "description": "Prime commercial property...",
  "price": "$750,000",
  "linkUrl": "https://example.com/commercial",
  "imageUrl": "https://example.com/commercial.jpg"
}
```

#### PATCH /api/listings/id/:id
Update existing listing.

**Parameters:**
- `id` (number): Listing ID

**Request Body:** Partial listing object with fields to update

#### DELETE /api/listings/id/:id
Delete listing.

**Parameters:**
- `id` (number): Listing ID

---

### Collections API

#### GET /api/collections
Get all collections for the authenticated user.

**Response:**
```json
[
  {
    "id": 1,
    "userId": 1,
    "directoryName": "Land for sale",
    "name": "Featured Properties",
    "slug": "featured-properties",
    "description": "Our most popular listings",
    "imageUrl": "https://example.com/collection.jpg",
    "seoTitle": "Featured Properties - Land for Sale",
    "seoDescription": "Browse our featured properties...",
    "ghlCollectionId": null,
    "syncStatus": "pending",
    "syncError": null,
    "isActive": true,
    "createdAt": "2025-06-06T20:40:08.483Z",
    "updatedAt": "2025-06-06T20:40:08.483Z"
  }
]
```

#### GET /api/collections/directory/:directoryName
Get collections for a specific directory.

**Parameters:**
- `directoryName` (string): URL-encoded directory name

**Response:** Array of collection objects

#### GET /api/collections/:id
Get specific collection by ID.

**Parameters:**
- `id` (number): Collection ID

**Response:** Single collection object

#### POST /api/collections
Create a new collection.

**Request Body:**
```json
{
  "directoryName": "Land for sale",
  "name": "Luxury Homes",
  "description": "Premium residential properties",
  "imageUrl": "https://example.com/luxury.jpg",
  "seoTitle": "Luxury Homes Collection",
  "seoDescription": "Explore our luxury home listings"
}
```

#### PATCH /api/collections/:id
Update existing collection.

**Parameters:**
- `id` (number): Collection ID

**Request Body:** Partial collection object with fields to update

#### DELETE /api/collections/:id
Delete collection and all associated items.

**Parameters:**
- `id` (number): Collection ID

---

### Collection Items API

#### GET /api/collections/:id/items
Get all products in a collection with full listing details.

**Parameters:**
- `id` (number): Collection ID

**Response:**
```json
[
  {
    "id": 1,
    "collectionId": 1,
    "listingId": 1,
    "ghlItemId": null,
    "syncStatus": "pending",
    "syncError": null,
    "addedAt": "2025-06-06T21:15:30.123Z",
    "listing": {
      "id": 1,
      "title": "Premium Property",
      "price": "$450,000",
      "imageUrl": "https://example.com/property.jpg",
      // ... full listing object
    }
  }
]
```

#### POST /api/collections/:id/items
Add products to a collection (batch operation).

**Parameters:**
- `id` (number): Collection ID

**Request Body:**
```json
{
  "listingIds": [1, 2, 3]
}
```

**Response:**
```json
{
  "message": "Added 3 items to collection",
  "addedCount": 3,
  "duplicateCount": 0
}
```

#### DELETE /api/collections/:collectionId/items/:itemId
Remove specific item from collection.

**Parameters:**
- `collectionId` (number): Collection ID
- `itemId` (number): Collection item ID

#### GET /api/listings/:id/collections
Get all collections that contain a specific listing.

**Parameters:**
- `id` (number): Listing ID

**Response:**
```json
[
  {
    "id": 1,
    "collectionId": 1,
    "listingId": 1,
    "addedAt": "2025-06-06T21:15:30.123Z",
    "collection": {
      "id": 1,
      "name": "Featured Properties",
      "directoryName": "Land for sale"
      // ... full collection object
    }
  }
]
```

---

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": "Error message",
  "message": "Detailed error description"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `404` - Not Found
- `409` - Conflict (duplicate entries)
- `500` - Internal Server Error

## Rate Limiting
Currently no rate limiting implemented. Ready for production-grade limiting based on user authentication.

## Future API Enhancements

### GoHighLevel Integration Endpoints
- `POST /api/sync/collections/:id` - Sync collection to GoHighLevel
- `POST /api/sync/listings/:id` - Sync listing to GoHighLevel
- `GET /api/sync/status/:id` - Check sync status
- `POST /api/webhooks/ghl` - Handle GoHighLevel webhooks

### Bulk Operations
- `POST /api/bulk/listings` - Bulk create/update listings
- `POST /api/bulk/collections` - Bulk collection operations
- `GET /api/exports/directory/:name` - Export directory data

### Analytics
- `GET /api/analytics/directories` - Directory performance metrics
- `GET /api/analytics/collections` - Collection engagement data
- `GET /api/analytics/listings` - Listing view statistics