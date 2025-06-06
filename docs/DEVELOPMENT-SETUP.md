# Development Setup & Configuration

## Prerequisites

### Required Software
- **Node.js** v20.18.1 or higher
- **PostgreSQL** 14+ database
- **Git** for version control
- **Modern Browser** with developer tools

### Environment Variables
Create `.env` file in project root:
```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/directory_app

# PostgreSQL Connection Details
PGHOST=localhost
PGPORT=5432
PGUSER=your_username
PGPASSWORD=your_password
PGDATABASE=directory_app

# OpenAI Integration (Optional)
OPENAI_API_KEY=sk-your-openai-api-key

# Google Drive Integration (Future)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# GoHighLevel Integration (Future)
GHL_CLIENT_ID=your_ghl_client_id
GHL_CLIENT_SECRET=your_ghl_client_secret
GHL_REDIRECT_URI=http://localhost:5000/auth/ghl/callback
```

## Installation Steps

### 1. Clone and Install Dependencies
```bash
git clone <repository-url>
cd directory-app
npm install
```

### 2. Database Setup
```bash
# Create PostgreSQL database
createdb directory_app

# Push schema to database
npm run db:push

# Verify tables created
npm run db:studio
```

### 3. Development Server
```bash
# Start development server (frontend + backend)
npm run dev

# Server runs on http://localhost:5000
# Frontend accessible at same URL with Vite proxy
```

## Project Structure Deep Dive

### Client Directory (`/client/src/`)
```
client/src/
├── components/
│   ├── ui/              # shadcn/ui components
│   ├── layout/          # Layout components (AppLayout, etc.)
│   └── forms/           # Form components
├── pages/               # Route components
│   ├── Directories.tsx  # Directory list page
│   ├── DirectoryDetails.tsx
│   ├── Collections.tsx
│   └── CollectionView.tsx
├── lib/                 # Utilities
│   ├── queryClient.ts   # TanStack Query setup
│   └── utils.ts         # General utilities
└── hooks/               # Custom React hooks
    └── use-toast.ts
```

### Server Directory (`/server/`)
```
server/
├── db.ts               # Database connection & Drizzle setup
├── storage.ts          # Data access layer (MemStorage/DatabaseStorage)
├── routes.ts           # Express route definitions
├── index.ts            # Server entry point
├── ai-summarizer.ts    # OpenAI integration
├── form-submission-handler.ts
├── google-drive.ts     # Google Drive integration
└── dev-tools.ts        # Development utilities
```

### Shared Directory (`/shared/`)
```
shared/
└── schema.ts           # Drizzle database schema definitions
```

## Database Development

### Schema Management
```bash
# Generate migration after schema changes
npm run db:generate

# Apply migrations to database
npm run db:push

# Open Drizzle Studio for database inspection
npm run db:studio
```

### Schema File Structure
The `shared/schema.ts` file contains all table definitions:
- **Users table** - Authentication and user management
- **Directories table** - Directory/marketplace definitions
- **Listings table** - Product/listing data
- **Collections table** - Product groupings
- **Collection Items table** - Many-to-many relationships
- **Additional tables** - Features, domains, credentials

### Adding New Tables
```typescript
// In shared/schema.ts
export const newTable = pgTable("new_table", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Create insert schema
export const insertNewTableSchema = createInsertSchema(newTable).omit({
  id: true,
  createdAt: true,
});

// Export types
export type InsertNewTable = z.infer<typeof insertNewTableSchema>;
export type NewTable = typeof newTable.$inferSelect;
```

## API Development

### Adding New Endpoints
```typescript
// In server/routes.ts
app.get("/api/new-endpoint", async (req, res) => {
  try {
    const data = await storage.getNewData();
    res.json(data);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Failed to fetch data" });
  }
});
```

