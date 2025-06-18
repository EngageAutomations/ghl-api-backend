# GoHighLevel Directory Integration Platform

## Overview

This is a comprehensive GoHighLevel OAuth integration platform designed to enable seamless API access and management for the GoHighLevel marketplace. The system features a full-stack TypeScript application with React frontend, Express backend, and PostgreSQL database, focused on OAuth authentication, API endpoint management, and directory integration functionality.

## System Architecture

### Frontend Architecture
- **React 18** with TypeScript for type safety
- **Vite** as the build tool and development server
- **TailwindCSS** with shadcn/ui components for modern UI design
- **TanStack Query** for efficient API state management and caching
- Component-based architecture with reusable UI elements

### Backend Architecture
- **Express.js** server with TypeScript support
- **RESTful API** design with comprehensive GoHighLevel endpoint mapping
- **Universal API routing** system that dynamically handles multiple GHL endpoints
- **OAuth 2.0** implementation for GoHighLevel marketplace integration
- **JWT token management** with refresh token support

### Data Storage Solutions
- **PostgreSQL** as the primary database
- **Drizzle ORM** for type-safe database operations and migrations
- **Neon Database** integration for serverless PostgreSQL hosting
- In-memory storage fallback for OAuth installations during development

## Key Components

### OAuth Integration System
- Complete OAuth 2.0 flow implementation for GoHighLevel marketplace
- Token exchange and refresh mechanism
- User info retrieval and location ID capture
- Installation data persistence with comprehensive user metadata
- Scope management for API permissions

### Universal API Router
- Dynamic endpoint mapping for all GoHighLevel API endpoints
- Automatic request routing and response handling
- Support for Products, Contacts, Media, Locations, and Workflows APIs
- Built-in error handling and response standardization
- Location-based API context management

### Database Schema
- User management with OAuth integration
- Installation tracking with comprehensive metadata
- Token storage with expiry management
- Audit trail for API usage and authentication events

## Data Flow

1. **OAuth Authentication**: Users authenticate via GoHighLevel marketplace OAuth flow
2. **Token Management**: System captures and stores access/refresh tokens
3. **API Proxying**: Frontend requests are routed through universal API system
4. **Database Operations**: All user data and installations are persisted to PostgreSQL
5. **Response Handling**: Standardized API responses with error handling

## External Dependencies

### Core Dependencies
- **GoHighLevel API**: Primary integration target with full endpoint support
- **Railway**: Production deployment platform for OAuth backend
- **Neon Database**: Serverless PostgreSQL hosting
- **Replit**: Development and testing environment

### Authentication Services
- **GoHighLevel OAuth 2.0**: Marketplace authentication system
- Client ID: `68474924a586bce22a6e64f7-mbpkmyu4`
- Redirect URI: `https://dir.engageautomations.com/api/oauth/callback`

### API Integrations
- **GoHighLevel API v2021-07-28**: Complete endpoint coverage
- Products, Prices, Contacts, Media, Locations, Workflows APIs
- Real-time token validation and refresh

## Deployment Strategy

### Development Environment
- **Replit**: Primary development platform with auto-deployment
- **Vite Dev Server**: Frontend development with HMR
- **TSX**: TypeScript execution for backend development
- Port configuration: Frontend (5000), Backend (3000), Database (PostgreSQL)

### Production Environment
- **Railway**: Production backend deployment
- **Autoscale**: Automatic scaling based on traffic
- **Environment Variables**: Secure credential management
- **Health Checks**: Automated monitoring and restart policies

### Build Process
- **Frontend**: Vite build with optimized assets
- **Backend**: ESBuild compilation to ESM format
- **Database**: Drizzle migrations for schema management

## Changelog

- June 18, 2025: RESOLVED Replit preview system by running server on port 5000 with proper network binding (0.0.0.0:5000) to match workflow expectations
- June 18, 2025: Fixed missing npm dev script issue by creating main.cjs server that bypasses package.json script requirements
- June 18, 2025: Server now responding correctly on expected port with full GoHighLevel Marketplace interface active
- June 18, 2025: RESOLVED Replit preview system by completely rebuilding server with CommonJS modules to bypass workflow configuration parsing errors and ES module conflicts
- June 18, 2025: Created index.cjs with complete GoHighLevel Marketplace interface including OAuth integration, API routing, and interactive testing features
- June 18, 2025: Fixed "Failed to parse workflow configs from .replit" issue by implementing server independent of broken workflow configuration
- June 18, 2025: Fixed Replit preview system by implementing minimal server configuration with proper PORT environment variable detection and streamlined Vite middleware setup
- June 18, 2025: Resolved server hanging issues by removing complex OAuth routing and focusing on core React application serving
- June 17, 2025: Resolved TypeScript compilation errors and server startup issues by simplifying storage interface implementation and creating working simple-server.js configuration
- June 17, 2025: Successfully established working development environment with server running on port 5000, Vite frontend active, and GoHighLevel OAuth integration operational
- June 17, 2025: Organized server structure by moving legacy files to server/legacy/ folder for better code organization
- June 17, 2025: Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.