import { useState, useEffect } from "react";
import { useConfig } from "@/context/ConfigContext";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Clipboard, AlertTriangle, CheckCircle2, Plus, Link2, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ConfigCard } from "../ui/config-card";
import { formatSubdomain } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Sample directory data structure - in a real app, this would come from a database
interface Directory {
  id: number;
  name: string;
  websiteName?: string;
  domainVerified?: boolean;
  connectionInfo?: {
    subdomain: string;
    domain: string;
  };
}

export default function PortalDomainConfig() {
  const { config } = useConfig();
  const { toast } = useToast();
  const [directories, setDirectories] = useState<Directory[]>([]);
  const [selectedDirectory, setSelectedDirectory] = useState<Directory | null>(null);
  const [isConnectDialogOpen, setIsConnectDialogOpen] = useState(false);
  
  // For website name input
  const [websiteName, setWebsiteName] = useState("");
  
  // For DNS connection settings
  const [subdomain, setSubdomain] = useState("");
  const [verifying, setVerifying] = useState(false);
  
  // Load saved directories
  useEffect(() => {
    // In a real implementation, this would fetch from an API or database
    // For now, we'll just check if we have a directory name in config
    if (config.directoryName) {
      const existingIndex = directories.findIndex(dir => dir.name === config.directoryName);
      
      if (existingIndex === -1) {
        // Add the directory if it doesn't exist yet
        setDirectories(prev => [
          ...prev, 
          { 
            id: Date.now(), 
            name: config.directoryName || "",
            websiteName: "",
            domainVerified: false
          }
        ]);
      }
    }
  }, [config.directoryName]);
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      description: "Copied to clipboard!",
      duration: 2000,
    });
  };
  
  const handleSaveWebsiteName = (directory: Directory) => {
    setDirectories(prev => 
      prev.map(dir => 
        dir.id === directory.id 
          ? { ...dir, websiteName } 
          : dir
      )
    );
    
    toast({
      title: "Website name saved",
      description: "Website name has been updated for this directory.",
    });
    
    setWebsiteName("");
  };
  
  const handleConnect = (directory: Directory) => {
    setSelectedDirectory(directory);
    setSubdomain(formatSubdomain(directory.name || ""));
    setIsConnectDialogOpen(true);
  };
  
  const handleVerifyDomain = () => {
    if (!selectedDirectory) return;
    setVerifying(true);
    
    // In a real implementation, this would make an API call to check DNS records
    setTimeout(() => {
      setVerifying(false);
      
      // Simulate verification success
      const success = true; // Set to true for demo
      
      if (success) {
        setDirectories(prev => 
          prev.map(dir => 
            dir.id === selectedDirectory.id 
              ? { 
                  ...dir, 
                  domainVerified: true,
                  connectionInfo: {
                    subdomain,
                    domain: "yourdomain.com"
                  }
                } 
              : dir
          )
        );
        
        toast({
          title: "Domain verified",
          description: "Your domain has been successfully verified.",
        });
        
        setIsConnectDialogOpen(false);
      } else {
        toast({
          title: "Verification failed",
          description: "Please check your DNS settings and try again.",
          variant: "destructive",
        });
      }
    }, 1500);
  };
  
  return (
    <div className="space-y-6">
      <ConfigCard 
        title="Directory Domains"
      >
        <div className="space-y-6">
          <p className="text-sm text-slate-600">
            Connect your directories to custom domains to create branded marketplace experiences.
            Save a directory in the Listing & Styling tab to make it available here.
          </p>
          
          {/* Directory List */}
          {directories.length === 0 ? (
            <div className="bg-slate-50 p-6 rounded-md border border-slate-200 text-center">
              <h3 className="text-base font-medium text-slate-700 mb-2">No Directories Available</h3>
              <p className="text-sm text-slate-500 mb-4">
                Create and save a directory in the Listing & Styling tab first.
              </p>
              <Button variant="outline">
                <Link2 className="mr-2 h-4 w-4" />
                Go to Listing & Styling
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {directories.map(directory => (
                <Card key={directory.id} className="border-slate-200">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle className="text-lg">{directory.name}</CardTitle>
                        {directory.websiteName && (
                          <CardDescription>Website: {directory.websiteName}</CardDescription>
                        )}
                      </div>
                      {directory.domainVerified && (
                        <div className="flex items-center text-green-600 text-sm font-medium">
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Connected
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pb-2">
                    {!directory.websiteName ? (
                      <div className="flex items-end gap-3">
                        <div className="flex-1">
                          <Label htmlFor={`website-name-${directory.id}`} className="text-sm mb-1 block">
                            Website Name
                          </Label>
                          <Input 
                            id={`website-name-${directory.id}`}
                            placeholder="Enter website name"
                            value={websiteName}
                            onChange={(e) => setWebsiteName(e.target.value)}
                          />
                        </div>
                        <Button 
                          onClick={() => handleSaveWebsiteName(directory)}
                          disabled={!websiteName.trim()}
                        >
                          Save
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {directory.domainVerified ? (
                          <div className="text-sm">
                            <span className="text-slate-500">Domain:</span>{" "}
                            <span className="font-medium">
                              {directory.connectionInfo?.subdomain}.{directory.connectionInfo?.domain}
                            </span>
                          </div>
                        ) : (
                          <p className="text-sm text-slate-600">
                            Add a domain connection to make your marketplace accessible at your own domain.
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                  
                  <CardFooter className="flex justify-end">
                    {directory.websiteName && !directory.domainVerified && (
                      <Button onClick={() => handleConnect(directory)}>
                        <Link2 className="mr-2 h-4 w-4" />
                        Connect Domain
                      </Button>
                    )}
                    
                    {directory.domainVerified && (
                      <Button variant="outline" size="sm">
                        <Settings className="mr-2 h-4 w-4" />
                        Manage
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </ConfigCard>
      
      {/* Domain Connection Dialog */}
      <Dialog open={isConnectDialogOpen} onOpenChange={setIsConnectDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Connect Domain</DialogTitle>
            <DialogDescription>
              Set up DNS records to connect your domain to this directory
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Domain Configuration */}
            <div className="space-y-2">
              <Label htmlFor="portal-subdomain">Subdomain</Label>
              <div className="flex rounded-md shadow-sm">
                <Input 
                  id="portal-subdomain"
                  value={subdomain}
                  onChange={(e) => setSubdomain(formatSubdomain(e.target.value))}
                  placeholder="directory"
                  className="flex-1 rounded-r-none"
                />
                <div className="inline-flex items-center px-3 border border-l-0 border-slate-300 bg-slate-50 text-slate-500 text-sm rounded-none">
                  .yourdomain.com
                </div>
                <Button 
                  variant="secondary" 
                  className="rounded-l-none"
                  onClick={handleVerifyDomain}
                  disabled={!subdomain || verifying}
                >
                  {verifying ? "Verifying..." : "Verify"}
                </Button>
              </div>
              <p className="text-xs text-slate-500">
                Enter the subdomain where you want your directory to be accessible
              </p>
            </div>

            {/* DNS Configuration Instructions */}
            <div className="bg-slate-50 p-4 rounded-md border border-slate-200">
              <h3 className="text-base font-medium text-slate-800 mb-2">DNS Configuration Instructions</h3>
              <p className="text-sm text-slate-600 mb-4">
                To connect your domain, add the following CNAME record to your domain's DNS settings:
              </p>
              
              <div className="bg-white p-3 rounded border border-slate-300 font-mono text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-800">Type: CNAME</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => copyToClipboard("CNAME")}
                    className="text-primary-500 hover:text-primary-600 h-7 w-7"
                  >
                    <Clipboard className="h-4 w-4" />
                  </Button>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-slate-800">Host: {subdomain}</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => copyToClipboard(subdomain)}
                    className="text-primary-500 hover:text-primary-600 h-7 w-7"
                  >
                    <Clipboard className="h-4 w-4" />
                  </Button>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-slate-800">Points to: directory.gohighlevel.com</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => copyToClipboard("directory.gohighlevel.com")}
                    className="text-primary-500 hover:text-primary-600 h-7 w-7"
                  >
                    <Clipboard className="h-4 w-4" />
                  </Button>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-slate-800">TTL: 3600 (or Auto)</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => copyToClipboard("3600")}
                    className="text-primary-500 hover:text-primary-600 h-7 w-7"
                  >
                    <Clipboard className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <p className="mt-4 text-sm text-slate-600">
                After adding the DNS record, it may take up to 48 hours for the changes to propagate.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConnectDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleVerifyDomain} disabled={!subdomain || verifying}>
              {verifying ? "Verifying..." : "Verify Connection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
