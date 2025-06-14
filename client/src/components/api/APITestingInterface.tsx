import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Play, Copy, Download, Code2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface APIEndpoint {
  path: string;
  method: string;
  description: string;
  category: string;
  requiresLocationId: boolean;
  parameters?: {
    path?: string[];
    query?: string[];
    body?: string[];
  };
}

const API_ENDPOINTS: APIEndpoint[] = [
  // Products
  { path: '/products', method: 'GET', description: 'List Products', category: 'Products', requiresLocationId: true, parameters: { query: ['limit', 'offset', 'search'] } },
  { path: '/products', method: 'POST', description: 'Create Product', category: 'Products', requiresLocationId: true, parameters: { body: ['name', 'description', 'productType'] } },
  { path: '/products/:productId', method: 'GET', description: 'Get Product', category: 'Products', requiresLocationId: false, parameters: { path: ['productId'] } },
  { path: '/products/:productId', method: 'PUT', description: 'Update Product', category: 'Products', requiresLocationId: false, parameters: { path: ['productId'], body: ['name', 'description'] } },
  { path: '/products/:productId', method: 'DELETE', description: 'Delete Product', category: 'Products', requiresLocationId: false, parameters: { path: ['productId'] } },
  
  // Contacts
  { path: '/contacts', method: 'GET', description: 'List Contacts', category: 'Contacts', requiresLocationId: true, parameters: { query: ['limit', 'offset', 'email'] } },
  { path: '/contacts', method: 'POST', description: 'Create Contact', category: 'Contacts', requiresLocationId: true, parameters: { body: ['firstName', 'lastName', 'email', 'phone'] } },
  { path: '/contacts/:contactId', method: 'GET', description: 'Get Contact', category: 'Contacts', requiresLocationId: true, parameters: { path: ['contactId'] } },
  { path: '/contacts/:contactId', method: 'PUT', description: 'Update Contact', category: 'Contacts', requiresLocationId: true, parameters: { path: ['contactId'], body: ['firstName', 'lastName', 'email'] } },
  { path: '/contacts/:contactId', method: 'DELETE', description: 'Delete Contact', category: 'Contacts', requiresLocationId: true, parameters: { path: ['contactId'] } },
  
  // Media
  { path: '/media', method: 'GET', description: 'List Media Files', category: 'Media', requiresLocationId: true, parameters: { query: ['limit', 'offset', 'type'] } },
  { path: '/media/upload', method: 'POST', description: 'Upload File', category: 'Media', requiresLocationId: true, parameters: { body: ['file', 'name'] } },
  { path: '/media/:mediaId', method: 'DELETE', description: 'Delete Media', category: 'Media', requiresLocationId: true, parameters: { path: ['mediaId'] } },
  
  // Opportunities
  { path: '/opportunities', method: 'GET', description: 'List Opportunities', category: 'Opportunities', requiresLocationId: true, parameters: { query: ['limit', 'offset', 'pipelineId'] } },
  { path: '/opportunities', method: 'POST', description: 'Create Opportunity', category: 'Opportunities', requiresLocationId: true, parameters: { body: ['title', 'pipelineId', 'contactId'] } },
  
  // Workflows
  { path: '/workflows', method: 'GET', description: 'List Workflows', category: 'Workflows', requiresLocationId: true },
  { path: '/workflows/:workflowId/contacts/:contactId', method: 'POST', description: 'Add Contact to Workflow', category: 'Workflows', requiresLocationId: true, parameters: { path: ['workflowId', 'contactId'] } },
  
  // Forms
  { path: '/forms', method: 'GET', description: 'List Forms', category: 'Forms', requiresLocationId: true },
  { path: '/forms/:formId/submissions', method: 'GET', description: 'Get Form Submissions', category: 'Forms', requiresLocationId: true, parameters: { path: ['formId'], query: ['limit', 'offset'] } },
  
  // Locations
  { path: '/locations', method: 'GET', description: 'List Locations', category: 'Locations', requiresLocationId: false },
  { path: '/locations/:locationId', method: 'GET', description: 'Get Location', category: 'Locations', requiresLocationId: false, parameters: { path: ['locationId'] } }
];

