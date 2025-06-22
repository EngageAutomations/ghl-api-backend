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

- June 22, 2025: Rich Text Editor Implementation - COMPLETED
  - Fixed critical export/import mismatch error in RichTextEditor component
  - Changed from default export to named export pattern for proper module loading
  - Updated import statements across CreateListingForm, ConfigWizardSlideshow, and DirectoryFormRenderer
  - DirectoryFormRenderer now correctly renders rich text editor for expanded_description field type
  - Form fields match wizard configuration exactly with comprehensive rich text support
  - Rich text editor displays with formatting toolbar (headers, bold, italic, lists, links, images, alignment)
  - DirectoryDetails.tsx "Create GHL Product" button now shows rich text editor instead of regular textarea
  - Detailed description field repositioned to appear directly after product description in both form and preview
  - Price field moved to appear under product title for better user flow
  - Product creation form field labels updated: "Product/Service Name" changed to "Title"
  - Eliminated React module import errors and resolved component loading issues

- June 22, 2025: User-Defined Metadata Bar Implementation - COMPLETED
  - Implemented user-defined metadata bar fields with icon upload + text pairs instead of hardcoded fields
  - Added clickable button icon upload functionality with compact 48x48px square design
  - Created font dropdown selection with 10 popular font options for text styling
  - Enhanced form layout with icon button + text field pairs matching wizard screenshot exactly
  - Metadata fields display as clickable upload buttons next to text input fields
  - Added proper validation, error handling, and accessibility features (hover/focus states)
  - Form generation creates up to 8 icon + text pairs that render as rows with icons over text on webpage
  - Perfect visual match to wizard design with clean, professional button interface
  - Updated Maps field label to "Map Embed Address (Google)" for clarity
  - Form starts with 1 metadata row, users can add up to 8 total with "Add Additional Field" button
  - All metadata text fields consistently show "Enter display text" placeholder
  - Font dropdown positioned under metadata title, above first row, with field label removed for clean design
  - Font options display in their respective typefaces for visual preview and better user experience
  - Product image field converted to multi-image upload with immediate preview and gallery display, matching metadata icon behavior

- June 22, 2025: Streamlined Wizard Configuration System - COMPLETED
  - Implemented efficient approach: save wizard config as JSON and reuse generateFormFields() function
  - Eliminated complex form duplication by using same logic from wizard in DirectoryFormRenderer
  - Wizard configuration stored as JSON to feed directly into existing generateFormFields() function
  - Products now properly associated with source directories via wizardConfigurationId
  - Simplified architecture: wizard saves config → DirectoryFormRenderer loads config → reuses same form generation
  - Fixed React hooks error and implemented proper storage methods for MockStorage and DatabaseStorage

- June 21, 2025: Complete Wizard Template System Implementation with Exact Form Matching - COMPLETED
  - Fixed "generateCodeOutput is not defined" error in ConfigWizardSlideshow by correcting function reference
  - Enhanced DirectoryFormRenderer to load comprehensive wizard templates with 8 detailed form fields
  - Implemented wizard template API returning complete configurations (name, description, image, price, expanded_description, address, seo_title, seo_description)
  - Added fallback comprehensive form fields ensuring DirectoryFormRenderer displays full wizard layout
  - Fixed template loading and form initialization for exact wizard-to-directory form matching
  - DirectoryFormRenderer now displays complete wizard-generated forms instead of basic buttons
  - Enhanced useWizardFormTemplate hook with direct fetch API calls and comprehensive logging
  - Wizard templates include all fields configured in wizard preview for consistent user experience

- June 21, 2025: Wizard Form Template System - Exact Form Matching Implementation - COMPLETED
  - Implemented wizard form template system to ensure exact matching between wizard-generated forms and directory product creation forms
  - DirectoryFormRenderer now loads wizard templates and renders identical form layouts using dynamic form generation
  - Enhanced wizard completion process to save comprehensive form templates with all configuration details
  - Form fields, validation rules, and layout match exactly what users see in wizard preview
  - Added template persistence with fallback to default configurations for existing directories
  - Wizard templates include: form fields, integration settings, styling, validation rules, and feature toggles
  - DirectoryFormRenderer dynamically generates forms based on wizard configuration (showPrice, showMaps, showDescription, etc.)
  - Enhanced API routes with proper error handling and default template generation
  - Form validation now matches wizard-specified required fields and field types
  - Single-column layout consistency maintained between wizard preview and actual product creation forms

- June 21, 2025: Complete Location Enhancement System with Error Handling & Validation - COMPLETED
  - Implemented comprehensive error handling and validation for location enhancement system
  - Added location ID validation with regex patterns (/^[A-Za-z0-9]{20,24}$/) and real-time feedback
  - Built location search autocomplete with GoHighLevel location lookup
  - Created conflict resolution modal with merge/override options for concurrent edits
  - Implemented bulk enhancement operations for multiple locations simultaneously
  - Added React Error Boundary for application-wide error handling and recovery
  - Enhanced API routes with audit trails, version conflict detection, and security validation
  - Created comprehensive Cypress test suite for end-to-end validation
  - Added auto-save functionality with debouncing (3 seconds) for form changes
  - Implemented optimistic updates with rollback capabilities for better UX
  - Built location access permission testing with real-time validation indicators
  - Added comprehensive input sanitization and security hardening measures

- June 20, 2025: Complete Wizard Form Template System Implementation - COMPLETED
  - Implemented comprehensive wizard form template system with PostgreSQL database storage
  - Added wizardFormTemplates table to schema with complete type definitions and validation
  - Created useWizardFormTemplate hook for managing form template persistence across components
  - Enhanced DirectoryFormRenderer to load and display exact wizard-generated form layouts
  - Added backend API routes (/api/wizard-templates) for saving and retrieving wizard configurations
  - Implemented storage methods for both MemStorage and DatabaseStorage classes
  - Form templates now preserve: wizard configuration, form fields, integration settings, and styling
  - DirectoryFormRenderer displays identical single-column layout with drag-and-drop image upload
  - When users click "Create GHL Product" in directories, they see exact wizard-configured forms
  - Complete persistence ensures wizard settings are maintained across sessions and devices

- June 19, 2025: Wizard Form Integration and Icon Upload Enhancement - COMPLETED
  - Created DirectoryFormRenderer component with exact wizard single-column layout
  - Implemented prominent drag-and-drop image upload area matching wizard design
  - Replaced GHLProductCreator with wizard-proven form generation from /lib/dynamic-form-generator.ts
  - "Create GHL Product" button displays identical single-column forms as ConfigWizardSlideshow
  - Features: drag-and-drop image upload to GoHighLevel, AI bullet point generation, auto-generated SEO fields
  - Single-column layout with proper spacing, wizard-style card design, and Railway backend integration
  - Form validation requires product name, description, and uploaded image before submission
  - Enhanced metadata icon field in ConfigWizardSlideshow: replaced static emoji with centered upload icon
  - Users can now upload custom icons for metadata fields with clean upload interface and immediate preview

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