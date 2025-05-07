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
  const [mockUser, setMockUser] = useState<MockUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Login function that will be passed to the login page
  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log("Attempting login with:", email);
      
      // Generate a simple mock user first (for demo purposes)
      const mockUserData: MockUser = {
        uid: "mock-user-123",
        email: email,
        displayName: email.split('@')[0],
      };
      
      setMockUser(mockUserData);
      
      // Login with our backend - this will automatically create a user if needed
      console.log("Sending login request to backend");
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
        setUser(userData);
        return userData; // Return the user data for the login page to use
      } else {
        let errorMessage = "Failed to authenticate user";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          // Ignore JSON parsing errors
        }
        console.error("Authentication failed:", errorMessage);
        throw new Error(errorMessage);
      }
    } catch (err) {
      setMockUser(null);
      const errorMessage = err instanceof Error ? err.message : "Authentication error";
      setError(errorMessage);
      console.error("Auth error:", err);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  const logout = async () => {
    try {
      await signOutUser();
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
