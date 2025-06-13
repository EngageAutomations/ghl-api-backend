import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShieldCheck, Download, ExternalLink, ArrowRight } from 'lucide-react';

export default function InstallationRequired() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <ShieldCheck className="h-12 w-12 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Installation Required</CardTitle>
          <CardDescription>
            This app needs to be installed from the GoHighLevel Marketplace
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Download className="h-4 w-4" />
            <AlertDescription>
              To access this application, please install it from your GoHighLevel account marketplace.
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <h3 className="font-medium">How to install:</h3>
            <ol className="text-sm space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="bg-blue-100 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mt-0.5">1</span>
                Log into your GoHighLevel account
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-blue-100 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mt-0.5">2</span>
                Go to Settings → Integrations → Marketplace
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-blue-100 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mt-0.5">3</span>
                Search for and install this application
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-blue-100 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mt-0.5">4</span>
                Access the app from your GoHighLevel CRM tab
              </li>
            </ol>
          </div>

          <div className="pt-4">
            <Button asChild className="w-full">
              <a 
                href="https://app.gohighlevel.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2"
              >
                Open GoHighLevel
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>

          <div className="text-center text-sm text-muted-foreground">
            Once installed, you'll be automatically redirected to the app interface
          </div>
        </CardContent>
      </Card>
    </div>
  );
}