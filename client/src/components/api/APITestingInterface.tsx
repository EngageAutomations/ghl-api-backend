import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Play, 
  Code, 
  TestTube, 
  Copy, 
  Download, 
  History,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface TestResult {
  success: boolean;
  status: number;
  statusText: string;
  data?: any;
  error?: string;
  duration: number;
  timestamp: string;
}

interface TestHistory {
  id: string;
  method: string;
  endpoint: string;
  result: TestResult;
}

export default function APITestingInterface() {
  const [method, setMethod] = useState('GET');
  const [endpoint, setEndpoint] = useState('/api/ghl/');
  const [headers, setHeaders] = useState('{}');
  const [body, setBody] = useState('{}');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [history, setHistory] = useState<TestHistory[]>([]);
  const [selectedPreset, setSelectedPreset] = useState('');

  const { toast } = useToast();

  const presets = [
    {
      id: 'get-contacts',
      name: 'Get Contacts',
      method: 'GET',
      endpoint: '/api/ghl/contacts',
      headers: '{}',
      body: '{}'
    },
    {
      id: 'create-contact',
      name: 'Create Contact',
      method: 'POST',
      endpoint: '/api/ghl/contacts',
      headers: '{"Content-Type": "application/json"}',
      body: '{\n  "firstName": "John",\n  "lastName": "Doe",\n  "email": "john.doe@example.com",\n  "phone": "+1234567890"\n}'
    },
    {
      id: 'get-products',
      name: 'Get Products',
      method: 'GET',
      endpoint: '/api/ghl/products',
      headers: '{}',
      body: '{}'
    },
    {
      id: 'create-product',
      name: 'Create Product',
      method: 'POST',
      endpoint: '/api/ghl/products',
      headers: '{"Content-Type": "application/json"}',
      body: '{\n  "name": "Test Product",\n  "description": "A test product",\n  "price": 29.99,\n  "currency": "USD",\n  "type": "DIGITAL"\n}'
    },
    {
      id: 'get-opportunities',
      name: 'Get Opportunities',
      method: 'GET',
      endpoint: '/api/ghl/opportunities',
      headers: '{}',
      body: '{}'
    },
    {
      id: 'upload-media',
      name: 'Upload Media',
      method: 'POST',
      endpoint: '/api/ghl/media/upload',
      headers: '{}',
      body: 'FormData (file upload)'
    }
  ];

  const executeTest = async () => {
    if (!endpoint) {
      toast({
        title: "Error",
        description: "Please enter an endpoint",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    const startTime = Date.now();

    try {
      let parsedHeaders = {};
      let parsedBody = null;

      // Parse headers
      try {
        parsedHeaders = JSON.parse(headers);
      } catch (e) {
        throw new Error('Invalid JSON in headers');
      }

      // Parse body for non-GET requests
      if (method !== 'GET' && body && body.trim() !== '{}') {
        try {
          parsedBody = JSON.parse(body);
        } catch (e) {
          throw new Error('Invalid JSON in body');
        }
      }

      const options: RequestInit = {
        method,
        headers: parsedHeaders,
      };

      if (parsedBody && method !== 'GET') {
        options.body = JSON.stringify(parsedBody);
      }

      const response = await fetch(endpoint, options);
      const duration = Date.now() - startTime;
      
      let responseData;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }

      const testResult: TestResult = {
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
        data: responseData,
        duration,
        timestamp: new Date().toISOString()
      };

      setResult(testResult);

      // Add to history
      const historyItem: TestHistory = {
        id: Date.now().toString(),
        method,
        endpoint,
        result: testResult
      };
      
      setHistory(prev => [historyItem, ...prev.slice(0, 9)]); // Keep last 10 items

      if (response.ok) {
        toast({
          title: "Test Successful",
          description: `${method} ${endpoint} completed in ${duration}ms`
        });
      } else {
        toast({
          title: "Test Failed",
          description: `${response.status} ${response.statusText}`,
          variant: "destructive"
        });
      }

    } catch (error) {
      const duration = Date.now() - startTime;
      const testResult: TestResult = {
        success: false,
        status: 0,
        statusText: 'Network Error',
        error: error instanceof Error ? error.message : 'Unknown error',
        duration,
        timestamp: new Date().toISOString()
      };

      setResult(testResult);
      
      toast({
        title: "Test Error",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadPreset = (presetId: string) => {
    const preset = presets.find(p => p.id === presetId);
    if (preset) {
      setMethod(preset.method);
      setEndpoint(preset.endpoint);
      setHeaders(preset.headers);
      setBody(preset.body);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Content copied to clipboard"
    });
  };

  const formatJson = (obj: any) => {
    try {
      return JSON.stringify(obj, null, 2);
    } catch {
      return String(obj);
    }
  };

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'text-green-600';
    if (status >= 400 && status < 500) return 'text-yellow-600';
    if (status >= 500) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">API Testing Interface</h2>
          <p className="text-muted-foreground">
            Test GoHighLevel API endpoints directly from the dashboard
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Request Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="h-5 w-5" />
              Request Configuration
            </CardTitle>
            <CardDescription>
              Configure your API request parameters
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Preset Selector */}
            <div>
              <Label htmlFor="preset">Quick Presets</Label>
              <Select value={selectedPreset} onValueChange={(value) => {
                setSelectedPreset(value);
                loadPreset(value);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a preset..." />
                </SelectTrigger>
                <SelectContent>
                  {presets.map((preset) => (
                    <SelectItem key={preset.id} value={preset.id}>
                      {preset.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Method and Endpoint */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              <div>
                <Label htmlFor="method">Method</Label>
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GET">GET</SelectItem>
                    <SelectItem value="POST">POST</SelectItem>
                    <SelectItem value="PUT">PUT</SelectItem>
                    <SelectItem value="DELETE">DELETE</SelectItem>
                    <SelectItem value="PATCH">PATCH</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="md:col-span-3">
                <Label htmlFor="endpoint">Endpoint</Label>
                <Input
                  id="endpoint"
                  value={endpoint}
                  onChange={(e) => setEndpoint(e.target.value)}
                  placeholder="/api/ghl/contacts"
                />
              </div>
            </div>

            {/* Headers */}
            <div>
              <Label htmlFor="headers">Headers (JSON)</Label>
              <Textarea
                id="headers"
                value={headers}
                onChange={(e) => setHeaders(e.target.value)}
                placeholder='{"Content-Type": "application/json"}'
                rows={3}
                className="font-mono text-sm"
              />
            </div>

            {/* Body */}
            {method !== 'GET' && (
              <div>
                <Label htmlFor="body">Request Body (JSON)</Label>
                <Textarea
                  id="body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder='{"key": "value"}'
                  rows={6}
                  className="font-mono text-sm"
                />
              </div>
            )}

            {/* Execute Button */}
            <Button 
              onClick={executeTest} 
              disabled={isLoading}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Executing...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Execute Test
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              Response
            </CardTitle>
            <CardDescription>
              API response details and data
            </CardDescription>
          </CardHeader>
          <CardContent>
            {result ? (
              <Tabs defaultValue="response" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="response">Response</TabsTrigger>
                  <TabsTrigger value="details">Details</TabsTrigger>
                </TabsList>
                
                <TabsContent value="response" className="space-y-4">
                  {/* Status */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {result.success ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-600" />
                      )}
                      <span className={`font-mono font-semibold ${getStatusColor(result.status)}`}>
                        {result.status} {result.statusText}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {result.duration}ms
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(formatJson(result.data))}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Response Data */}
                  <div className="border rounded-md">
                    <pre className="p-4 text-sm overflow-auto max-h-96 bg-gray-50">
                      {result.error ? result.error : formatJson(result.data)}
                    </pre>
                  </div>
                </TabsContent>
                
                <TabsContent value="details" className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium">Timestamp:</span>
                      <span className="font-mono text-sm">
                        {new Date(result.timestamp).toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="font-medium">Duration:</span>
                      <span className="font-mono text-sm">{result.duration}ms</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="font-medium">Status:</span>
                      <span className={`font-mono text-sm ${getStatusColor(result.status)}`}>
                        {result.status} {result.statusText}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="font-medium">Success:</span>
                      <span className={`font-mono text-sm ${result.success ? 'text-green-600' : 'text-red-600'}`}>
                        {result.success ? 'true' : 'false'}
                      </span>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <TestTube className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Execute a test to see results here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Test History */}
      {history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Test History
            </CardTitle>
            <CardDescription>
              Recent API test executions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {history.map((item) => (
                <div 
                  key={item.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => setResult(item.result)}
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="font-mono">
                      {item.method}
                    </Badge>
                    <span className="font-mono text-sm">{item.endpoint}</span>
                    <span className={`text-sm ${getStatusColor(item.result.status)}`}>
                      {item.result.status}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{item.result.duration}ms</span>
                    <span>{new Date(item.result.timestamp).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}