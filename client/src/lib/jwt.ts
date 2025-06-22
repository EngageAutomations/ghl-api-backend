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
  const token = getJWT();
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

export function isAuthenticated(): boolean {
  return !!getJWT();
}

// Initialize JWT on app load - this would be set during OAuth flow
export function initializeAuth(): void {
  // For development, set a mock JWT or retrieve from OAuth callback
  if (!getJWT() && import.meta.env.DEV) {
    // In production, this would be set by OAuth callback
    console.log('JWT authentication required for Railway backend');
  }
}