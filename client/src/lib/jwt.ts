/**
 * JWT Authentication for Railway Backend
 * Manages session tokens for authenticated API calls
 */

export function getJWT(): string | null {
  return sessionStorage.getItem('jwt');
}

export function setJWT(token: string): void {
  sessionStorage.setItem('jwt', token);
}

export function clearJWT(): void {
  sessionStorage.removeItem('jwt');
}

export function authHeader(): Record<string, string> {
  // For Railway backend, we don't need JWT in development
  // The backend handles authentication through stored OAuth tokens
  return {};
}

export function isAuthenticated(): boolean {
  return !!getJWT();
}

// Initialize JWT on app load - this would be set during OAuth flow
export function initializeAuth(): void {
  // For development, set a test JWT to enable Railway backend testing
  if (!getJWT() && import.meta.env.DEV) {
    // Set a test JWT for development Railway backend integration
    setJWT('test-railway-jwt-token');
    console.log('Development JWT set for Railway backend testing');
  }
}