import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  PlayIcon, 
  CheckCircledIcon, 
  CrossCircledIcon, 
  ReloadIcon,
  CodeIcon,
  MagicWandIcon,
  DownloadIcon,
  EyeOpenIcon
} from '@radix-ui/react-icons';

interface TestResult {
  name: string;
  description: string;
  status: 'pass' | 'fail' | 'running' | 'pending';
  config: any;
  issues?: string[];
  duration?: number;
}

interface TestSummary {
  total: number;
  passed: number;
  failed: number;
  successRate: number;
}

export default function DeveloperDashboard() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [testSummary, setTestSummary] = useState<TestSummary | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState<string>('');
  const [progress, setProgress] = useState(0);
  
  // AI Code Generation State
  const [selectedFeature, setSelectedFeature] = useState<string>('');
  const [featurePrompt, setFeaturePrompt] = useState<string>('');
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  const runTests = async () => {
    setIsRunning(true);
    setProgress(0);
    setTestResults([]);
    setTestSummary(null);
    
    try {
      // Simulate running the test suite
      const response = await fetch('/api/dev/run-tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error('Failed to run tests');
      }
      
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter(line => line.trim());
          
          for (const line of lines) {
            try {
              const data = JSON.parse(line);
              
              if (data.type === 'test_start') {
                setCurrentTest(data.testName);
              } else if (data.type === 'test_result') {
                setTestResults(prev => [...prev, data.result]);
                setProgress(data.progress);
              } else if (data.type === 'summary') {
                setTestSummary(data.summary);
                setIsRunning(false);
              }
            } catch (e) {
              console.warn('Failed to parse test result:', line);
            }
          }
        }
      }
    } catch (error) {
      console.error('Test execution failed:', error);
      setIsRunning(false);
    }
  };

  const generateCode = async () => {
    if (!selectedFeature || !featurePrompt) return;
    
    setIsGenerating(true);
    try {
      const response = await fetch('/api/dev/generate-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feature: selectedFeature,
          prompt: featurePrompt,
          context: 'wizard-configuration'
        })
      });
      
      const data = await response.json();
      setGeneratedCode(data.code || 'Failed to generate code');
    } catch (error) {
      setGeneratedCode('Error: Failed to generate code');
    } finally {
      setIsGenerating(false);
    }
  };

  const exportTestReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      summary: testSummary,
      results: testResults
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `test-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass': return <CheckCircledIcon className="h-4 w-4 text-green-500" />;
      case 'fail': return <CrossCircledIcon className="h-4 w-4 text-red-500" />;
      case 'running': return <ReloadIcon className="h-4 w-4 text-blue-500 animate-spin" />;
      default: return <div className="h-4 w-4 bg-gray-300 rounded-full" />;
    }
  };

  const features = [
    'Extended Descriptions',
    'Metadata Bar',
    'Google Maps Widget',
    'Action Buttons',
    'Embedded Forms',
    'Popup Configuration',
    'CSS Styling',
    'URL Token Replacement'
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Developer Dashboard</h1>
          <p className="text-muted-foreground">Test runner and AI-assisted code generation</p>
        </div>
      </div>

      <Tabs defaultValue="tests" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tests">Test Runner</TabsTrigger>
          <TabsTrigger value="codegen">AI Code Generator</TabsTrigger>
        </TabsList>

        <TabsContent value="tests" className="space-y-6">
          {/* Test Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PlayIcon className="h-5 w-5" />
                Test Suite Controls
              </CardTitle>
              <CardDescription>
                Run automated tests for wizard code generation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button 
                  onClick={runTests} 
                  disabled={isRunning}
                  className="flex items-center gap-2"
                >
                  {isRunning ? (
                    <>
                      <ReloadIcon className="h-4 w-4 animate-spin" />
                      Running Tests...
                    </>
                  ) : (
                    <>
                      <PlayIcon className="h-4 w-4" />
                      Run All Tests
                    </>
                  )}
                </Button>
                
                {testSummary && (
                  <Button 
                    variant="outline" 
                    onClick={exportTestReport}
                    className="flex items-center gap-2"
                  >
                    <DownloadIcon className="h-4 w-4" />
                    Export Report
                  </Button>
                )}
              </div>

              {isRunning && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Running: {currentTest}</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="w-full" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Test Summary */}
          {testSummary && (
            <Card>
              <CardHeader>
                <CardTitle>Test Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{testSummary.total}</div>
                    <div className="text-sm text-muted-foreground">Total Tests</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-500">{testSummary.passed}</div>
                    <div className="text-sm text-muted-foreground">Passed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-500">{testSummary.failed}</div>
                    <div className="text-sm text-muted-foreground">Failed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{testSummary.successRate}%</div>
                    <div className="text-sm text-muted-foreground">Success Rate</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Test Results */}
          {testResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Test Results</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-2">
                    {testResults.map((result, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(result.status)}
                          <div>
                            <div className="font-medium">{result.name}</div>
                            <div className="text-sm text-muted-foreground">{result.description}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {result.duration && (
                            <span className="text-xs text-muted-foreground">{result.duration}ms</span>
                          )}
                          <Badge variant={result.status === 'pass' ? 'default' : 'destructive'}>
                            {result.status.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="codegen" className="space-y-6">
          {/* AI Code Generation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MagicWandIcon className="h-5 w-5" />
                AI Code Generator
              </CardTitle>
              <CardDescription>
                Generate code for wizard features using AI assistance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="feature-select">Feature to Modify</Label>
                  <select 
                    id="feature-select"
                    value={selectedFeature}
                    onChange={(e) => setSelectedFeature(e.target.value)}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="">Select a feature...</option>
                    {features.map(feature => (
                      <option key={feature} value={feature}>{feature}</option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="prompt-input">What would you like to change?</Label>
                  <Input
                    id="prompt-input"
                    value={featurePrompt}
                    onChange={(e) => setFeaturePrompt(e.target.value)}
                    placeholder="Add new styling option, fix bug, etc..."
                  />
                </div>
              </div>

              <Button 
                onClick={generateCode}
                disabled={!selectedFeature || !featurePrompt || isGenerating}
                className="flex items-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <ReloadIcon className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <CodeIcon className="h-4 w-4" />
                    Generate Code
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Generated Code Display */}
          {generatedCode && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <EyeOpenIcon className="h-5 w-5" />
                  Generated Code
                </CardTitle>
                <CardDescription>
                  AI-generated code for {selectedFeature}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={generatedCode}
                  onChange={(e) => setGeneratedCode(e.target.value)}
                  className="font-mono text-sm min-h-64"
                  placeholder="Generated code will appear here..."
                />
                <div className="flex justify-end mt-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigator.clipboard.writeText(generatedCode)}
                  >
                    Copy Code
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Feature Documentation */}
          <Card>
            <CardHeader>
              <CardTitle>Feature Documentation</CardTitle>
              <CardDescription>
                Quick reference for wizard features and their configurations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {features.map(feature => (
                  <Alert key={feature}>
                    <AlertDescription>
                      <strong>{feature}</strong><br />
                      Click to view implementation details and configuration options.
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}