import { auth, MockUser } from "./firebase";
import { apiRequest } from "./queryClient";

// Simple email/password login
export const signInWithEmail = async (email: string, password: string) => {
  try {
    const result = await auth.signInWithEmailAndPassword(email, password);
    return result.user;
  } catch (error) {
    console.error("Error signing in:", error);
    throw error;
  }
};

// Sign out
export const signOutUser = async () => {
  try {
    await auth.signOut();
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};

// Register user in our backend
export const registerUser = async (userData: {
  username: string;
  password: string;
  displayName?: string;
  email?: string;
}) => {
  const response = await apiRequest("/api/auth/register", {
    method: "POST",
    data: userData
  });
  return response.json();
};

// Login user in our backend
export const loginUser = async (credentials: {
  username: string;
  password: string;
}) => {
  const response = await apiRequest("/api/auth/login", {
    method: "POST",
    data: credentials
  });
  return response.json();
};
