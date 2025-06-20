# GoHighLevel OAuth Marketplace Application

## Overview

This is a full-stack marketplace application that provides OAuth integration with GoHighLevel and a universal API system for accessing GoHighLevel endpoints. The application enables users to authenticate with their GoHighLevel accounts and perform various operations through a unified API interface.

## System Architecture

The application follows a modern full-stack architecture with clear separation between frontend and backend concerns:

- **Frontend**: React-based single-page application built with Vite
- **Backend**: Express.js server with TypeScript/Node.js
- **Database**: PostgreSQL with Drizzle ORM
- **Deployment**: Configured for Replit autoscale deployment
- **Authentication**: OAuth 2.0 integration with GoHighLevel

## Key Components

### Backend Architecture

**Express Server (`server/index.ts`)**
- Main server entry point handling API routes
- OAuth callback management
- Universal API routing system

**Database Layer**
- **Schema**: Defined in `shared/schema.ts` with user and OAuth installation tables
- **Connection**: Neon PostgreSQL serverless connection (`server/db.ts`)
- **Storage Interface**: Abstracted storage operations (`server/storage.ts`)

**OAuth System**
- GoHighLevel OAuth 2.0 implementation
- Token storage and refresh management
- User session management with JWT
- Installation tracking for marketplace apps

**Session Recovery System**
- Embedded CRM tab session restoration across devices
- Cookie-independent authentication for iframe embedding
- Multi-method user identification (User ID, Location ID, Installation ID)
- Database-driven session recovery using existing OAuth installations
- Automatic detection and recovery for cleared cookies or browser restrictions
- Cross-device compatibility without re-authentication requirements

**Universal API System**
- Dynamic routing for all GoHighLevel API endpoints
- Configuration-driven endpoint management
- Automatic authentication injection
- Comprehensive error handling

### Frontend Architecture

**React Application**
- Vite-based build system
- TypeScript for type safety
- Tailwind CSS with shadcn/ui components
- React Query for API state management

**UI Components**
- Comprehensive component library using Radix UI primitives
- Consistent design system with CSS variables
- Responsive design patterns

### Key Features

**OAuth Integration**
- Complete marketplace OAuth flow
- Automatic token refresh
- Secure token storage
- User account linking

**Universal API Router**
- Single endpoint handles all GoHighLevel APIs
- Dynamic parameter extraction
- Automatic location ID injection
- Scope-based access control

**API Categories Supported**
- Products and pricing management
- Contact management
- Location operations
- Opportunities and pipeline management
- Workflows and automation
- Forms and surveys
- Media file management

## Data Flow

1. **OAuth Authentication**
   - User initiates OAuth through GoHighLevel marketplace
   - Application receives authorization code
   - Token exchange and user data capture
   - Installation record creation with access tokens

2. **Session Recovery for Embedded CRM Tab Access**
   - User clicks app tab within GoHighLevel CRM
   - System detects embedded access with user/location parameters
   - Database lookup finds existing OAuth installation
   - Automatic session restoration without re-authentication
   - Cross-device compatibility with cookie-independent authentication

3. **API Request Processing**
   - Frontend makes requests to `/api/ghl/*` endpoints
   - Middleware validates OAuth tokens
   - Universal router matches endpoint configuration
   - Parameters extracted and validated
   - Request forwarded to GoHighLevel with authentication
   - Response processed and returned to frontend

4. **Database Operations**
   - User data stored in PostgreSQL
   - OAuth installations tracked with tokens
   - Session recovery data maintained for cross-device access
   - Drizzle ORM provides type-safe database operations

## External Dependencies

**Core Framework Dependencies**
- Express.js for backend API server
- React for frontend user interface
- Vite for build tooling and development server

**Database & ORM**
- PostgreSQL (Neon serverless)
- Drizzle ORM for database operations
- Database migrations support

**Authentication & API**
- GoHighLevel OAuth 2.0 integration
- JWT for session management
- Axios for HTTP client operations

