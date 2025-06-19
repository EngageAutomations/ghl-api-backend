import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: number;
  username: string;
  displayName: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log("AUTH PROVIDER - Initial Load");
    // Check for saved user in localStorage for development
    const savedMockUser = localStorage.getItem('mockUser');
    const savedUser = localStorage.getItem('user');
    
    console.log("Saved mock user in localStorage:", savedMockUser);
    console.log("Saved user in localStorage:", savedUser);
    
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
      } catch (e) {
        localStorage.removeItem('user');
      }
    } else {
      // For development, auto-login with a test user
      const mockUser = {
        id: 1,
        username: 'developer@test.com',
        displayName: 'Developer',
        email: 'developer@test.com'
      };
      setUser(mockUser);
      localStorage.setItem('user', JSON.stringify(mockUser));
    }
    
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        credentials: 'include'
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}