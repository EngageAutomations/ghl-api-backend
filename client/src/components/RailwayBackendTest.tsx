import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle, Loader2, Server, Database } from "lucide-react";

interface TestResult {
  success: boolean;
  data?: any;
  error?: string;
  details?: string;
}

export function RailwayBackendTest() {
  const [isTestingHealth, setIsTestingHealth] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isTestingProduct, setIsTestingProduct] = useState(false);
  const [healthResult, setHealthResult] = useState<TestResult | null>(null);
  const [connectionResult, setConnectionResult] = useState<TestResult | null>(null);
  const [productResult, setProductResult] = useState<TestResult | null>(null);

  const testRailwayHealth = async () => {
    setIsTestingHealth(true);
    setHealthResult(null);

    try {
      const response = await fetch("/api/railway/health");
      const data = await response.json();
      setHealthResult(data);
    } catch (error) {
      setHealthResult({
        success: false,
        error: "Network error",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsTestingHealth(false);
    }
  };

  const testGHLConnection = async () => {
    setIsTestingConnection(true);
    setConnectionResult(null);

    try {
      const response = await fetch("/api/railway/test-connection");
      const data = await response.json();
      setConnectionResult(data);
    } catch (error) {
      setConnectionResult({
        success: false,
        error: "Connection test failed",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const testProductCreation = async () => {
    setIsTestingProduct(true);
    setProductResult(null);

    try {
      const response = await fetch("/api/ghl/create-product", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          formSubmission: {
            product_name: "Test Product from Local App",
            product_description: "This is a test product created through the Railway backend integration",
          },
          productType: "DIGITAL"
        }),
      });

      const data = await response.json();
      setProductResult(data);
    } catch (error) {
      setProductResult({
        success: false,
        error: "Product creation test failed",
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsTestingProduct(false);
    }
  };

  const ResultDisplay = ({ result, title }: { result: TestResult | null; title: string }) => {
    if (!result) return null;

    return (
      <div className="mt-4 p-4 border rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          {result.success ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-600" />
          )}
          <h4 className="font-semibold">{title} Result</h4>
          <Badge variant={result.success ? "default" : "destructive"}>
            {result.success ? "Success" : "Failed"}
          </Badge>
        </div>
        
        {result.success && result.data && (
          <div className="bg-green-50 p-3 rounded text-sm">
            <pre className="whitespace-pre-wrap">
              {JSON.stringify(result.data, null, 2)}
            </pre>
          </div>
        )}
        
        {!result.success && (
          <div className="bg-red-50 p-3 rounded text-sm">
            <p className="font-medium text-red-800">{result.error}</p>
            {result.details && (
              <p className="text-red-600 mt-1">{result.details}</p>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Railway Backend Integration Test
            <Badge variant="outline">Production OAuth</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Health Check */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Database className="h-4 w-4" />
              Railway Backend Health
            </h3>
            <p className="text-sm text-gray-600">
              Check if Railway backend is running and has OAuth installations
            </p>
            <Button 
              onClick={testRailwayHealth}
              disabled={isTestingHealth}
              className="w-full"
            >
              {isTestingHealth ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Checking Health...
                </>
              ) : (
                "Test Railway Health"
              )}
            </Button>
            <ResultDisplay result={healthResult} title="Health Check" />
          </div>

          {/* Connection Test */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">GoHighLevel Connection</h3>
            <p className="text-sm text-gray-600">
              Test if Railway backend can connect to GoHighLevel with stored OAuth credentials
            </p>
            <Button 
              onClick={testGHLConnection}
              disabled={isTestingConnection}
              className="w-full"
              variant="outline"
            >
              {isTestingConnection ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing Connection...
                </>
              ) : (
                "Test GHL Connection"
              )}
            </Button>
            <ResultDisplay result={connectionResult} title="Connection Test" />
          </div>

          {/* Product Creation Test */}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Product Creation Test</h3>
            <p className="text-sm text-gray-600">
              Create a real product in GoHighLevel through Railway backend
            </p>
            <Button 
              onClick={testProductCreation}
              disabled={isTestingProduct}
              className="w-full"
              variant="destructive"
            >
              {isTestingProduct ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Product...
                </>
              ) : (
                "Create Test Product"
              )}
            </Button>
            <ResultDisplay result={productResult} title="Product Creation" />
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">Testing Steps</h4>
            <ol className="text-sm text-blue-700 space-y-1">
              <li>1. Test Railway Health - Verify backend is running</li>
              <li>2. Test GHL Connection - Verify OAuth credentials work</li>
              <li>3. Create Test Product - Verify full integration works</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}