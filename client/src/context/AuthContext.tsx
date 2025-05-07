import { createContext, useContext, useState, ReactNode } from "react";
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
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  mockUser: null,
  loading: false,
  error: null,
  login: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  // Initialize state from localStorage if available
  const [mockUser, setMockUser] = useState<MockUser | null>(() => {
    const saved = localStorage.getItem('mockUser');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
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
  
  const logout = async () => {
    try {
      await signOutUser();
      
      // Clear localStorage
      localStorage.removeItem('user');
      localStorage.removeItem('mockUser');
      
      // Clear state
      setMockUser(null);
      setUser(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Logout error");
    }
  };
  
  return (
    <AuthContext.Provider value={{ user, mockUser, loading, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
