# GoHighLevel Directory & Collections Management System

## Overview

This is a full-stack web application that provides comprehensive directory and collections management capabilities designed for GoHighLevel marketplace integration. The system enables users to create directories, manage product listings, and organize them into collections with automated synchronization capabilities.

## System Architecture

### Frontend Architecture
- **Technology Stack**: React TypeScript with Vite for development
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query for server state management and caching
- **UI Framework**: Tailwind CSS with shadcn/ui components
- **Animations**: Framer Motion for enhanced user experience

### Backend Architecture (Railway Integration)
- **Primary Frontend**: React TypeScript application with local data management
- **GoHighLevel Integration**: Railway backend at dir.engageautomations.com handles OAuth token lifecycle
- **Token Management**: Railway installation (install_1750252333303) owns complete token refresh cycle
- **API Flow**: Form submissions → Railway backend → GoHighLevel API → product creation
- **Authentication**: No local OAuth secrets required - Railway manages complete token lifecycle
- **Reliability**: Automatic token refresh 5 minutes before expiry prevents API failures

### Database Architecture
- **Relationship Model**: Many-to-many relationships between collections and products
- **Organization**: Directory-based logical grouping
- **External Integration**: Schema designed with GoHighLevel API integration fields

## Key Components

### Core Data Models
- **Users**: Authentication and user management with OAuth support
- **Directories**: Top-level organizational containers for listings
- **Listings**: Individual product/service entries with rich metadata
- **Collections**: Curated groups of related listings
- **Collection Items**: Junction table managing many-to-many relationships
- **Designer Configs**: UI customization and styling configurations
- **OAuth Installations**: GoHighLevel integration tracking

### Frontend Components
- **Dashboard Navigation**: Single-page application with context-aware routing
- **Configuration Wizard**: Multi-step setup process with validation
- **Dynamic Form Builder**: Customizable form field management
- **Collection Management**: Drag-and-drop organization interface
- **Real-time Updates**: Live synchronization across components

### Backend Services
- **Authentication Middleware**: JWT and OAuth token management
- **GoHighLevel OAuth Service**: Complete OAuth 2.0 integration
- **API Route Handlers**: Comprehensive endpoint coverage
- **Database Storage Layer**: Abstracted data access with multiple storage backends

## Data Flow

### Primary User Flow
1. **Authentication**: Users authenticate via local login or GoHighLevel OAuth
2. **Directory Creation**: Users create directories with custom configurations
3. **Listing Management**: Products are added and organized within directories
4. **Collection Organization**: Related listings are grouped into collections
5. **Code Generation**: Custom integration code is generated for embedding
6. **External Sync**: Data synchronizes with GoHighLevel when configured

### GoHighLevel Integration Data Flow
1. **Form Submission**: User creates listing through CreateListingForm component
2. **Railway API Call**: Form calls https://dir.engageautomations.com/api/ghl/products/create
3. **Token Validation**: Railway backend checks token freshness and refreshes if needed
4. **GoHighLevel API**: Railway makes authenticated request to GHL products endpoint
5. **Product Creation**: GoHighLevel creates product in user's account
6. **Local Storage**: Listing saved locally with GoHighLevel location ID for tracking

### Local API Data Flow
1. **Client Requests**: Frontend makes API calls through TanStack Query
2. **Authentication Check**: Middleware validates user sessions
3. **Database Operations**: Drizzle ORM handles type-safe database interactions
4. **Response Formatting**: Consistent JSON responses with error handling
5. **State Updates**: Frontend state automatically updates via cache invalidation

## External Dependencies

### Core Dependencies
- **React 18+**: Frontend framework
- **Express.js**: Backend server framework
- **PostgreSQL**: Primary database
- **Drizzle ORM**: Database toolkit and query builder
- **TanStack Query**: Server state management
- **Tailwind CSS**: Utility-first CSS framework
- **Wouter**: Lightweight React router

### Development Dependencies
- **Vite**: Build tool and development server
- **TypeScript**: Type safety and development experience
- **Replit**: Development environment and hosting
- **PostCSS**: CSS processing
- **ESLint/Prettier**: Code quality tools

### External Integrations
- **GoHighLevel API**: OAuth authentication and data synchronization via Railway backend
- **Railway Backend**: External OAuth token management at dir.engageautomations.com
- **Google Drive API**: File storage and management (configured)
- **OpenAI API**: AI-powered features (optional)

## Deployment Strategy

### Development Environment
- **Platform**: Replit with Node.js 20 and PostgreSQL 16 modules
- **Hot Reload**: Vite development server with automatic reloading
- **Database**: Local PostgreSQL instance with automatic migrations

