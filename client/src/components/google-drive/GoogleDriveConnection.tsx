import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, HardDrive, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface GoogleDriveConnectionProps {
  onConnected: (tokens: any) => void;
  isConnected: boolean;
}

export function GoogleDriveConnection({ onConnected, isConnected }: GoogleDriveConnectionProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Listen for OAuth callback messages
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
        setIsConnecting(false);
        onConnected(event.data.tokens);
        toast({
          title: "Connected to Google Drive!",
          description: "Your images will now be stored in your Google Drive account.",
        });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onConnected, toast]);

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      
      // Get the OAuth URL from the server
      const response = await fetch('/auth/google');
      const { authUrl } = await response.json();
      
      // Open OAuth popup
      const popup = window.open(
        authUrl,
        'google-oauth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );

      // Check if popup was blocked
      if (!popup) {
        throw new Error('Popup blocked');
      }

      // Monitor popup closure without authentication
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          setIsConnecting(false);
        }
      }, 1000);

    } catch (error) {
      setIsConnecting(false);
      toast({
        title: "Connection Failed",
        description: "Unable to connect to Google Drive. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Card className="border-2">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <HardDrive className="h-12 w-12 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Connect Your Google Drive</CardTitle>
          <CardDescription className="text-lg">
            Store your directory images securely in your own Google Drive account
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">


          {/* Privacy Notice */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-green-900">Privacy & Security</h4>
                <p className="text-green-800 text-sm mt-1">
                  We only access files that our app creates. Your existing Google Drive files remain private and untouched.
                </p>
              </div>
            </div>
          </div>

          {/* Connection Status */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className={`h-3 w-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span className="font-medium">
                {isConnected ? 'Connected to Google Drive' : 'Not connected'}
              </span>
            </div>
            {isConnected && (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Ready
              </Badge>
            )}
          </div>

          {/* Connect Button */}
          <div className="text-center">
            {!isConnected ? (
              <Button 
                onClick={handleConnect} 
                disabled={isConnecting}
                size="lg"
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <HardDrive className="mr-2 h-5 w-5" />
                    Connect Google Drive
                  </>
                )}
              </Button>
            ) : (
              <div className="text-center text-green-600 font-medium">
                ✓ Google Drive connected successfully!
              </div>
            )}
          </div>

          {/* Next Steps */}
          {isConnected && (
            <div className="text-center text-sm text-gray-600">
              You can now proceed to configure your directory settings.
              All images will be automatically stored in your Google Drive.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}