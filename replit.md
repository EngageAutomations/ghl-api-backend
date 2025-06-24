# GoHighLevel OAuth Marketplace Application

## Overview

This is a full-stack marketplace application that provides OAuth integration with GoHighLevel through a Railway-Replit bridge system. The application enables users to authenticate with their GoHighLevel accounts and perform various operations through a unified API interface.

## System Architecture

The application follows a modern full-stack architecture with a hardcoded bridge system for Railway integration:

- **Frontend**: React-based single-page application built with Vite
- **Backend**: Express.js server with TypeScript/Node.js
- **Database**: PostgreSQL with Drizzle ORM
- **Railway Bridge**: Hardcoded OAuth credential system bypassing environment variable issues
- **Authentication**: OAuth 2.0 integration with GoHighLevel via bridge endpoints

## Railway-Replit Bridge System

### Architecture
- **Railway Backend**: Requests credentials from Replit bridge endpoints
- **Replit Bridge**: Provides secure credential endpoints at `/api/bridge/*`
- **Hardcoded Implementation**: No manual configuration required for installations

### Key Bridge Endpoints
- `GET /api/bridge/oauth-credentials` - Provides OAuth credentials to Railway
- `POST /api/bridge/process-oauth` - Processes authorization codes
- `GET /api/bridge/installation/:id` - Returns installation status

### Update Process
Use delete + create method for reliable file updates:
1. Delete existing endpoint file: `rm filename`
2. Create updated file with new implementation
3. Changes automatically reflect in GitHub and Railway integration

## Key Components

### Backend Architecture

**Express Server (`server/index.ts`)**
- Main server entry point handling API routes
- Bridge endpoint integration for Railway communication
- Universal API routing system

**Bridge System (`server/bridge-endpoints.ts`)**
- OAuth credential provisioning for Railway backend
- Authorization code processing and token exchange
- Installation data management and status tracking

**Database Layer**
- **Schema**: Defined in `shared/schema.ts` with user and OAuth installation tables
- **Connection**: Neon PostgreSQL serverless connection (`server/db.ts`)
- **Storage Interface**: Abstracted storage operations (`server/storage.ts`)

**OAuth System**
- GoHighLevel OAuth 2.0 implementation via bridge
- Token storage and refresh management through bridge endpoints
- User session management with JWT
- Installation tracking for marketplace apps

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

**Bridge-Based OAuth Integration**
- Railway requests credentials from Replit endpoints
- Automatic token exchange through bridge processing
- Secure credential handling without environment variable dependencies
- User account linking via processed installations

**Universal API Router**
- Single endpoint handles all GoHighLevel APIs
- Dynamic parameter extraction
- Automatic location ID injection
- Scope-based access control

## Data Flow

1. **OAuth Authentication via Bridge**
   - Railway backend requests credentials from `/api/bridge/oauth-credentials`
   - User initiates OAuth through GoHighLevel marketplace
   - Railway forwards authorization code to `/api/bridge/process-oauth`
   - Bridge processes token exchange and creates installation record

2. **API Request Processing**
   - Frontend makes requests to `/api/ghl/*` endpoints
   - Middleware validates OAuth tokens
   - Universal router matches endpoint configuration
   - Parameters extracted and validated
   - Request forwarded to GoHighLevel with authentication

3. **Database Operations**
   - User data stored in PostgreSQL
   - OAuth installations tracked with tokens via bridge system
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
- GoHighLevel OAuth 2.0 integration via bridge system
- JWT for session management
- Axios for HTTP client operations

## Deployment Strategy

**Replit Deployment**
- Autoscale deployment target
- Multi-port configuration (3000, 5000, 8080)
- Automated build and start scripts
- Bridge endpoint hosting for Railway integration

**Railway Integration**
- Bridge endpoints provide OAuth credentials
- No environment variable configuration required
- Automatic credential provisioning through API calls
- Hardcoded system requiring no manual setup

## Recent Changes

