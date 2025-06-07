import OpenAI from "openai";
import { storage } from "./storage";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface AIRequest {
  message: string;
  requestType: 'troubleshooting' | 'code-modification' | 'user-analytics' | 'system-insights';
  userId?: number;
}

export interface AIResponse {
  message: string;
  data?: any;
  suggestedActions?: string[];
}

export class AIAgentService {
  async processQuery(request: AIRequest): Promise<AIResponse> {
    try {
      // Gather real system data
      const systemData = await this.gatherSystemData(request);
      
      const systemPrompt = `You are an AI assistant for a GoHighLevel directory and collections management system. 
      
You help with:
- System troubleshooting and performance analysis
- User analytics and data insights  
- Code suggestions and improvements
- System health monitoring

Current System Data:
${JSON.stringify(systemData, null, 2)}

Always respond with valid JSON format containing a "message" field with your response. Use the real system data provided to give accurate, helpful responses.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: request.message }
        ],
        response_format: { type: "json_object" },
      });

      const aiResponse = JSON.parse(response.choices[0].message.content || '{"message": "I apologize, but I encountered an issue processing your request."}');
      
      return {
        message: aiResponse.message || "I'm here to help with your GoHighLevel directory system.",
        data: { ...systemData, ...aiResponse.data },
        suggestedActions: aiResponse.suggestedActions || []
      };
    } catch (error: any) {
      console.error('AI Agent Error:', error);
      return {
        message: 'I encountered an error processing your request. Please try again.',
        data: { error: error.message }
      };
    }
  }

  private async gatherSystemData(request: AIRequest) {
    const data: any = {};

    try {
      // Get user data if userId provided
      if (request.userId) {
        const user = await storage.getUser(request.userId);
        data.currentUser = user;
      }

      // Get directories and listings for analysis
      const directories = await storage.getFormConfigurationsByUser(request.userId || 1);
      data.directories = directories;

      if (directories.length > 0) {
        const firstDirectory = directories[0];
        const listings = await storage.getListingsByDirectory(firstDirectory.directoryName || '');
        data.listings = listings;
        
        // Get collections for the directory
        try {
          const collections = await storage.getCollectionsByDirectory(firstDirectory.directoryName || '');
          data.collections = collections;
        } catch (error) {
          data.collections = [];
        }
      }

      return data;
    } catch (error) {
      console.error('Error gathering system data:', error);
      return { error: 'Unable to access system data' };
    }
  }

  async getSystemInsights() {
    try {
      const directories = await storage.getDirectoriesByUserId(1);
      let totalListings = 0;
      let totalCollections = 0;

      for (const directory of directories) {
        if (directory.directoryName) {
          const listings = await storage.getListingsByDirectoryName(directory.directoryName);
          totalListings += listings.length;
          
          try {
            const collections = await storage.getCollectionsByDirectory(directory.directoryName);
            totalCollections += collections.length;
          } catch (error) {
            // Collections might not exist for this directory
          }
        }
      }

      return {
        performanceMetrics: {
          averageListingsPerDirectory: directories.length > 0 ? (totalListings / directories.length).toFixed(1) : 0,
          averageCollectionsPerDirectory: directories.length > 0 ? (totalCollections / directories.length).toFixed(1) : 0,
          activeDirectories: directories.length,
          activeListings: totalListings,
          activeCollections: totalCollections
        },
        systemHealth: {
          status: 'healthy',
          lastChecked: new Date().toISOString(),
          databaseConnected: true
        }
      };
    } catch (error) {
      return {
        performanceMetrics: {
          error: 'Unable to fetch system metrics'
        },
        systemHealth: {
          status: 'error',
          error: 'Database connection issue'
        }
      };
    }
  }

  async getUserAnalytics() {
    try {
      const directories = await storage.getDirectoriesByUserId(1);
      let totalListings = 0;
      let totalCollections = 0;

      for (const directory of directories) {
        if (directory.directoryName) {
          const listings = await storage.getListingsByDirectoryName(directory.directoryName);
          totalListings += listings.length;
          
          try {
            const collections = await storage.getCollectionsByDirectory(directory.directoryName);
            totalCollections += collections.length;
          } catch (error) {
            // Collections might not exist for this directory
          }
        }
      }

      return {
        overview: {
          totalUsers: 1, // Current user count
          totalDirectories: directories.length,
          totalListings: totalListings,
          totalCollections: totalCollections
        },
        directoryBreakdown: directories.map(dir => ({
          name: dir.directoryName,
          id: dir.id,
          created: dir.createdAt
        }))
      };
    } catch (error) {
      return {
        overview: {
          error: 'Unable to fetch user analytics'
        }
      };
    }
  }
}

export const aiAgent = new AIAgentService();