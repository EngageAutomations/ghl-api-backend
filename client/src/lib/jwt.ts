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
  // Railway backend uses JWT to identify the session
  const token = getJWT();
  return token ? { 'Authorization': `Bearer ${token}` } : { 'Authorization': 'Bearer replit-session' };
}

export function isAuthenticated(): boolean {
  return !!getJWT();
}

// Initialize JWT on app load - Railway backend identifies sessions with JWT
export function initializeAuth(): void {
  if (!getJWT() && import.meta.env.DEV) {
    // Set session identifier for Railway backend
    setJWT('replit-session');
    console.log('Replit session initialized for Railway backend');
  }
}