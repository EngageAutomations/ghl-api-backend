import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { auth, MockUser } from "@/lib/firebase";
import { signOutUser } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { User } from "@shared/schema";

interface AuthContextType {
  user: User | null;
  mockUser: MockUser | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithGHL: () => void;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  mockUser: null,
  loading: false,
  error: null,
  login: async () => {},
  loginWithGHL: () => {},
  logout: async () => {},
  checkAuthStatus: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true); // Start with loading true
  const [error, setError] = useState<string | null>(null);
  
  // Initialize state from localStorage if available
  const [mockUser, setMockUser] = useState<MockUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  
  // Effect to load user from localStorage on mount
  useEffect(() => {
    try {
      // Load saved authentication from localStorage
      const savedMockUser = localStorage.getItem('mockUser');
      const savedUser = localStorage.getItem('user');
      
      console.log("AUTH PROVIDER - Initial Load");
      console.log("Saved mock user in localStorage:", savedMockUser);
      console.log("Saved user in localStorage:", savedUser);
      
      // Set state from localStorage
      if (savedMockUser) {
        setMockUser(JSON.parse(savedMockUser));
      }
      
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (err) {
      console.error("Error loading auth from localStorage:", err);
    } finally {
      // Set loading to false once we've loaded from localStorage
      setLoading(false);
    }
  }, []);
  
  // Login function that will be passed to the login page
  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log("Attempting login with:", email);
      
      // Set a mock user temporarily (for testing)
      const mockUserData: MockUser = {
        uid: "mock-user-123",
        email: email,
        displayName: email.split('@')[0],
      };
      
      setMockUser(mockUserData);
      
      // Make direct fetch request to login API
      console.log("Sending login request to backend");
      try {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            username: email,
            password: password
          }),
          credentials: "include"
        });
        
        console.log("Login response status:", response.status);
        
        if (response.ok) {
          const userData = await response.json();
          console.log("Login successful, user data:", userData);
          
          // Save user data to localStorage for persistence
          localStorage.setItem('user', JSON.stringify(userData));
          localStorage.setItem('mockUser', JSON.stringify(mockUserData));
          
          // Set the user data in state - this will trigger redirects in components
          setUser(userData);
          return userData;
        } else {
          // Handle error response
          try {
            const errorData = await response.json();
            throw new Error(errorData.message || "Authentication failed");
          } catch (parseError) {
            throw new Error(`Authentication failed (${response.status})`);
          }
        }
      } catch (fetchError) {
        console.error("Fetch error:", fetchError);
        throw fetchError;
      }
    } catch (err) {
      // Clear mock user on error
      setMockUser(null);
      
      // Set error state
      const errorMessage = err instanceof Error ? err.message : "Authentication error";
      setError(errorMessage);
      console.error("Auth error:", err);
      
      // Re-throw for the login component to handle
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  const loginWithGHL = () => {
    console.log('OAuth login initiated');
    window.location.href = '/auth/ghl/authorize';
  };

  const checkAuthStatus = async () => {
    try {
      // First, check for OAuth installation ID in URL params or localStorage
      const urlParams = new URLSearchParams(window.location.search);
      const installationId = urlParams.get('installation_id') || localStorage.getItem('oauth_installation_id');
      
      console.log('Checking auth status, installation ID:', installationId);
      
      if (installationId) {
        // Use OAuth status endpoint with proper GoHighLevel API call
        const response = await fetch(`/api/oauth/status?installation_id=${installationId}`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('OAuth status response:', data);
          
          if (data.success && data.user) {
            const userData = {
              id: data.installation.id,
              username: data.user.email || data.user.name,
              email: data.user.email,
              displayName: data.user.name,
              ghlUserId: data.user.id,
              ghlLocationId: data.installation.locationId,
              ghlLocationName: data.installation.locationName,
              authType: 'oauth',
              isActive: true
            };
            
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
            localStorage.setItem('oauth_installation_id', installationId);
            console.log('OAuth user authenticated successfully');
            return;
          }
        } else {
          const errorData = await response.json();
          console.error('OAuth status check failed:', errorData);
          if (errorData.error === 'user_info_failed') {
            console.log('User info retrieval failed, clearing OAuth state');
            localStorage.removeItem('oauth_installation_id');
          }
        }
      }
      
      // Fallback to regular auth check
      const response = await fetch('/api/auth/me', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
      } else {
        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('oauth_installation_id');
      }
    } catch (error) {
      console.error('Auth status check error:', error);
      setUser(null);
      localStorage.removeItem('user');
      localStorage.removeItem('oauth_installation_id');
    }
  };

  const logout = async () => {
    try {
      // Check if user is OAuth authenticated
      if (user?.authType === 'oauth') {
        await apiRequest('/auth/ghl/logout', { method: 'POST' });
      } else {
        await signOutUser();
      }
      
      // Clear localStorage
      localStorage.removeItem('user');
      localStorage.removeItem('mockUser');
      
      // Clear state
      setMockUser(null);
      setUser(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Logout error");
      // Clear state anyway on logout error
      setUser(null);
      setMockUser(null);
      localStorage.removeItem('user');
      localStorage.removeItem('mockUser');
    }
  };

  // Check OAuth status on mount
  useEffect(() => {
    if (!user && !mockUser) {
      checkAuthStatus();
    }
  }, []);
  
  return (
    <AuthContext.Provider value={{ 
      user, 
      mockUser, 
      loading, 
      error, 
      login, 
      loginWithGHL, 
      logout, 
      checkAuthStatus 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
