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
      
      // Generate a simple mock user
      const mockUserData: MockUser = {
        uid: "mock-user-123",
        email: email,
        displayName: email.split('@')[0],
      };
      
      setMockUser(mockUserData);
      
      // Login with our backend - this will automatically create a user if needed
      const response = await apiRequest(
        "POST", 
        "/api/auth/login", 
        { 
          username: email,
          password: password
        }
      );
      
      if (response.ok) {
        const userData = await response.json();
        console.log("Login successful, user data:", userData);
        setUser(userData);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to authenticate user");
      }
    } catch (err) {
      setMockUser(null);
      setError(err instanceof Error ? err.message : "Authentication error");
      console.error("Auth error:", err);
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