**UI & Styling**
- Tailwind CSS for styling
- Radix UI for accessible components
- shadcn/ui component library

**Development Tools**
- TypeScript for type safety
- ESBuild for production builds
- Testing framework for API validation

## Deployment Strategy

**Replit Deployment**
- Autoscale deployment target
- Multi-port configuration (3000, 5000, 8080)
- Automated build and start scripts
- Environment variable management

**Build Process**
- Frontend build with Vite
- Backend compilation with ESBuild
- Static asset optimization
- Production environment configuration

**Database**
- PostgreSQL module provisioned
- Connection pooling configured
- Migration support ready

## Recent Changes

- June 19, 2025: Directory Form Display Implementation - COMPLETED
  - Added DirectoryFormRenderer component to display wizard-generated forms
  - Updated DirectoryDetails page with "Show Directory Form" button in products view
  - Form renderer displays live preview of generated form based on directory configuration
  - Shows form configuration details (features enabled/disabled, button type, field name)
  - Displays integration code (CSS header code and JavaScript footer code)
  - Provides copy functionality for full form code
  - Maintains separation between collections and products views with appropriate buttons
  - Form generation uses dynamic-form-generator lib with proper field mapping

- June 19, 2025: Railway Backend Integration Analysis and Compatibility Update - COMPLETED
  - Analyzed actual Railway backend structure (version 1.4.0) running at dir.engageautomations.com
  - Railway backend is healthy with 1 installation but requires fresh OAuth flow for API access
  - Confirmed endpoints: /api/ghl/products, /api/ghl/media/upload, /api/ghl/contacts/create
  - Updated MediaUpload component to use install_seed installation pattern
  - Created RailwayIntegration class for proper backend communication
  - Installation ID discovery system for finding valid Railway installations
  - Railway backend uses automatic token refresh with ensureFreshToken() protection
  - OAuth callback redirects to listings.engageautomations.com with installation_id parameter
  - Frontend Integration Completed:
    • Created comprehensive MediaUpload component with drag-and-drop functionality
    • Enhanced GHLProductCreator with multi-image upload support
    • Added real-time upload progress tracking and error handling
    • Integrated Railway backend proxy route in server/routes.ts
    • Updated database schema to support image arrays with proper TypeScript types
    • Added visual image gallery preview with uploaded media tracking
    • Full Railway backend v1.4.0 compatibility for direct GoHighLevel Media Library access

