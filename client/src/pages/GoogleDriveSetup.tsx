import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, AlertCircle, ExternalLink, Upload, Folder } from 'lucide-react';

interface GoogleDriveCredentials {
  id: number;
  email: string;
  folderName: string;
  isActive: boolean;
}

export default function GoogleDriveSetup() {
  const [folderName, setFolderName] = useState('Directory Images');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch current credentials
  const { data: credentials, isLoading } = useQuery<GoogleDriveCredentials>({
    queryKey: ['/api/google-drive/credentials'],
    retry: false
  });

  // Get auth URL
  const { data: authData } = useQuery<{ authUrl: string }>({
    queryKey: ['/api/google-drive/auth-url'],
    enabled: !credentials?.isActive
  });

  // Save credentials mutation
  const saveCredentialsMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/google-drive/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to save credentials');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/google-drive/credentials'] });
      toast({
        title: "Success",
        description: "Google Drive credentials saved successfully"
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save Google Drive credentials",
        variant: "destructive"
      });
    }
  });

  // Disconnect mutation
  const disconnectMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/google-drive/credentials', {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to disconnect');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/google-drive/credentials'] });
      toast({
        title: "Disconnected",
        description: "Google Drive has been disconnected"
      });
    }
  });

  // Handle OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');

    if (error) {
      toast({
        title: "Authorization Failed",
        description: "Google Drive authorization was denied",
        variant: "destructive"
      });
      return;
    }

    if (code) {
      // Exchange code for tokens and save credentials
      fetch('/api/google-drive/exchange-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, folderName })
      })
      .then(response => response.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        saveCredentialsMutation.mutate(data);
        // Clear URL parameters
        window.history.replaceState({}, document.title, window.location.pathname);
      })
      .catch(error => {
        toast({
          title: "Error",
          description: "Failed to complete Google Drive setup",
          variant: "destructive"
        });
      });
    }
  }, [folderName, saveCredentialsMutation, toast]);

  const handleConnect = () => {
    if (authData?.authUrl) {
      window.location.href = authData.authUrl;
    }
  };

  const handleDisconnect = () => {
    disconnectMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Google Drive Integration</h1>
        <p className="text-muted-foreground">
          Connect your Google Drive to automatically store and manage directory images
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Connection Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {credentials?.isActive ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-orange-500" />
              )}
              Connection Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {credentials?.isActive ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status</span>
                  <Badge className="bg-green-100 text-green-800">Connected</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Account</span>
                  <span className="text-sm text-muted-foreground">{credentials.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Folder</span>
                  <span className="text-sm text-muted-foreground">{credentials.folderName}</span>
                </div>
                <Separator />
                <Button 
                  variant="outline" 
                  onClick={handleDisconnect}
                  disabled={disconnectMutation.isPending}
                  className="w-full"
                >
                  Disconnect Google Drive
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status</span>
                  <Badge variant="secondary">Not Connected</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Connect your Google Drive to enable automatic image storage and management
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Setup Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Folder className="h-5 w-5" />
              Folder Configuration
            </CardTitle>
            <CardDescription>
              Choose where to store your directory images
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="folderName">Google Drive Folder Name</Label>
              <Input
                id="folderName"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                placeholder="Directory Images"
                disabled={credentials?.isActive}
              />
              <p className="text-xs text-muted-foreground">
                A folder with this name will be created in your Google Drive
              </p>
            </div>

            {!credentials?.isActive && (
              <Button 
                onClick={handleConnect}
                disabled={!authData?.authUrl}
                className="w-full"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Connect Google Drive
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Features Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Integration Features</CardTitle>
          <CardDescription>
            What you get with Google Drive integration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-start gap-3">
              <Upload className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <h4 className="font-medium">Automatic Upload</h4>
                <p className="text-sm text-muted-foreground">
                  Directory images are automatically uploaded to your Google Drive
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Folder className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <h4 className="font-medium">Organized Storage</h4>
                <p className="text-sm text-muted-foreground">
                  Files are organized in a dedicated folder with proper naming
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-purple-500 mt-0.5" />
              <div>
                <h4 className="font-medium">Backup & Sync</h4>
                <p className="text-sm text-muted-foreground">
                  Your images are safely backed up and accessible anywhere
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Setup Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">
                1
              </div>
              <div>
                <h4 className="font-medium">Configure Folder Name</h4>
                <p className="text-sm text-muted-foreground">
                  Choose a name for your Google Drive folder (default: "Directory Images")
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">
                2
              </div>
              <div>
                <h4 className="font-medium">Connect Google Drive</h4>
                <p className="text-sm text-muted-foreground">
                  Click "Connect Google Drive" and authorize the application
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">
                3
              </div>
              <div>
                <h4 className="font-medium">Start Using</h4>
                <p className="text-sm text-muted-foreground">
                  Once connected, all directory images will automatically sync to your Google Drive
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}