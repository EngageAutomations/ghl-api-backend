import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ExternalLink, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function OAuthTest() {
  const [oauthUrl, setOauthUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [tokens, setTokens] = useState<any>(null);

  const generateOAuthUrl = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/oauth/url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          state: `test_${Date.now()}`,
          scopes: ['contacts.read', 'contacts.write', 'locations.read']
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to generate OAuth URL: ${response.status}`);
      }

      const data = await response.json();
      setOauthUrl(data.authUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate OAuth URL');
    } finally {
      setIsLoading(false);
    }
  };

  const checkStoredTokens = () => {
    const storedTokens = localStorage.getItem('ghl_oauth_tokens');
    if (storedTokens) {
      try {
        const parsed = JSON.parse(storedTokens);
        setTokens(parsed);
      } catch (err) {
        setError('Invalid tokens in localStorage');
      }
    } else {
      setError('No tokens found in localStorage');
    }
  };

  const clearTokens = () => {
    localStorage.removeItem('ghl_oauth_tokens');
    setTokens(null);
    setError('');
  };

  const testAPICall = async () => {
    if (!tokens?.access_token) {
      setError('No access token available');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/ghl/test', {
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`API test failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('API test successful:', data);
      alert('API test successful! Check console for details.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'API test failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">GoHighLevel OAuth Integration Test</h1>
        <p className="text-muted-foreground">
          Test the complete OAuth flow with your GoHighLevel application credentials.
        </p>
      </div>

      <div className="grid gap-6">
        {/* OAuth URL Generation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5" />
              Step 1: Generate OAuth Authorization URL
            </CardTitle>
            <CardDescription>
              Generate the authorization URL to initiate the OAuth flow with GoHighLevel.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={generateOAuthUrl} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generate OAuth URL
            </Button>
            
            {oauthUrl && (
              <div className="space-y-3">
                <Badge variant="secondary" className="mb-2">
                  <CheckCircle className="mr-1 h-3 w-3" />
                  OAuth URL Generated
                </Badge>
                <div className="p-3 bg-muted rounded-md">
                  <p className="text-sm font-medium mb-2">Authorization URL:</p>
                  <p className="text-xs break-all text-muted-foreground">{oauthUrl}</p>
                </div>
                <Button asChild className="w-full">
                  <a href={oauthUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open OAuth Flow
                  </a>
                </Button>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    After completing the OAuth flow, you'll be redirected to the OAuth complete page. 
                    Return here to check the stored tokens.
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Token Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Step 2: Check OAuth Tokens
            </CardTitle>
            <CardDescription>
              Verify that OAuth tokens were successfully stored after completing the flow.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button onClick={checkStoredTokens} variant="outline" className="flex-1">
                Check Stored Tokens
              </Button>
              <Button onClick={clearTokens} variant="destructive" className="flex-1">
                Clear Tokens
              </Button>
            </div>
            
            {tokens && (
              <div className="space-y-3">
                <Badge variant="secondary">
                  <CheckCircle className="mr-1 h-3 w-3" />
                  Tokens Found
                </Badge>
                <div className="p-3 bg-muted rounded-md space-y-2">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium">Access Token:</p>
                      <p className="text-muted-foreground break-all">
                        {tokens.access_token ? `${tokens.access_token.substring(0, 20)}...` : 'Not available'}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">Token Type:</p>
                      <p className="text-muted-foreground">{tokens.token_type || 'Bearer'}</p>
                    </div>
                    <div>
                      <p className="font-medium">Expires In:</p>
                      <p className="text-muted-foreground">{tokens.expires_in || 'Unknown'} seconds</p>
                    </div>
                    <div>
                      <p className="font-medium">Scope:</p>
                      <p className="text-muted-foreground">{tokens.scope || 'Unknown'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* API Test */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Step 3: Test API Access
            </CardTitle>
            <CardDescription>
              Test making authenticated API calls to GoHighLevel using the stored tokens.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={testAPICall} 
              disabled={!tokens?.access_token || isLoading}
              className="w-full"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Test API Call
            </Button>
            
            {!tokens?.access_token && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Complete the OAuth flow first to get access tokens for API testing.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Configuration Info */}
        <Card>
          <CardHeader>
            <CardTitle>Configuration Information</CardTitle>
            <CardDescription>
              Current OAuth configuration details for debugging.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium">Client ID:</p>
                <p className="text-muted-foreground">68474924a586bce22a6e64f7-mbpkmyu4</p>
              </div>
              <div>
                <p className="font-medium">Redirect URI:</p>
                <p className="text-muted-foreground">https://dir.engageautomations.com/oauth-complete.html</p>
              </div>
              <div>
                <p className="font-medium">Authorization URL:</p>
                <p className="text-muted-foreground">https://marketplace.gohighlevel.com/oauth/chooselocation</p>
              </div>
              <div>
                <p className="font-medium">Token Endpoint:</p>
                <p className="text-muted-foreground">https://services.leadconnectorhq.com/oauth/token</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}