export default function APITestingInterface() {
  const [selectedEndpoint, setSelectedEndpoint] = useState<APIEndpoint | null>(null);
  const [pathParams, setPathParams] = useState<Record<string, string>>({});
  const [queryParams, setQueryParams] = useState<Record<string, string>>({});
  const [bodyParams, setBodyParams] = useState<string>('{}');
  const [response, setResponse] = useState<any>(null);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const { toast } = useToast();

  const testMutation = useMutation({
    mutationFn: async ({ endpoint, path, query, body }: { 
      endpoint: APIEndpoint; 
      path: Record<string, string>; 
      query: Record<string, string>; 
      body: string 
    }) => {
      const startTime = Date.now();
      
      // Build URL with path parameters
      let url = `/api/ghl${endpoint.path}`;
      Object.entries(path).forEach(([key, value]) => {
        url = url.replace(`:${key}`, value);
      });
      
      // Add query parameters
      const queryString = new URLSearchParams(query).toString();
      if (queryString) {
        url += `?${queryString}`;
      }
      
      const options: RequestInit = {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json',
        }
      };
      
      if (endpoint.method !== 'GET' && body.trim()) {
        options.body = body;
      }
      
      const response = await fetch(url, options);
      const endTime = Date.now();
      setResponseTime(endTime - startTime);
      
      const data = await response.json();
      
      return {
        status: response.status,
        statusText: response.statusText,
        data
      };
    },
    onSuccess: (result) => {
      setResponse(result);
      toast({
        title: "API Test Complete",
        description: `Request completed in ${responseTime}ms`
      });
    },
    onError: (error) => {
      setResponse({
        status: 500,
        statusText: 'Error',
        data: { error: error instanceof Error ? error.message : 'Unknown error' }
      });
      toast({
        title: "API Test Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    }
  });

  const handleTest = () => {
    if (!selectedEndpoint) return;
    
    testMutation.mutate({
      endpoint: selectedEndpoint,
      path: pathParams,
      query: queryParams,
      body: bodyParams
    });
  };

  const copyResponse = () => {
    if (response) {
      navigator.clipboard.writeText(JSON.stringify(response, null, 2));
      toast({
        title: "Copied to clipboard",
        description: "Response has been copied to clipboard"
      });
    }
  };

  const downloadResponse = () => {
    if (response) {
      const blob = new Blob([JSON.stringify(response, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `api-response-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const categories = Array.from(new Set(API_ENDPOINTS.map(ep => ep.category)));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">API Testing Interface</h2>
        <p className="text-muted-foreground">
          Test GoHighLevel API endpoints with real data and view responses
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Panel - Request Configuration */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Select Endpoint</CardTitle>
              <CardDescription>Choose an API endpoint to test</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select onValueChange={(value) => {
                const endpoint = API_ENDPOINTS.find(ep => `${ep.method} ${ep.path}` === value);
                setSelectedEndpoint(endpoint || null);
                setPathParams({});
                setQueryParams({});
                setBodyParams('{}');
                setResponse(null);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an endpoint to test" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <div key={category}>
                      <div className="px-2 py-1 text-sm font-medium text-muted-foreground">
                        {category}
                      </div>
                      {API_ENDPOINTS.filter(ep => ep.category === category).map(endpoint => (
                        <SelectItem key={`${endpoint.method} ${endpoint.path}`} value={`${endpoint.method} ${endpoint.path}`}>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {endpoint.method}
                            </Badge>
                            <span>{endpoint.path}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>

              {selectedEndpoint && (
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline">{selectedEndpoint.method}</Badge>
                    <code className="text-sm">{selectedEndpoint.path}</code>
                  </div>
                  <p className="text-sm text-muted-foreground">{selectedEndpoint.description}</p>
                  {selectedEndpoint.requiresLocationId && (
                    <Badge variant="secondary" className="mt-2">
                      Requires Location ID
                    </Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {selectedEndpoint && (
            <Tabs defaultValue="path" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="path">Path Params</TabsTrigger>
                <TabsTrigger value="query">Query Params</TabsTrigger>
                <TabsTrigger value="body">Body</TabsTrigger>
              </TabsList>

              <TabsContent value="path">
                <Card>
                  <CardHeader>
                    <CardTitle>Path Parameters</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selectedEndpoint.parameters?.path?.map(param => (
                      <div key={param}>
                        <label className="text-sm font-medium">{param}</label>
                        <Input
                          value={pathParams[param] || ''}
                          onChange={(e) => setPathParams(prev => ({ ...prev, [param]: e.target.value }))}
                          placeholder={`Enter ${param}`}
                        />
                      </div>
                    )) || <p className="text-muted-foreground">No path parameters required</p>}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="query">
                <Card>
                  <CardHeader>
                    <CardTitle>Query Parameters</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selectedEndpoint.parameters?.query?.map(param => (
                      <div key={param}>
                        <label className="text-sm font-medium">{param}</label>
                        <Input
                          value={queryParams[param] || ''}
                          onChange={(e) => setQueryParams(prev => ({ ...prev, [param]: e.target.value }))}
                          placeholder={`Enter ${param}`}
                        />
                      </div>
                    )) || <p className="text-muted-foreground">No query parameters available</p>}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="body">
                <Card>
                  <CardHeader>
                    <CardTitle>Request Body</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedEndpoint.method !== 'GET' ? (
                      <Textarea
                        value={bodyParams}
                        onChange={(e) => setBodyParams(e.target.value)}
                        placeholder="Enter JSON request body"
                        rows={8}
                        className="font-mono"
                      />
                    ) : (
                      <p className="text-muted-foreground">GET requests don't require a body</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}

          <Button 
            onClick={handleTest} 
            disabled={!selectedEndpoint || testMutation.isPending}
            className="w-full"
            size="lg"
          >
            <Play className="h-4 w-4 mr-2" />
            {testMutation.isPending ? 'Testing...' : 'Test API Endpoint'}
          </Button>
        </div>

        {/* Right Panel - Response */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Response</CardTitle>
                {response && (
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={copyResponse}>
                      <Copy className="h-3 w-3 mr-1" />
                      Copy
                    </Button>
                    <Button variant="outline" size="sm" onClick={downloadResponse}>
                      <Download className="h-3 w-3 mr-1" />
                      Download
                    </Button>
                  </div>
                )}
              </div>
              {response && responseTime && (
                <div className="flex items-center gap-4 text-sm">
                  <Badge variant={response.status < 400 ? "default" : "destructive"}>
                    {response.status} {response.statusText}
                  </Badge>
                  <span className="text-muted-foreground">{responseTime}ms</span>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {!response ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Code2 className="h-12 w-12 mb-4" />
                  <p>Select an endpoint and click "Test" to see the response</p>
                </div>
              ) : (
                <pre className="bg-muted p-4 rounded-lg overflow-auto max-h-96 text-xs">
                  {JSON.stringify(response.data, null, 2)}
                </pre>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

