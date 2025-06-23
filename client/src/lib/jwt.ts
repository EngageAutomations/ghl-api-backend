// JWT authentication utilities for Railway proxy
let cachedJWT: string | null = null;

export async function getJWT(): Promise<string> {
  // Check session storage first
  const stored = sessionStorage.getItem('jwt');
  if (stored && cachedJWT !== stored) {
    cachedJWT = stored;
    return stored;
  }
  
  // Fetch new JWT if not cached
  if (!cachedJWT) {
    const response = await fetch('/api/auth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agent: 'replit-client' })
    });
    
    if (!response.ok) {
      throw new Error('Failed to get JWT token');
    }
    
    const { jwt } = await response.json();
    cachedJWT = jwt;
    sessionStorage.setItem('jwt', jwt);
  }
  
  return cachedJWT;
}

export function authHeader() {
  return cachedJWT ? { Authorization: `Bearer ${cachedJWT}` } : {};
}

// Initialize JWT on app load
export async function initializeAuth() {
  try {
    await getJWT();
  } catch (error) {
    console.error('Failed to initialize authentication:', error);
  }
}