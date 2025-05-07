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

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, loading, error, user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  // Effect to redirect if already logged in
  useEffect(() => {
    console.log("LOGIN PAGE DEBUG - Auth Check");
    console.log("Current user state:", user);
    console.log("localStorage user:", localStorage.getItem('user'));
    
    if (user) {
      console.log("User already logged in, redirecting to dashboard...");
      console.log("User details:", user.username || user.email);
      
      // Force navigation to dashboard
      navigate("/");
    } else {
      console.log("No user detected in login page");
    }
  }, [user, navigate]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Missing Information",
        description: "Please enter both email and password",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Clear any existing data to avoid conflicts
      localStorage.removeItem('user');
      localStorage.removeItem('mockUser');
      
      console.log("Submitting login form with:", email);
      const userData = await login(email, password);
      
      // Show success message
      toast({
        title: "Success!",
        description: "You've been successfully logged in.",
      });
      
      console.log("Login successful, userData:", userData);
      
      // Ensure data is properly saved to localStorage
      console.log("After login - localStorage user:", localStorage.getItem('user'));
      
      // Wait briefly for state to update
      setTimeout(() => {
        console.log("Navigating to dashboard after login...");
        // Force navigation to dashboard
        window.location.href = "/";
      }, 500);
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Authentication Error",
        description: error instanceof Error ? error.message : "Failed to sign in",
        variant: "destructive",
      });
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