- June 15, 2025: Enhanced OAuth Dual-Domain Architecture Deployed to Railway
  - Deployed complete enhanced OAuth system to Railway production backend
  - Authorization Code with PKCE flow now handling real marketplace installations
  - Universal API Router active supporting 50+ GoHighLevel endpoints via /api/ghl/*
  - Session recovery system deployed for embedded CRM tab access
  - Automatic token management with refresh capabilities in production
  - Professional OAuth success page with error handling deployed
  - Cross-device compatibility with cookie-independent authentication live
  - Health check endpoint (/health) configured for Railway monitoring
  - Production-ready system now handling real GoHighLevel marketplace installations

- June 14, 2025: Data Saving Fix Implementation Completed
  - Resolved critical 404 errors preventing directories, collections, and listings from saving
  - Implemented SimpleStorage solution with working CRUD operations for all core entities
  - Created dedicated working routes (server/working-routes.ts) with proper error handling and logging
  - Fixed authentication and type mismatch conflicts between storage implementations
  - All data now persists properly: directories save with listing statistics, collections create with user association, listings save with slug validation
  - UI-to-API mapping now functional for core operations while maintaining sophisticated OAuth integration
  - Two-domain architecture (custom + Replit) confirmed working with Railway OAuth backend

- June 14, 2025: Custom Domain Production Deployment Completed
  - Fixed Internal Server Error on custom domain with proper production configuration
  - Implemented fallback static interface with professional marketplace design
  - Added health check endpoint for deployment monitoring
  - Configured proper static file serving for production environments
  - Custom domain listings.engageautomations.com now displays functional marketplace interface
  - Production deployment ready with OAuth integration and API management access

- June 14, 2025: Real OAuth Credentials Successfully Captured
  - Updated Railway backend with installation detail endpoints
  - Successfully completed OAuth flow with authentic GoHighLevel account
  - Captured real access token (valid until June 15, 2025) and refresh token (valid until 2026)
  - Location ID: WAVk87RmW9rBSDJHeOpH confirmed and accessible
  - Scopes include: products, media, locations, contacts (read/write permissions)
  - Credentials stored locally in .env.real for development testing
  - Ready to test directory logo upload API with authentic account data

- June 14, 2025: OAuth Real Data Capture System Fixed
  - Fixed OAuth callback to properly capture real GoHighLevel account data during app installations
  - Implemented direct SQL database storage to avoid schema field mapping conflicts
  - Added comprehensive logging to track OAuth flow and authentic data capture
  - Removed dependency on demo/placeholder data for testing API functionality
  - Directory logo upload API ready to work with real access tokens and location data
  - OAuth callback system now stores: access tokens, refresh tokens, user info, location data, token expiry

- June 13, 2025: Complete Custom Domain Configuration
  - Updated Railway backend redirect URI to listings.engageautomations.com
  - Configured CORS origins for custom domain access
  - Updated all OAuth flow URLs to use professional domain
  - Verified authentication error handling and installation-required redirects
  - Ready for GoHighLevel marketplace deployment with custom domain

- June 13, 2025: Embedded CRM Tab Session Recovery System Implementation
  - Comprehensive session recovery for GoHighLevel CRM tab access
  - Multi-method user identification: GoHighLevel User ID, Location ID, Installation ID
  - Cross-device session restoration without re-authentication
  - Cookie-independent authentication supporting iframe embedding
  - Automatic detection and recovery for cleared cookies or different devices
  - Database-driven session recovery using existing OAuth installations
  - Iframe-compatible cookie settings with sameSite: 'none' for embedded access
  - Session recovery endpoints: /api/auth/recover and /api/auth/check-embedded

- June 13, 2025: Marketplace Installation Flow Optimization
  - Removed OAuth connection screen requirement for marketplace installations
  - Updated root route to handle marketplace OAuth callbacks automatically
  - Configured direct redirect to API management interface after successful OAuth
  - Streamlined user experience: install from marketplace → immediate access to APIs
  - Maintained development OAuth screen at /oauth-app for testing purposes

- June 13, 2025: Complete Media Library API Suite Integration
  - Added Get List of Files API with advanced filtering, sorting, and multi-tenant support
  - Integrated Upload File API with multipart/form-data handling for binary and hosted uploads
  - Updated endpoint configurations to match exact GoHighLevel specifications
  - Demonstrated sophisticated parameter management across diverse endpoint patterns
  - Achieved 50+ GoHighLevel operations support through configuration-driven architecture

- June 13, 2025: Universal API System Enhancement
  - Advanced query parameter handling for complex filtering scenarios
  - Multipart upload support with dual upload modes (direct file and remote URL)
  - Pattern flexibility supporting both global and location-specific endpoints
  - Content type intelligence for JSON, form data, and query parameters
  - Zero-maintenance scalability with configuration-only endpoint additions

## Changelog

- June 13, 2025. Initial setup and universal API system development

## Session Recovery Benefits

**Business Value**
- Eliminates user frustration from lost sessions in embedded CRM tabs
- Reduces support tickets related to authentication issues
- Provides seamless experience across multiple devices and browsers
- Maintains professional appearance with automatic session restoration

**Technical Benefits**
- Cookie-independent authentication works in restrictive iframe environments
- Database-driven recovery using existing OAuth installations
- Multi-method identification ensures maximum compatibility
- Automatic detection requires no user intervention

**User Experience**
- One-click access from any GoHighLevel CRM tab
- No re-authentication required when switching devices
- Seamless operation despite cleared cookies or browser restrictions
- Professional embedded app experience matching enterprise expectations

## User Preferences

Preferred communication style: Simple, everyday language.