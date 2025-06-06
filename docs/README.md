# GoHighLevel Directory & Collections Management System

## System Overview

This application provides a comprehensive directory and collections management system designed for GoHighLevel marketplace integration. The system allows users to create directories, manage product listings, organize products into collections, and maintain seamless navigation between all components within a unified dashboard interface.

## Architecture Overview

### Frontend Architecture
- **React TypeScript** with Vite for fast development
- **Wouter** for client-side routing
- **TanStack Query** for server state management and caching
- **Tailwind CSS + shadcn/ui** for responsive design components
- **Framer Motion** for micro-animations and enhanced UX

### Backend Architecture
- **Express.js** Node.js server
- **PostgreSQL** database with Drizzle ORM
- **RESTful API** design with comprehensive CRUD operations
- **Session-based authentication** (expandable for OAuth)

### Database Architecture
- **Many-to-many relationships** between collections and products
- **Directory-based organization** for logical grouping
- **Flexible schema** supporting GoHighLevel API integration fields

## Project Structure

```
├── client/src/
│   ├── components/ui/          # Reusable UI components
│   ├── pages/                  # Main application pages
│   ├── lib/                    # Utilities and configurations
│   └── hooks/                  # Custom React hooks
├── server/
│   ├── db.ts                   # Database connection
│   ├── storage.ts              # Data access layer
│   ├── routes.ts               # API route definitions
│   └── index.ts                # Server entry point
├── shared/
│   └── schema.ts               # Database schema definitions
└── docs/                       # Documentation
```

## Key Features

### 1. Unified Dashboard Navigation
- Single-page application with seamless tab switching
- Context-aware navigation maintaining directory relationships
- Real-time data synchronization across all components

### 2. Directory Management
- Create and manage product directories
- Directory-specific configuration and branding
- Hierarchical organization of products and collections

### 3. Product (Listings) Management
- Comprehensive product CRUD operations
- Rich media support with image uploads
- SEO optimization fields
- Flexible pricing and categorization

### 4. Collections System
- Many-to-many relationship allowing products in multiple collections
- Collection-specific branding and SEO
- Batch product addition with duplicate prevention
- GoHighLevel API synchronization ready

### 5. Scalable Integration Architecture
- Designed for GoHighLevel API integration
- Sync status tracking for external systems
- Error handling and retry mechanisms
- Extensible for additional marketplace integrations

## User Interface Flow

### Primary Navigation Flow
1. **Directory List** → View all directories
2. **Directory Details** → Products tab shows all directory products
3. **Directory Details** → Collections tab shows directory-specific collections
4. **Collection View** → Detailed collection management with product addition
5. **Return Navigation** → Maintains context back to directory collections tab

### Key UI Components
- **Directory Cards** with metrics and quick actions
- **Product Grid/List Views** with filtering and search
- **Collection Management Interface** with batch operations
- **Modal-based Product Addition** to collections
- **Responsive Design** supporting desktop, tablet, and mobile

## Next Steps for GoHighLevel Integration

The system is architected to seamlessly integrate with GoHighLevel APIs:

1. **Sync Status Fields** - Already implemented for tracking sync state
2. **External ID Fields** - Ready for GoHighLevel entity mapping
3. **Error Handling** - Built-in sync error tracking and reporting
4. **Batch Operations** - Designed for efficient API synchronization
5. **Webhook Support** - Architecture ready for real-time sync updates

This documentation provides the foundation for scaling the system with additional marketplace integrations and advanced features.