### Production Deployment
- **Target**: Replit Autoscale deployment
- **Build Process**: `npm run build` creates optimized production bundle
- **Server**: Express.js serves static files and API endpoints
- **Database**: Production PostgreSQL with connection pooling

### Environment Configuration
- **Development**: Local `.env` file with development credentials
- **Production**: Environment variables managed through Replit secrets
- **Feature Flags**: Environment-based feature toggling

## Railway OAuth Integration

### Architecture Overview
The system uses a Railway-hosted backend service to completely manage GoHighLevel OAuth token lifecycle, eliminating the need for local token handling and ensuring reliable API access.

### Implementation Details
- **Railway Backend URL**: `https://dir.engageautomations.com`
- **Installation ID**: `install_1750252333303`
- **Primary Endpoint**: `/api/ghl/products/create`
- **Token Refresh**: Automatic refresh 5 minutes before expiry
- **No Local Secrets**: Railway manages all OAuth credentials

### Integration Flow
1. **Product Creation Request**: CreateListingForm component submits product data
2. **Railway Processing**: Backend validates token freshness and refreshes if needed
3. **GoHighLevel API Call**: Railway makes authenticated request to create product
4. **Response Handling**: Success/error responses returned to frontend
5. **Local Persistence**: Listing stored with GoHighLevel location ID for tracking

### Key Benefits
- **Zero Token Management**: No local OAuth credential handling required
- **Automatic Refresh**: Prevents API failures from expired tokens
- **Scalable Architecture**: Railway handles multiple concurrent requests
- **Separation of Concerns**: Frontend focuses on UI, Railway handles authentication
- **Reliability**: Scheduled token refresh ensures continuous API access

### Error Handling
- Railway backend returns detailed error messages for debugging
- Frontend displays user-friendly messages for common failures
- Token refresh failures are handled transparently by Railway
- Network issues gracefully degrade with retry mechanisms

### Development Workflow
1. **Local Development**: Frontend connects directly to Railway production backend
2. **Testing**: Real GoHighLevel products created during development
3. **No Local OAuth Setup**: Skip complex local OAuth configuration
4. **Immediate Integration**: Railway backend ready for immediate use

### Code Implementation Example
```typescript
// CreateListingForm.tsx - Railway API Integration
const ghlResponse = await fetch('https://dir.engageautomations.com/api/ghl/products/create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    installationId: 'install_1750252333303',
    productData: {
      name: formData.title,
      description: formData.description,
      productType: 'DIGITAL',
      price: parseFloat(formData.price) || 100
    }
  })
});
```

### Troubleshooting Guide

**Common Issues:**
- **Network Timeouts**: Railway backend may take 5-10 seconds for token refresh
- **Product Creation Failures**: Check GoHighLevel account permissions
- **Missing Location ID**: Ensure Railway installation has proper location access

**Debug Steps:**
1. Verify Railway backend is accessible at dir.engageautomations.com
2. Check browser network tab for detailed error responses
3. Confirm installationId 'install_1750252333303' is active
4. Test with minimal product data to isolate issues

**Success Indicators:**
- HTTP 200 response from Railway backend
- Product visible in GoHighLevel account
- Local listing saved with ghlLocationId populated
- Toast notification confirms successful creation

## Recent Changes

- June 19, 2025: Enhanced Image Upload System Implementation
  - Created ImageUploadManager component with drag-and-drop functionality
  - Added support for multiple image uploads through Railway backend integration
  - Updated database schema with imageUrls and ghlMediaIds JSONB arrays
  - Integrated Railway backend media upload endpoint with automatic token refresh
  - Enhanced CreateListingForm to use new multi-image upload system
  - Two-stage upload process: local preview → Railway backend → GoHighLevel media library
  - Maintains backward compatibility with single imageUrl field
  - Image data automatically included in listing creation submissions

- June 18, 2025: Railway OAuth Architecture Implementation
  - Railway backend at dir.engageautomations.com owns complete OAuth token lifecycle
  - Installation install_1750252333303 handles automatic token refresh 5 minutes before expiry
  - Form submissions call Railway /api/ghl/products/create endpoint with installationId
  - Railway backend manages: OAuth callbacks, token refresh timers, ensureFreshToken guards
  - Products created successfully in GoHighLevel with automatic token management
  - System uses Railway's scheduled refresh and on-demand token validation
  - Local project focuses on frontend interface, Railway handles all OAuth complexity
  - Complete authentication flow: user OAuth → Railway installation → automatic token refresh

## Changelog

- June 18, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.