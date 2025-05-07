import { useState } from "react";
import { useConfig } from "@/context/ConfigContext";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Clipboard, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ConfigCard } from "../ui/config-card";
import { formatSubdomain } from "@/lib/utils";

export default function PortalDomainConfig() {
  const { config, updateConfig } = useConfig();
  const { toast } = useToast();
  const [verifying, setVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<"pending" | "success" | "failed">(
    config.domainVerified ? "success" : "pending"
  );
  
  const handleSubdomainChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedSubdomain = formatSubdomain(e.target.value);
    updateConfig({ portalSubdomain: formattedSubdomain });
  };
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      description: "Copied to clipboard!",
      duration: 2000,
    });
  };
  
  const verifyDomain = () => {
    setVerifying(true);
    
    // In a real implementation, this would make an API call to check DNS records
    setTimeout(() => {
      setVerifying(false);
      
      // Simulate verification success (random in this demo)
      const success = Math.random() > 0.5;
      setVerificationStatus(success ? "success" : "failed");
      
      if (success) {
        updateConfig({ domainVerified: true });
        toast({
          title: "Domain verified",
          description: "Your domain has been successfully verified.",
          duration: 3000,
        });
      } else {
        toast({
          title: "Verification failed",
          description: "Please check your DNS settings and try again.",
          variant: "destructive",
          duration: 5000,
        });
      }
    }, 2000);
  };
  
  return (
    <ConfigCard 
      title="Portal Domain Configuration"
      description="Configure a custom subdomain for your user portal"
    >
      <div className="space-y-6">
        {/* Domain Configuration */}
        <div className="space-y-2">
          <Label htmlFor="portal-subdomain">Portal Subdomain</Label>
          <div className="flex rounded-md shadow-sm">
            <Input 
              id="portal-subdomain"
              value={config.portalSubdomain || ""}
              onChange={handleSubdomainChange}
              placeholder="portal"
              className="flex-1 rounded-r-none"
            />
            <div className="inline-flex items-center px-3 border border-l-0 border-slate-300 bg-slate-50 text-slate-500 text-sm rounded-none">
              .yourdomain.com
            </div>
            <Button 
              variant="secondary" 
              className="rounded-l-none"
              onClick={verifyDomain}
              disabled={!config.portalSubdomain || verifying}
            >
              {verifying ? "Verifying..." : "Verify"}
            </Button>
          </div>
          <p className="text-xs text-slate-500">
            Enter the subdomain you want to use for your portal (e.g., portal.yourdomain.com)
          </p>
        </div>

        {/* DNS Configuration Instructions */}
        <div className="bg-slate-50 p-4 rounded-md border border-slate-200">
          <h3 className="text-base font-medium text-slate-800 mb-2">DNS Configuration Instructions</h3>
          <p className="text-sm text-slate-600 mb-4">
            To set up your custom subdomain, add the following CNAME record to your domain's DNS settings:
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
              <span className="text-slate-800">Host: {config.portalSubdomain || "portal"}</span>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => copyToClipboard(config.portalSubdomain || "portal")}
                className="text-primary-500 hover:text-primary-600 h-7 w-7"
              >
                <Clipboard className="h-4 w-4" />
              </Button>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-slate-800">Points to: portal.highlevel-directory.com</span>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => copyToClipboard("portal.highlevel-directory.com")}
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

        {/* Domain Verification Status */}
        <div className="flex items-center">
          {verificationStatus === "pending" && (
            <>
              <AlertTriangle className="text-amber-500 w-5 h-5 mr-2" />
              <span className="text-sm text-slate-700">
                Domain verification pending. Check back after DNS changes have propagated.
              </span>
            </>
          )}
          
          {verificationStatus === "success" && (
            <>
              <CheckCircle2 className="text-green-500 w-5 h-5 mr-2" />
              <span className="text-sm text-slate-700">
                Domain verified successfully. Your portal is now accessible at{" "}
                <a 
                  href={`https://${config.portalSubdomain}.yourdomain.com`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-500 hover:underline"
                >
                  {config.portalSubdomain}.yourdomain.com
                </a>
              </span>
            </>
          )}
          
          {verificationStatus === "failed" && (
            <>
              <AlertTriangle className="text-red-500 w-5 h-5 mr-2" />
              <span className="text-sm text-slate-700">
                Domain verification failed. Please check your DNS settings and try again.
              </span>
            </>
          )}
        </div>
      </div>
    </ConfigCard>
  );
}
