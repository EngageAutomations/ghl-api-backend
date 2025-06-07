import OpenAI from "openai";
import { storage } from "./storage";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface AIRequest {
  message: string;
  context?: any;
  requestType: 'troubleshooting' | 'code-modification' | 'user-analytics' | 'system-insights';
  userId?: number;
}

export interface AIResponse {
  message: string;
  data?: any;
  suggestedActions?: string[];
  codeChanges?: CodeChange[];
  analytics?: any;
}

export interface CodeChange {
  filePath: string;
  currentCode: string;
  proposedCode: string;
  description: string;
  riskLevel: 'low' | 'medium' | 'high';
  testRequired: boolean;
}

export class AIAgentService {
  private systemPrompt = `You are an AI agent for a GoHighLevel directory and collections management system. 

Key capabilities:
1. Troubleshoot system issues and errors
2. Analyze and modify code safely
3. Provide detailed user analytics and insights
4. Monitor system health and performance
5. Suggest optimizations and improvements

System Context:
- React TypeScript frontend with Wouter routing
- Express.js backend with PostgreSQL database
- Drizzle ORM for database operations
- TanStack Query for state management
- Many-to-many relationships between collections and products
- GoHighLevel integration ready architecture

Always provide specific, actionable solutions. When suggesting code changes, include file paths and safety considerations.`;

