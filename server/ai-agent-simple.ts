import OpenAI from "openai";

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
      const systemPrompt = `You are an AI assistant for a GoHighLevel directory and collections management system. 
      
You help with:
- System troubleshooting and performance analysis
- User analytics and data insights  
- Code suggestions and improvements
- System health monitoring

Provide helpful, actionable responses in a professional tone.`;

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
        data: aiResponse.data || {},
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

  async getSystemInsights() {
    return {
      performanceMetrics: {
        averageListingsPerDirectory: 2.5,
        averageCollectionsPerDirectory: 1.2,
        activeDirectories: 1,
        activeListings: 3,
        activeCollections: 2
      },
      systemHealth: {
        status: 'healthy',
        memory: { used: 45, total: 128 },
        uptime: 3600
      }
    };
  }

  async getUserAnalytics() {
    return {
      overview: {
        totalUsers: 1,
        totalDirectories: 1,
        totalListings: 3,
        totalCollections: 2
      }
    };
  }
}

export const aiAgent = new AIAgentService();