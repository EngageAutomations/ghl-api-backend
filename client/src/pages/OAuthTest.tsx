import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function OAuthTest() {
  const { toast } = useToast();
  
  const clientId = "68474924a586bce22a6e64f7-mbpkmyu4";
  const redirectUri = "https://dir.engageautomations.com/oauth/callback";
  const state = "test123";
  const scope = "contacts.read contacts.write locations.read";
  
  const authUrl = `https://api.leadconnectorhq.com/oauth/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=${state}`;
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "Authorization URL copied successfully"
    });
  };
  
  return (
    <div className="container mx-auto p-6">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="w-5 h-5" />
            GoHighLevel OAuth Test
          </CardTitle>
          <CardDescription>
            Test the OAuth flow by opening the authorization URL while logged into HighLevel
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2">Configuration</h3>
            <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
              <div><strong>Client ID:</strong> {clientId}</div>
              <div><strong>Redirect URI:</strong> {redirectUri}</div>
              <div><strong>Scope:</strong> {scope}</div>
              <div><strong>State:</strong> {state}</div>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold mb-2">Authorization URL</h3>
            <div className="bg-blue-50 p-4 rounded-lg border">
              <code className="text-sm break-all text-blue-800">{authUrl}</code>
            </div>
            
            <div className="flex gap-2 mt-3">
              <Button 
                onClick={() => copyToClipboard(authUrl)}
                variant="outline"
                size="sm"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy URL
              </Button>
              
              <Button 
                onClick={() => window.open(authUrl, '_blank')}
                size="sm"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open in New Tab
              </Button>
            </div>
          </div>
          
          <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
            <h4 className="font-semibold text-amber-800 mb-2">Testing Instructions</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-amber-700">
              <li>Make sure you're logged into a HighLevel account</li>
              <li>Click "Open in New Tab" or copy the URL and paste it in a browser</li>
              <li>Authorize the application when prompted</li>
              <li>You'll be redirected to: <code>https://dir.engageautomations.com/oauth/callback</code></li>
              <li>Check the server logs for token exchange details</li>
            </ol>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h4 className="font-semibold text-green-800 mb-2">Expected Flow</h4>
            <div className="text-sm text-green-700 space-y-1">
              <div>✅ Redirect to HighLevel authorization page</div>
              <div>✅ User authorizes the application</div>
              <div>✅ Redirect back with authorization code</div>
              <div>✅ Exchange code for access token</div>
              <div>✅ Get user info and create/update user account</div>
              <div>✅ Redirect to dashboard with active session</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}