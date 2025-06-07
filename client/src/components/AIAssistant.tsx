import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, Bot, User, Code, BarChart3, AlertTriangle, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiRequest } from '@/lib/queryClient';

interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  requestType?: string;
  data?: any;
  suggestedActions?: string[];
  codeChanges?: any[];
}

type RequestType = 'troubleshooting' | 'code-modification' | 'user-analytics' | 'system-insights';

export default function AIAssistant() {
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your AI assistant. I can help you troubleshoot issues, analyze user data, suggest code modifications, and provide system insights. What would you like me to help with?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [activeTab, setActiveTab] = useState<RequestType>('user-analytics');
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Fetch system analytics
  const { data: systemInsights, isLoading: systemLoading } = useQuery({
    queryKey: ['/api/ai/system-insights'],
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Fetch user analytics  
  const { data: userAnalytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['/api/ai/analytics'],
    refetchInterval: 60000 // Refresh every minute
  });

  // Chat mutation
  const chatMutation = useMutation({
    mutationFn: async ({ message, requestType }: { message: string; requestType: RequestType }) => {
      return apiRequest('/api/ai/chat', {
        method: 'POST',
        data: { message, requestType, userId: 1 }
      });
    },
    onSuccess: (response: any) => {
      const aiMessage: AIMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: response.message,
        timestamp: new Date(),
        requestType: activeTab,
        data: response.data,
        suggestedActions: response.suggestedActions,
        codeChanges: response.codeChanges
      };
      setMessages(prev => [...prev, aiMessage]);
      scrollToBottom();
    }
  });

  const scrollToBottom = () => {
    setTimeout(() => {
      if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
      }
    }, 100);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || chatMutation.isPending) return;

    const userMessage: AIMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
      requestType: activeTab
    };

    setMessages(prev => [...prev, userMessage]);
    chatMutation.mutate({ message: input, requestType: activeTab });
    setInput('');
    scrollToBottom();
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = (message: AIMessage) => {
    const isUser = message.role === 'user';
    
    return (
      <div key={message.id} className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
        {!isUser && (
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <Bot className="w-4 h-4 text-blue-600" />
          </div>
        )}
        
        <div className={`max-w-[70%] ${isUser ? 'order-1' : ''}`}>
          <div className={`rounded-lg px-4 py-2 ${
            isUser 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-900'
          }`}>
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          </div>
          
          {/* Show additional data for AI responses */}
          {!isUser && message.data && (
            <div className="mt-2 p-3 bg-gray-50 rounded border text-xs">
              <pre className="whitespace-pre-wrap overflow-x-auto">
                {JSON.stringify(message.data, null, 2)}
              </pre>
            </div>
          )}
          
          {/* Show suggested actions */}
          {!isUser && message.suggestedActions && message.suggestedActions.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {message.suggestedActions.map((action, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {action}
                </Badge>
              ))}
            </div>
          )}
          
          <p className="text-xs text-gray-500 mt-1">
            {formatTimestamp(message.timestamp)}
          </p>
        </div>
        
        {isUser && (
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-green-600" />
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Bot className="w-5 h-5" />
          AI Assistant
        </CardTitle>
        
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as RequestType)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="user-analytics" className="text-xs">
              <BarChart3 className="w-3 h-3 mr-1" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="troubleshooting" className="text-xs">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Issues
            </TabsTrigger>
            <TabsTrigger value="code-modification" className="text-xs">
              <Code className="w-3 h-3 mr-1" />
              Code
            </TabsTrigger>
            <TabsTrigger value="system-insights" className="text-xs">
              <BarChart3 className="w-3 h-3 mr-1" />
              System
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="user-analytics" className="mt-2">
            <div className="grid grid-cols-2 gap-2 text-xs">
              {analyticsLoading ? (
                <div className="col-span-2 text-center py-2">Loading analytics...</div>
              ) : userAnalytics ? (
                <>
                  <div className="bg-blue-50 p-2 rounded">
                    <p className="font-medium">Total Users</p>
                    <p className="text-lg">{(userAnalytics as any)?.overview?.totalUsers || 0}</p>
                  </div>
                  <div className="bg-green-50 p-2 rounded">
                    <p className="font-medium">Directories</p>
                    <p className="text-lg">{(userAnalytics as any)?.overview?.totalDirectories || 0}</p>
                  </div>
                  <div className="bg-yellow-50 p-2 rounded">
                    <p className="font-medium">Products</p>
                    <p className="text-lg">{(userAnalytics as any)?.overview?.totalListings || 0}</p>
                  </div>
                  <div className="bg-purple-50 p-2 rounded">
                    <p className="font-medium">Collections</p>
                    <p className="text-lg">{(userAnalytics as any)?.overview?.totalCollections || 0}</p>
                  </div>
                </>
              ) : (
                <div className="col-span-2 text-center py-2">No analytics available</div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="system-insights" className="mt-2">
            <div className="text-xs">
              {systemLoading ? (
                <div className="text-center py-2">Loading system data...</div>
              ) : systemInsights ? (
                <div className="space-y-2">
                  <div className="bg-gray-50 p-2 rounded">
                    <p className="font-medium">System Health</p>
                    <p className="text-green-600">
                      {systemInsights.systemHealth?.status || 'Unknown'}
                    </p>
                  </div>
                  {systemInsights.performanceMetrics && (
                    <div className="bg-gray-50 p-2 rounded">
                      <p className="font-medium">Avg Listings/Directory</p>
                      <p>{systemInsights.performanceMetrics.averageListingsPerDirectory || 0}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-2">No system data available</div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="troubleshooting" className="mt-2">
            <div className="text-xs text-gray-600">
              Ask me about any issues you're experiencing with the system.
            </div>
          </TabsContent>
          
          <TabsContent value="code-modification" className="mt-2">
            <div className="text-xs text-gray-600">
              I can help analyze and suggest improvements to your code.
            </div>
          </TabsContent>
        </Tabs>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 px-4" ref={scrollAreaRef}>
          <div className="py-4">
            {messages.map(renderMessage)}
            {chatMutation.isPending && (
              <div className="flex gap-3 justify-start mb-4">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                </div>
                <div className="bg-gray-100 rounded-lg px-4 py-2">
                  <p className="text-sm text-gray-600">Thinking...</p>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        
        <form onSubmit={handleSubmit} className="p-4 border-t flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Ask about ${activeTab.replace('-', ' ')}...`}
            disabled={chatMutation.isPending}
            className="flex-1"
          />
          <Button 
            type="submit" 
            disabled={!input.trim() || chatMutation.isPending}
            size="sm"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}