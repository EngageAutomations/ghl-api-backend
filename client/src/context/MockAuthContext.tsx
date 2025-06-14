import { createContext, useContext, ReactNode } from "react";
import { User } from "@shared/schema";

interface MockAuthContextType {
  user: User;
  isAuthenticated: true;
  loading: false;
  error: null;
}

const mockUser: User = {
  id: 1,
  username: "dev-user",
  ghlUserId: "mock_ghl_user_123",
  ghlAccessToken: "mock_access_token_abc123",
  ghlRefreshToken: "mock_refresh_token_xyz789",
  ghlLocationId: "mock_location_456",
  ghlLocationName: "Development Test Location",
  ghlScopes: ["products.write", "medias.write", "contacts.read", "contacts.write", "opportunities.read", "workflows.read"],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

const MockAuthContext = createContext<MockAuthContextType>({
  user: mockUser,
  isAuthenticated: true,
  loading: false,
  error: null,
});

export function MockAuthProvider({ children }: { children: ReactNode }) {
  console.log("🔧 Mock Auth Provider: Developer always logged in");
  
  return (
    <MockAuthContext.Provider value={{
      user: mockUser,
      isAuthenticated: true,
      loading: false,
      error: null,
    }}>
      {children}
    </MockAuthContext.Provider>
  );
}

export function useMockAuth() {
  return useContext(MockAuthContext);
}