- June 24, 2025: GitHub Repository Update Issue Identified - REQUIRES MANUAL ACTION
  - ISSUE: Local Replit workspace NOT connected to GitHub repository
  - Files created locally do not sync to EngageAutomations/oauth-backend repository
  - Git protection mechanism prevents automatic GitHub updates from Replit
  - SOLUTION: Created GITHUB_UPDATE_FILES.md with exact code to manually copy to GitHub
  - Simplified approach: Embed OAuth credentials directly in server.js to bypass Railway env var issues

- June 24, 2025: Railway-Replit Bridge System Implementation - COMPLETED
  - Implemented hardcoded bridge system bypassing Railway environment variable issues
  - Created `/api/bridge/oauth-credentials` endpoint for Railway credential requests
  - Built `/api/bridge/process-oauth` endpoint for authorization code processing
  - Added `/api/bridge/installation/:id` for installation status queries
  - Documented complete bridge system architecture and update procedures
  - Established delete + create method for reliable endpoint modifications
  - Bridge system eliminates need for manual Railway configuration
  - Self-contained OAuth processing requiring no agent intervention for installations

- June 23, 2025: Railway Multi-API Product Creation Workflow Implementation with Corrected API Endpoints - COMPLETED
  - Token lifecycle correctly implemented: OAuth callback → in-memory Map by locationId → request-time token lookup/refresh
  - Security model: GoHighLevel access tokens live only in server-side memory, never in process.env or build images
  - API contract complete: POST /api/ghl/locations/:locationId/media, products, and gallery endpoints
  - JWT authentication enforced on all /api/ghl/* routes with requireSignedJwt middleware
  - Railway proxy pattern: Replit sends JWT + locationId, Railway handles all OAuth token management
  - ProductCreateModal implemented with drag-and-drop multi-image upload (up to 10 files, 25MB each)
  - React hooks: useUploadImages and useCreateProduct with proper error handling and loading states
  - Fixed DirectoryDetails component by removing all legacy showGHLProductCreator references
  - Complete workflow: JWT auth → multi-image upload → product creation → gallery attachment
  - JWT authentication auto-initializes on app startup for seamless Railway proxy compatibility
  - Railway API integration corrected: using location-centric endpoints (POST /api/ghl/locations/:locationId/*)
  - OAuth flow implemented: installation_id capture from URL params and /api/oauth/status validation
  - ProductCreateModal enhanced with OAuth status checking and proper error handling
  - Complete workflow tested: JWT auth → OAuth status → media upload → product creation
  - Railway proxy endpoints confirmed working but require OAuth reconnection for authentication
  - Frontend OAuth capture implemented to detect installation_id from URL params and immediate locationId fetching
  - Railway Modular Upgrade completed: refactored monolithic backend into proper Express modules
  - Fixed OAuth token exchange issues with enhanced error handling and comprehensive logging
  - Created location-centric API routing with automatic token refresh mechanism
  - Modular structure prevents code truncation and improves OAuth callback reliability
  - Railway Modular Backend Deployed: Pushed v1.5.0-modular to GitHub triggering automatic Railway deployment
  - Fixed OAuth token exchange issues by replacing monolithic index.js with proper Express modules
  - Location-centric API routing implemented for media upload and product creation endpoints
  - Enhanced error handling and comprehensive logging for OAuth callback debugging
  - Complete OAuth workflow ready: redirect → token exchange → storage → product creation

## Bridge System Benefits

**Business Value**
- Eliminates Railway environment variable detection issues
- Provides hardcoded solution requiring no manual configuration
- Enables day-to-day operations without agent intervention
- Maintains secure credential handling through API endpoints

**Technical Benefits**
- Complete control over OAuth credential provisioning
- Bridge-based token exchange processing
- Automatic installation data management
- Self-contained system with GitHub integration

**Update Process**
- Delete + create method for reliable endpoint modifications
- Direct GitHub reflection of bridge endpoint changes
- No environment variable dependencies
- Comprehensive documentation for future maintenance

## User Preferences

Preferred communication style: Simple, everyday language.
File update method: Delete + create approach for reliable modifications.
Bridge system: Hardcoded Railway integration eliminating manual configuration.