### Data Access Layer
```typescript
// In server/storage.ts - Add new methods
async getNewData(): Promise<NewTable[]> {
  return Array.from(this.newTable.values());
}

async createNewData(data: InsertNewTable): Promise<NewTable> {
  const newRecord: NewTable = {
    id: this.getNextId('newTable'),
    ...data,
    createdAt: new Date()
  };
  this.newTable.set(newRecord.id, newRecord);
  return newRecord;
}
```

## Frontend Development

### Adding New Pages
```typescript
// Create new page component
// client/src/pages/NewPage.tsx
export default function NewPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['/api/new-endpoint'],
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <h1>New Page</h1>
      {/* Page content */}
    </div>
  );
}

// Register route in App.tsx
<Route path="/new-page" component={NewPage} />
```

### State Management Patterns
```typescript
// Query for fetching data
const { data: items, isLoading } = useQuery<Item[]>({
  queryKey: ['/api/items'],
  enabled: !!someCondition,
});

// Mutation for creating/updating data
const createMutation = useMutation({
  mutationFn: async (newItem: InsertItem) => {
    return apiRequest('/api/items', {
      method: 'POST',
      data: newItem
    });
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['/api/items'] });
    toast({ title: "Success", description: "Item created" });
  },
  onError: () => {
    toast({ title: "Error", description: "Failed to create item", variant: "destructive" });
  }
});
```

## Testing & Quality Assurance

### Browser Testing
- **Chrome/Edge** - Primary development browsers
- **Firefox** - Cross-browser compatibility
- **Safari** - macOS/iOS compatibility
- **Mobile browsers** - Responsive design testing

### Database Testing
```bash
# Test database connections
npm run test:db

# Verify schema integrity
npm run db:check

# Reset development database
npm run db:reset
```

### API Testing
```bash
# Test API endpoints with curl
curl -X GET http://localhost:5000/api/directories
curl -X POST http://localhost:5000/api/directories \
  -H "Content-Type: application/json" \
  -d '{"directoryName": "Test Directory"}'
```

## Performance Optimization

### Database Performance
- **Indexing strategy** implemented for frequent queries
- **Query optimization** using Drizzle's type-safe queries
- **Connection pooling** configured for production scaling

### Frontend Performance
- **Code splitting** with Vite's automatic optimizations
- **Query caching** with TanStack Query smart invalidation
- **Image optimization** with lazy loading and compression
- **Bundle analysis** using Vite's built-in tools

### Server Performance
- **Express middleware** optimized for production
- **Static file serving** with proper caching headers
- **API response compression** enabled
- **Request logging** for performance monitoring

## Deployment Preparation

### Production Environment Variables
```env
NODE_ENV=production
DATABASE_URL=postgresql://prod_user:prod_pass@prod_host:5432/prod_db
PORT=5000

# External API keys for production
OPENAI_API_KEY=prod_openai_key
GHL_CLIENT_ID=prod_ghl_client_id
GHL_CLIENT_SECRET=prod_ghl_client_secret
```

### Build Process
```bash
# Production build
npm run build

# Start production server
npm start
```

### Health Checks
```bash
# Verify server health
curl http://localhost:5000/health

# Check database connectivity
curl http://localhost:5000/api/health/database
```

## Troubleshooting Guide

### Common Development Issues

**Database Connection Errors:**
- Verify PostgreSQL service is running
- Check DATABASE_URL format and credentials
- Ensure database exists and is accessible

**Port Conflicts:**
- Server default port is 5000
- Check if port is in use: `lsof -i :5000`
- Kill conflicting process or change port

**Build Errors:**
- Clear node_modules and reinstall
- Check TypeScript errors in IDE
- Verify all environment variables are set

**Query Cache Issues:**
- Use React Query DevTools for debugging
- Manual cache invalidation: `queryClient.clear()`
- Check query key consistency

### Performance Issues
- **Slow API responses** - Check database query optimization
- **UI lag** - Profile with React DevTools
- **Memory leaks** - Monitor with browser dev tools
- **Bundle size** - Analyze with `npm run analyze`

This setup provides a comprehensive development environment supporting rapid iteration while maintaining production-ready architecture patterns.