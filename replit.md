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

2. **API Request Processing**
   - Frontend makes requests to `/api/ghl/*` endpoints
   - Middleware validates OAuth tokens
   - Universal router matches endpoint configuration
   - Parameters extracted and validated
   - Request forwarded to GoHighLevel with authentication
   - Response processed and returned to frontend

3. **Database Operations**
   - User data stored in PostgreSQL
   - OAuth installations tracked with tokens
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

## User Preferences

Preferred communication style: Simple, everyday language.