  async processQuery(request: AIRequest): Promise<AIResponse> {
    const systemContext = await this.gatherSystemContext(request.userId);
    const prompt = this.buildContextualPrompt(request, systemContext);

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: this.systemPrompt },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
      });

      const aiResponse = JSON.parse(response.choices[0].message.content || '{}');
      
      // Process special request types
      switch (request.requestType) {
        case 'user-analytics':
          aiResponse.analytics = await this.getUserAnalytics(request.userId);
          break;
        case 'system-insights':
          aiResponse.data = await this.getSystemInsights();
          break;
        case 'troubleshooting':
          aiResponse.data = await this.getTroubleshootingData();
          break;
      }

      return aiResponse;
    } catch (error) {
      console.error('AI Agent Error:', error);
      return {
        message: 'I encountered an error processing your request. Please try again.',
        data: { error: error.message }
      };
    }
  }

  private async gatherSystemContext(userId?: number) {
    try {
      const [
        allUsers,
        allDirectories,
        allListings,
        allCollections,
        systemHealth
      ] = await Promise.all([
        storage.getAllUsers(),
        storage.getAllDirectories(),
        storage.getAllListings(),
        storage.getAllCollections(),
        this.getSystemHealth()
      ]);

      return {
        userCount: allUsers.length,
        directoryCount: allDirectories.length,
        listingCount: allListings.length,
        collectionCount: allCollections.length,
        systemHealth,
        currentUser: userId ? await storage.getUser(userId) : null,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error gathering system context:', error);
      return { error: 'Failed to gather system context' };
    }
  }

  private buildContextualPrompt(request: AIRequest, context: any): string {
    return `
User Request: ${request.message}
Request Type: ${request.requestType}

System Context:
- Total Users: ${context.userCount}
- Total Directories: ${context.directoryCount}
- Total Products: ${context.listingCount}
- Total Collections: ${context.collectionCount}
- System Health: ${JSON.stringify(context.systemHealth)}

${request.userId ? `Current User Context: ${JSON.stringify(context.currentUser)}` : ''}

Please provide a comprehensive response in JSON format with the following structure:
{
  "message": "Your detailed response",
  "suggestedActions": ["action1", "action2"],
  "data": {}, // Any relevant data
  "codeChanges": [], // If code modifications are suggested
  "analytics": {} // If analytics are requested
}
`;
  }

  async getUserAnalytics(userId?: number) {
    try {
      if (userId) {
        const [user, directories, listings, collections] = await Promise.all([
          storage.getUser(userId),
          storage.getDirectoriesByUser(userId),
          storage.getListingsByUser(userId),
          storage.getCollectionsByUser(userId)
        ]);

        return {
          user,
          summary: {
            totalDirectories: directories.length,
            totalListings: listings.length,
            totalCollections: collections.length,
            lastActivity: new Date().toISOString()
          },
          directories: directories.map(dir => ({
            name: dir.directoryName,
            isActive: dir.isActive,
            createdAt: dir.createdAt
          })),
          recentListings: listings.slice(-5).map(listing => ({
            title: listing.title,
            directoryName: listing.directoryName,
            price: listing.price,
            isActive: listing.isActive
          })),
          activeCollections: collections.filter(c => c.isActive).length
        };
      } else {
        // System-wide analytics
        const [users, directories, listings, collections] = await Promise.all([
          storage.getAllUsers(),
          storage.getAllDirectories(),
          storage.getAllListings(),
          storage.getAllCollections()
        ]);

        return {
          overview: {
            totalUsers: users.length,
            totalDirectories: directories.length,
            totalListings: listings.length,
            totalCollections: collections.length
          },
          topDirectories: directories
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 5),
          recentActivity: {
            newListings: listings.filter(l => 
              new Date(l.createdAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
            ).length,
            newCollections: collections.filter(c => 
              new Date(c.createdAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
            ).length
          }
        };
      }
    } catch (error) {
      console.error('Error getting user analytics:', error);
      return { error: 'Failed to retrieve analytics' };
    }
  }

  async getSystemInsights() {
    try {
      const [directories, listings, collections, users] = await Promise.all([
        storage.getAllDirectories(),
        storage.getAllListings(),
        storage.getAllCollections(),
        storage.getAllUsers()
      ]);

      // Calculate insights
      const directoryMetrics = directories.reduce((acc, dir) => {
        acc[dir.directoryName] = (acc[dir.directoryName] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const listingsByDirectory = listings.reduce((acc, listing) => {
        acc[listing.directoryName] = (acc[listing.directoryName] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const collectionsByDirectory = collections.reduce((acc, collection) => {
        acc[collection.directoryName] = (acc[collection.directoryName] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        performanceMetrics: {
          averageListingsPerDirectory: Object.values(listingsByDirectory).reduce((a, b) => a + b, 0) / Object.keys(listingsByDirectory).length || 0,
          averageCollectionsPerDirectory: Object.values(collectionsByDirectory).reduce((a, b) => a + b, 0) / Object.keys(collectionsByDirectory).length || 0,
          activeDirectories: directories.filter(d => d.isActive).length,
          activeListings: listings.filter(l => l.isActive).length,
          activeCollections: collections.filter(c => c.isActive).length
        },
        topDirectories: Object.entries(listingsByDirectory)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
          .map(([name, count]) => ({ name, listingCount: count })),
        systemHealth: await this.getSystemHealth(),
        dataIntegrity: await this.checkDataIntegrity()
      };
    } catch (error) {
      console.error('Error getting system insights:', error);
      return { error: 'Failed to retrieve system insights' };
    }
  }

  private async getSystemHealth() {
    try {
      // Check database connectivity
      const dbHealth = await this.checkDatabaseHealth();
      
      // Check memory usage
      const memoryUsage = process.memoryUsage();
      
      return {
        database: dbHealth,
        memory: {
          used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
          total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
          external: Math.round(memoryUsage.external / 1024 / 1024)
        },
        uptime: process.uptime(),
        nodeVersion: process.version,
        status: 'healthy'
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message
      };
    }
  }

  private async checkDatabaseHealth() {
    try {
      const users = await storage.getAllUsers();
      return {
        status: 'connected',
        userCount: users.length,
        lastCheck: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message
      };
    }
  }

  private async getTroubleshootingData() {
    try {
      // Check for common issues
      const issues = [];
      
      // Check for inactive directories
      const directories = await storage.getAllDirectories();
      const inactiveDirectories = directories.filter(d => !d.isActive);
      if (inactiveDirectories.length > 0) {
        issues.push(`Found ${inactiveDirectories.length} inactive directories`);
      }

      // Check for orphaned listings
      const listings = await storage.getAllListings();
      const directoryNames = directories.map(d => d.directoryName);
      const orphanedListings = listings.filter(l => !directoryNames.includes(l.directoryName));
      if (orphanedListings.length > 0) {
        issues.push(`Found ${orphanedListings.length} orphaned listings`);
      }

      // Check for empty collections
      const collections = await storage.getAllCollections();
      const emptyCollections = [];
      for (const collection of collections) {
        const items = await storage.getCollectionItemsByCollection(collection.id);
        if (items.length === 0) {
          emptyCollections.push(collection);
        }
      }

      return {
        issues,
        healthStatus: issues.length === 0 ? 'good' : 'needs_attention',
        recommendations: this.generateRecommendations(issues),
        systemStats: {
          totalDirectories: directories.length,
          activeDirectories: directories.filter(d => d.isActive).length,
          totalListings: listings.length,
          totalCollections: collections.length,
          emptyCollections: emptyCollections.length
        }
      };
    } catch (error) {
      return {
        error: 'Failed to gather troubleshooting data',
        details: error.message
      };
    }
  }

  private async checkDataIntegrity() {
    try {
      const listings = await storage.getAllListings();
      const collections = await storage.getAllCollections();
      const directories = await storage.getAllDirectories();

      const directoryNames = directories.map(d => d.directoryName);
      
      const issues = [];
      
      // Check listing-directory integrity
      const orphanedListings = listings.filter(l => !directoryNames.includes(l.directoryName));
      if (orphanedListings.length > 0) {
        issues.push(`${orphanedListings.length} listings reference non-existent directories`);
      }

      // Check collection-directory integrity
      const orphanedCollections = collections.filter(c => !directoryNames.includes(c.directoryName));
      if (orphanedCollections.length > 0) {
        issues.push(`${orphanedCollections.length} collections reference non-existent directories`);
      }

      return {
        status: issues.length === 0 ? 'good' : 'issues_found',
        issues,
        checkedAt: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message
      };
    }
  }

  private generateRecommendations(issues: string[]): string[] {
    const recommendations = [];
    
    if (issues.some(issue => issue.includes('inactive directories'))) {
      recommendations.push('Review and reactivate or clean up inactive directories');
    }
    
    if (issues.some(issue => issue.includes('orphaned listings'))) {
      recommendations.push('Update orphaned listings to reference valid directories or remove them');
    }
    
    if (issues.some(issue => issue.includes('empty collections'))) {
      recommendations.push('Add products to empty collections or consider removing them');
    }

    if (recommendations.length === 0) {
      recommendations.push('System appears healthy - continue regular monitoring');
    }

    return recommendations;
  }

  async analyzeCode(filePath: string) {
    try {
      const fullPath = path.join(process.cwd(), filePath);
      const content = await fs.readFile(fullPath, 'utf-8');
      
      return {
        filePath,
        content,
        lines: content.split('\n').length,
        size: content.length,
        lastModified: (await fs.stat(fullPath)).mtime
      };
    } catch (error) {
      throw new Error(`Failed to analyze code: ${error.message}`);
    }
  }

  async proposeCodeChange(filePath: string, description: string, currentCode?: string): Promise<CodeChange> {
    try {
      const fileAnalysis = currentCode ? 
        { content: currentCode, filePath } : 
        await this.analyzeCode(filePath);

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a code modification expert. Analyze the provided code and suggest specific improvements based on the request. Respond in JSON format with: {
              "proposedCode": "full modified code",
              "description": "detailed explanation of changes",
              "riskLevel": "low|medium|high",
              "testRequired": boolean,
              "reasoning": "why this change is beneficial"
            }`
          },
          {
            role: "user",
            content: `File: ${filePath}
Request: ${description}

Current Code:
${fileAnalysis.content}

Please provide the complete modified code with the requested changes.`
          }
        ],
        response_format: { type: "json_object" }
      });

      const suggestion = JSON.parse(response.choices[0].message.content || '{}');

      return {
        filePath,
        currentCode: fileAnalysis.content,
        proposedCode: suggestion.proposedCode,
        description: suggestion.description,
        riskLevel: suggestion.riskLevel || 'medium',
        testRequired: suggestion.testRequired !== false
      };
    } catch (error) {
      throw new Error(`Failed to propose code change: ${error.message}`);
    }
  }
}

export const aiAgent = new AIAgentService();