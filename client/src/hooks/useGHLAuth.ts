import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface GHLUser {
  id: string;
  email: string;
  name: string;
  locationId: string;
  scopes: string[];
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthState {
  user: GHLUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface UseGHLAuthReturn extends AuthState {
  login: (params: URLSearchParams) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  hasScope: (scope: string) => boolean;
}

export function useGHLAuth(): UseGHLAuthReturn {
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Check for stored authentication
  const { data: user, isLoading } = useQuery({
    queryKey: ['/api/auth/me'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (!response.ok) {
          if (response.status === 401) return null;
          throw new Error('Failed to fetch user data');
        }
        return response.json();
      } catch (error) {
        console.error('Auth check failed:', error);
        return null;
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (params: URLSearchParams) => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: params.get('code'),
          state: params.get('state'),
          ghlUserId: params.get('ghl_user_id'),
          locationId: params.get('location_id'),
          installationId: params.get('installation_id'),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Login failed' }));
        throw new Error(errorData.message || 'Authentication failed');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      setError(null);
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Logout failed');
      }
    },
    onSuccess: () => {
      queryClient.clear();
      setError(null);
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  // Refresh token mutation
  const refreshMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      setError(null);
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  // Check for OAuth parameters on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const hasOAuthParams = urlParams.get('code') || urlParams.get('ghl_user_id');
    
    if (hasOAuthParams && !user && !loginMutation.isPending) {
      loginMutation.mutate(urlParams);
    }
  }, [user, loginMutation]);

  // Utility functions
  const hasScope = useCallback((scope: string): boolean => {
    return user?.scopes?.includes(scope) || false;
  }, [user]);

  const login = useCallback(async (params: URLSearchParams) => {
    return loginMutation.mutateAsync(params);
  }, [loginMutation]);

  const logout = useCallback(async () => {
    return logoutMutation.mutateAsync();
  }, [logoutMutation]);

  const refreshAuth = useCallback(async () => {
    return refreshMutation.mutateAsync();
  }, [refreshMutation]);

  return {
    user,
    isAuthenticated: !!user,
    isLoading: isLoading || loginMutation.isPending,
    error: error || loginMutation.error?.message || logoutMutation.error?.message || null,
    login,
    logout,
    refreshAuth,
    hasScope,
  };
}