# GoHighLevel OAuth Proxy Backend

## Overview

This is a streamlined Node.js Express backend that proxies GoHighLevel APIs with automatic OAuth token refresh. The system provides a lightweight interface for frontend applications to interact with GoHighLevel services without handling complex authentication flows. All OAuth tokens are managed automatically with proactive refresh scheduling.

## System Architecture

### Core Backend (index.js)
- **Single File Architecture**: Streamlined Express.js server in one file
- **OAuth Management**: Automatic token refresh with proactive scheduling
- **In-Memory Storage**: Installation data stored in memory with Map structures
- **Token Lifecycle**: Refresh tokens 5 minutes before expiry automatically
- **API Proxy**: Routes all GoHighLevel API calls with fresh authentication

### Frontend Integration
- **React Frontend**: Existing React application with Vite build system
- **API Communication**: Frontend calls local backend endpoints
- **Authentication Flow**: OAuth handled entirely by backend
- **Error Handling**: Graceful fallbacks when GoHighLevel integration fails

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

### API Data Flow
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
- **GoHighLevel API**: OAuth authentication and data synchronization
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

## Changelog

- June 18, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.