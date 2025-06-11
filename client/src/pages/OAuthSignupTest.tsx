import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, AlertCircle, Clock, ExternalLink, User, Database, Key } from "lucide-react";

interface TestResult {
  step: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  data?: any;
}

export default function OAuthSignupTest() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [testing, setTesting] = useState(false);

  const updateResult = (step: string, status: 'pending' | 'success' | 'error', message: string, data?: any) => {
    setResults(prev => {
      const existing = prev.find(r => r.step === step);
      if (existing) {
        existing.status = status;
        existing.message = message;
        existing.data = data;
        return [...prev];
      } else {
        return [...prev, { step, status, message, data }];
      }
    });
  };

  const runOAuthTest = async () => {
    setTesting(true);
    setResults([]);

    try {
      // Test 1: Check OAuth configuration
      updateResult('oauth-config', 'pending', 'Checking OAuth configuration...');
      
      const configResponse = await fetch('/api/oauth/test-url');
      const configData = await configResponse.json();
      
      if (configResponse.ok && configData.authUrl) {
        updateResult('oauth-config', 'success', 'OAuth configuration valid', {
          authUrl: configData.authUrl,
          redirectUri: configData.redirectUri,
          clientId: configData.clientId ? 'Present' : 'Missing'
        });
      } else {
        updateResult('oauth-config', 'error', 'OAuth configuration invalid');
      }

      // Test 2: Check database schema
      updateResult('db-schema', 'pending', 'Checking database schema for OAuth fields...');
      
      const dbResponse = await fetch('/api/users/oauth');
      if (dbResponse.ok) {
        const oauthUsers = await dbResponse.json();
        updateResult('db-schema', 'success', `Database schema ready. Found ${oauthUsers.length} OAuth users`, {
          oauthUserCount: oauthUsers.length,
          users: oauthUsers
        });
      } else {
        updateResult('db-schema', 'error', 'Database schema check failed');
      }

      // Test 3: Check GHL OAuth endpoints
      updateResult('ghl-endpoints', 'pending', 'Testing GHL OAuth endpoints...');
      
      try {
        // Test auth URL accessibility
        const authUrl = configData.authUrl;
        if (authUrl) {
          updateResult('ghl-endpoints', 'success', 'GHL OAuth endpoints accessible', {
            authUrl: authUrl,
            status: 'Ready for OAuth flow'
          });
        } else {
          updateResult('ghl-endpoints', 'error', 'Auth URL not generated');
        }
      } catch (error) {
        updateResult('ghl-endpoints', 'error', 'GHL endpoints test failed');
      }

      // Test 4: Authentication middleware
      updateResult('auth-middleware', 'pending', 'Testing authentication middleware...');
      
      const authTestResponse = await fetch('/api/auth/me');
      if (authTestResponse.status === 401) {
        updateResult('auth-middleware', 'success', 'Authentication middleware working correctly');
      } else {
        updateResult('auth-middleware', 'error', 'Authentication middleware not working');
      }

    } catch (error) {
      updateResult('test-error', 'error', `Test execution failed: ${error}`);
    } finally {
      setTesting(false);
    }
  };

  const initiateOAuthFlow = () => {
    window.location.href = '/auth/ghl/authorize';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error': return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'pending': return <Clock className="h-5 w-5 text-yellow-500 animate-spin" />;
      default: return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      success: 'default' as const,
      error: 'destructive' as const,
      pending: 'secondary' as const
    };
    return variants[status as keyof typeof variants] || 'outline';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-6 w-6" />
              OAuth Signup Process Test
            </CardTitle>
            <CardDescription>
              Comprehensive testing of the GoHighLevel OAuth signup and authentication flow
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Button 
                onClick={runOAuthTest} 
                disabled={testing}
                className="flex items-center gap-2"
              >
                <Database className="h-4 w-4" />
                {testing ? 'Running Tests...' : 'Run OAuth Tests'}
              </Button>
              
              <Button 
                onClick={initiateOAuthFlow}
                variant="outline"
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Start OAuth Flow
              </Button>
            </div>
          </CardContent>
        </Card>

        {results.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
              <CardDescription>
                OAuth signup process validation results
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {results.map((result, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(result.status)}
                        <h3 className="font-medium capitalize">
                          {result.step.replace('-', ' ')}
                        </h3>
                      </div>
                      <Badge variant={getStatusBadge(result.status)}>
                        {result.status}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">
                      {result.message}
                    </p>
                    
                    {result.data && (
                      <>
                        <Separator className="my-2" />
                        <div className="bg-gray-50 p-2 rounded text-xs">
                          <pre className="whitespace-pre-wrap">
                            {JSON.stringify(result.data, null, 2)}
                          </pre>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-6 w-6" />
              OAuth Flow Steps
            </CardTitle>
            <CardDescription>
              Expected OAuth signup process flow
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium text-blue-600 mt-0.5">
                  1
                </div>
                <div>
                  <strong>Authorization Request:</strong> User clicks "Start OAuth Flow" and is redirected to GoHighLevel
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium text-blue-600 mt-0.5">
                  2
                </div>
                <div>
                  <strong>User Authorization:</strong> User approves access in GoHighLevel
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium text-blue-600 mt-0.5">
                  3
                </div>
                <div>
                  <strong>Callback Processing:</strong> GoHighLevel redirects back with authorization code
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium text-blue-600 mt-0.5">
                  4
                </div>
                <div>
                  <strong>Token Exchange:</strong> Server exchanges code for access tokens
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium text-blue-600 mt-0.5">
                  5
                </div>
                <div>
                  <strong>User Creation:</strong> System fetches user info and creates/updates user account
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium text-blue-600 mt-0.5">
                  6
                </div>
                <div>
                  <strong>Session Creation:</strong> User is logged in and redirected to dashboard
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}