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

- June 17, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.