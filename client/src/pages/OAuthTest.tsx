import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function OAuthTest() {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const testOAuthFlow = async () => {
    setTesting(true);
    setResult(null);

    try {
      // Test Railway backend connection
      const response = await fetch('https://dir.engageautomations.com/api/ghl/products/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          installationId: 'install_1750252333303'
        })
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">OAuth Integration Testing</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Railway Backend Test</CardTitle>
              <CardDescription>
                Test connection to dir.engageautomations.com
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-gray-600">
                  <p><strong>Backend URL:</strong> https://dir.engageautomations.com</p>
                  <p><strong>Installation ID:</strong> install_1750252333303</p>
                  <p><strong>Token Management:</strong> Automatic refresh</p>
                </div>
                
                <Button 
                  onClick={testOAuthFlow}
                  disabled={testing}
                  className="w-full"
                >
                  {testing ? 'Testing Connection...' : 'Test Railway Backend'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
              <CardDescription>
                Connection status and response details
              </CardDescription>
            </CardHeader>
            <CardContent>
              {result ? (
                <div className={`p-4 rounded-md ${
                  result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                }`}>
                  <h3 className={`font-semibold mb-2 ${
                    result.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {result.success ? 'Connection Successful' : 'Connection Failed'}
                  </h3>
                  <pre className="text-sm overflow-auto whitespace-pre-wrap">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              ) : (
                <div className="text-gray-500 text-center py-8">
                  Click "Test Railway Backend" to check connection status
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>OAuth Architecture Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="font-semibold mb-2">1. Token Management</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Railway owns complete OAuth lifecycle</li>
                  <li>• Automatic refresh 5 minutes before expiry</li>
                  <li>• No local credential handling required</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">2. API Integration</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Direct GoHighLevel product creation</li>
                  <li>• Real-time synchronization</li>
                  <li>• Error handling and retry logic</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">3. Separation of Concerns</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Frontend focuses on UI/UX</li>
                  <li>• Railway handles authentication</li>
                  <li>• Scalable architecture</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}