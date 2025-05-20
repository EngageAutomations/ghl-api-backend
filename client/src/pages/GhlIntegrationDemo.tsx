import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { Link } from "wouter";

const GhlIntegrationDemo = () => {
  const { toast } = useToast();
  const [hostUrl, setHostUrl] = useState("");

  useEffect(() => {
    // Get the current host URL
    setHostUrl(window.location.origin);
  }, []);

  const copyToClipboard = (text: string, message: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied!",
        description: message,
      });
    });
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Go HighLevel Integration</h1>
      <p className="text-lg mb-8">
        Use this integration to connect your Go HighLevel forms with your marketplace listings.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <Card>
          <CardHeader>
            <CardTitle>Embed Code</CardTitle>
            <CardDescription>
              Copy this code into your Go HighLevel pages to enable listing tracking
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-slate-100 p-4 rounded-md mb-4 overflow-x-auto">
              <pre className="text-sm">
                {`<!-- Directory to GHL Integration -->
<script id="ghl-directory-config" type="application/json">
{
  "customFormFieldName": "listing_id",
  "enableEmbeddedForm": true
}
</script>
<script src="${hostUrl}/ghl-embed-code.js"></script>`}
              </pre>
            </div>
            <Button 
              onClick={() => 
                copyToClipboard(
                  `<!-- Directory to GHL Integration -->
<script id="ghl-directory-config" type="application/json">
{
  "customFormFieldName": "listing_id",
  "enableEmbeddedForm": true
}
</script>
<script src="${hostUrl}/ghl-embed-code.js"></script>`,
                  "Embed code copied to clipboard"
                )
              }
              className="w-full"
            >
              Copy Embed Code
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Testing Your Integration</CardTitle>
            <CardDescription>
              Follow these steps to test your GHL integration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal pl-5 space-y-2 mb-4">
              <li>Copy the embed code to your GHL page</li>
              <li>Add a custom field called "listing_id" to your GHL form</li>
              <li>Enable "Capture URL Parameters" in GHL form settings</li>
              <li>Test with a URL like: <code className="text-xs bg-slate-100 p-1 rounded">/product-details/product/your-listing-slug</code></li>
            </ol>
            <Button asChild className="w-full">
              <Link href="/docs/ghl-integration">View Full Documentation</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Sample Test URLs</CardTitle>
            <CardDescription>
              Use these URLs to test your integration with sample listings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* These would be your actual test listings */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 border rounded-md">
                <div>
                  <h3 className="font-medium">Photography Studio</h3>
                  <p className="text-sm text-slate-500">Test URL with category: photography</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => 
                    copyToClipboard(
                      `${hostUrl}/product-details/product/photography-studio?utm_source=test`,
                      "Test URL copied"
                    )
                  }
                >
                  Copy URL
                </Button>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 border rounded-md">
                <div>
                  <h3 className="font-medium">Web Design Agency</h3>
                  <p className="text-sm text-slate-500">Test URL with category: web-design</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => 
                    copyToClipboard(
                      `${hostUrl}/product-details/product/web-design-agency?utm_source=test`,
                      "Test URL copied"
                    )
                  }
                >
                  Copy URL
                </Button>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 border rounded-md">
                <div>
                  <h3 className="font-medium">Marketing Consultant</h3>
                  <p className="text-sm text-slate-500">Test URL with category: marketing</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => 
                    copyToClipboard(
                      `${hostUrl}/product-details/product/marketing-consultant?utm_source=test`,
                      "Test URL copied"
                    )
                  }
                >
                  Copy URL
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GhlIntegrationDemo;