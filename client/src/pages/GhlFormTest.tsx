import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

export default function GhlFormTest() {
  const { toast } = useToast();
  const [listingSlug, setListingSlug] = useState("sample-listing");
  const [formUrl, setFormUrl] = useState("");
  const [showIframe, setShowIframe] = useState(false);
  const [hostUrl, setHostUrl] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Set default GHL form URL (replace with your actual default)
    setFormUrl("https://forms.engageautomations.com/form/21bd7262-e20a-4b6e-8e3d-96685b9fd9b7");
    
    // Get current host
    setHostUrl(window.location.origin);
  }, []);

  // Loading the GHL form with parameters
  const loadForm = () => {
    setLoading(true);
    setShowIframe(false);
    
    // Short delay to simulate loading and allow state to update
    setTimeout(() => {
      setShowIframe(true);
      setLoading(false);
      
      toast({
        title: "Form loaded",
        description: "Test form loaded with listing parameters",
      });
    }, 500);
  };

  // Reset the form
  const resetForm = () => {
    setShowIframe(false);
    toast({
      title: "Form reset",
      description: "Test form has been reset",
    });
  };

  // Build the test URL with parameters
  const buildTestUrl = () => {
    try {
      const url = new URL(formUrl);
      url.searchParams.set("listing_id", listingSlug);
      url.searchParams.set("listing_title", listingSlug.replace(/-/g, " "));
      url.searchParams.set("utm_source", "directory");
      url.searchParams.set("utm_medium", "test");
      url.searchParams.set("utm_campaign", "ghl_integration");
      
      return url.toString();
    } catch (error) {
      console.error("Error building URL:", error);
      return formUrl;
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">GHL Form Test Page</h1>
        <p className="text-muted-foreground mb-6">
          This page allows you to test how your Go HighLevel forms integrate with listings and capture parameters.
        </p>

        <div className="grid grid-cols-1 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Test Parameters</CardTitle>
              <CardDescription>
                Configure the test parameters for your GHL form integration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="listing-slug">Listing Slug</Label>
                    <Input
                      id="listing-slug"
                      value={listingSlug}
                      onChange={(e) => setListingSlug(e.target.value)}
                      placeholder="example-listing"
                    />
                    <p className="text-xs text-muted-foreground">
                      The slug identifier for your listing (e.g., sample-listing)
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="form-url">GHL Form URL</Label>
                    <Input
                      id="form-url"
                      value={formUrl}
                      onChange={(e) => setFormUrl(e.target.value)}
                      placeholder="https://forms.engageautomations.com/form/your-form-id"
                    />
                    <p className="text-xs text-muted-foreground">
                      The URL of your Go HighLevel form to test
                    </p>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="space-y-2">
                  <Label>Will Pass These Parameters:</Label>
                  <div className="bg-slate-50 p-3 rounded-md text-sm font-mono">
                    <div>listing_id: <span className="text-green-600">{listingSlug}</span></div>
                    <div>listing_title: <span className="text-green-600">{listingSlug.replace(/-/g, " ")}</span></div>
                    <div>utm_source: <span className="text-green-600">directory</span></div>
                    <div>utm_medium: <span className="text-green-600">test</span></div>
                    <div>utm_campaign: <span className="text-green-600">ghl_integration</span></div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Button onClick={loadForm} disabled={loading} className="flex-1">
                    {loading ? "Loading..." : "Load Test Form"}
                  </Button>
                  <Button onClick={resetForm} variant="outline" className="flex-1">
                    Reset
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Form Display Area */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Form Preview</h2>
          
          {!showIframe ? (
            <Card className="border-dashed border-2 bg-slate-50">
              <CardContent className="p-10 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <p className="mb-2">Form preview will appear here</p>
                  <p className="text-sm">Click "Load Test Form" to see the GHL form with parameters</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="border rounded-md h-[600px] relative">
              <iframe
                src={buildTestUrl()}
                className="w-full h-full border-0"
                title="GHL Form Test"
              />
            </div>
          )}
        </div>

        {/* Integration Instructions */}
        <div className="mt-12 mb-8">
          <h2 className="text-xl font-semibold mb-4">How to Test Your GHL Integration</h2>
          
          <div className="bg-slate-50 p-6 rounded-lg">
            <ol className="list-decimal list-inside space-y-3">
              <li className="text-slate-800">Enter your listing slug and GHL form URL above</li>
              <li className="text-slate-800">Click "Load Test Form" to see the form with parameters</li>
              <li className="text-slate-800">Submit the form with test data</li>
              <li className="text-slate-800">
                Check your GHL dashboard to verify the parameters were captured correctly
              </li>
              <li className="text-slate-800">
                For full integration, use our embed code on your GHL hosted pages:
                <div className="bg-slate-100 p-3 mt-2 rounded-md text-sm font-mono">
                  {`<!-- Directory Integration -->`}<br />
                  {`<script id="ghl-directory-config" type="application/json">`}<br />
                  {`  { "customFormFieldName": "listing_id" }`}<br />
                  {`</script>`}<br />
                  {`<script src="${hostUrl}/ghl-embed-code.js"></script>`}
                </div>
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}