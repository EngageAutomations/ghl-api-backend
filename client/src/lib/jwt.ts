/**
 * JWT Authentication helpers for Railway backend integration
 */

export function getStoredJWT(): string | null {
  return sessionStorage.getItem('jwt');
}

export function setStoredJWT(token: string): void {
  sessionStorage.setItem('jwt', token);
}

export function authHeader(): Record<string, string> {
  const jwt = getStoredJWT();
  return jwt ? { Authorization: `Bearer ${jwt}` } : {};
}

export function clearJWT(): void {
  sessionStorage.removeItem('jwt');
}