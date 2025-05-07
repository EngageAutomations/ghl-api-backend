// This is a mock implementation without using actual Firebase
// It simulates the Firebase auth behavior for development purposes

// Mock user type
export type MockUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
};

// Mock auth interface
class MockAuth {
  currentUser: MockUser | null = null;
  
  // Mock sign in
  async signInWithEmailAndPassword(email: string, password: string): Promise<{user: MockUser}> {
    // Create a mock user
    const user: MockUser = {
      uid: "mock-user-123",
      email: email,
      displayName: email.split('@')[0],
    };
    
    this.currentUser = user;
    return { user };
  }
  
  // Mock sign out
  async signOut(): Promise<void> {
    this.currentUser = null;
  }
  
  // Set auth state change listener
  onAuthStateChanged(callback: (user: MockUser | null) => void): () => void {
    // Call the callback once with the current user
    callback(this.currentUser);
    
    // Return a function to unsubscribe
    return () => {};
  }
}

// Create and export the mock auth instance
export const auth = new MockAuth();

// We don't need these for the mock implementation, but we'll export empty
// objects to maintain compatibility with code that expects them
export const googleProvider = {};

// No app to export in the mock version
export default {};
