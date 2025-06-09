import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { Separator } from "@/components/ui/separator";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const authContext = useAuth();
  console.log('Auth context:', authContext);
  const { loginWithGHL } = authContext;
  
  // Check if user is already logged in
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      console.log("User found in localStorage, redirecting to dashboard");
      window.location.href = "/";
    }
  }, []);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!email || !password) {
      toast({
        title: "Missing Information",
        description: "Please enter both email and password",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // Clear any previous auth data
      localStorage.removeItem('user');
      
      // Direct API call without going through context
      console.log("Submitting login with:", email);
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          username: email,
          password: password
        }),
        credentials: "include"
      });
      
      if (response.ok) {
        const userData = await response.json();
        console.log("Login successful:", userData);
        
        // Save user data to localStorage
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Show success message
        toast({
          title: "Success!",
          description: "You've been successfully logged in.",
        });
        
        // Force a full page reload to dashboard
        window.location.href = "/";
      } else {
        // Handle error response
        const errorData = await response.json().catch(() => ({ message: "Authentication failed" }));
        throw new Error(errorData.message || `Authentication failed (${response.status})`);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Authentication error";
      setError(errorMessage);
      console.error("Login error:", err);
      
      toast({
        title: "Authentication Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="h-16 w-16 bg-primary rounded-xl flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
            HL
          </div>
          <h1 className="text-2xl font-heading font-bold text-slate-800">HighLevel Directory</h1>
          <p className="text-slate-500 mt-2">Sign in to access your directory configuration</p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Sign In</CardTitle>
            <CardDescription>
              Enter your email and password to sign in
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              
              {error && (
                <div className="text-sm text-red-500 mt-2">
                  {error}
                </div>
              )}
              
              <Button 
                type="submit" 
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Signing in...
                  </div>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
          </CardContent>
          
          <div className="px-6 pb-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-muted-foreground">Marketplace Installation</span>
              </div>
            </div>
          </div>
          
          <CardContent className="pt-0">
            <Button 
              onClick={() => {
                console.log('GoHighLevel OAuth button clicked');
                console.log('Redirecting to OAuth endpoint');
                window.location.href = '/auth/ghl/authorize';
              }}
              variant="outline" 
              className="w-full mb-4"
              type="button"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
              Test OAuth Flow
            </Button>
            
            <div className="text-center p-3 bg-amber-50 rounded-lg border border-amber-200">
              <p className="text-xs text-amber-700 mb-2">
                <strong>Note:</strong> This button tests the OAuth flow. In production, users are redirected here when they install your app from the GoHighLevel marketplace.
              </p>
              <div className="text-xs text-blue-600 bg-blue-50 rounded p-2">
                <strong>Test URL:</strong><br/>
                <code className="break-all">https://marketplace.gohighlevel.com/oauth/chooselocation?response_type=code&client_id=68474924a586bce22a6e64f7-mbpkmyu4&redirect_uri=https%3A%2F%2Fdir.engageautomations.com%2Foauth%2Fcallback&scope=contacts.read%20contacts.write%20locations.read&state=test123</code>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-center text-xs text-slate-500">
            <p>
              Use GoHighLevel OAuth for marketplace apps or traditional login for testing.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}