import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { LocationEnhancement, InsertLocationEnhancement } from "@shared/schema";

export function useLocationEnhancement(ghlLocationId: string, directoryName: string) {
  return useQuery({
    queryKey: ['/api/location-enhancements', ghlLocationId, directoryName],
    queryFn: () => 
      fetch(`/api/location-enhancements/${ghlLocationId}/${directoryName}`)
        .then(res => res.ok ? res.json() : null),
    enabled: !!(ghlLocationId && directoryName)
  });
}

export function useLocationEnhancementsByUser(userId: number) {
  return useQuery({
    queryKey: ['/api/location-enhancements/user', userId],
    queryFn: () => 
      fetch(`/api/location-enhancements/user/${userId}`)
        .then(res => res.json()),
    enabled: !!userId
  });
}

export function useCreateLocationEnhancement() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: InsertLocationEnhancement) =>
      apiRequest('/api/location-enhancements', {
        method: 'POST',
        data
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ['/api/location-enhancements']
      });
    }
  });
}

export function useUpdateLocationEnhancement() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Partial<InsertLocationEnhancement> }) =>
      apiRequest(`/api/location-enhancements/${id}`, {
        method: 'PUT',
        data: updates
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ['/api/location-enhancements']
      });
    }
  });
}

export function useDeleteLocationEnhancement() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/api/location-enhancements/${id}`, {
        method: 'DELETE'
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['/api/location-enhancements']
      });
    }
  });
}