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
  const { loginWithGHL } = useAuth();
  
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
          <CardFooter className="flex justify-center text-xs text-slate-500">
            <p>
              For demo use: Enter any email and password. New users will be automatically registered.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}