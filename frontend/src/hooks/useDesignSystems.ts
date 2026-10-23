/** React Query hooks for Design Systems */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import type { DesignSystem, ExtractRequest } from '../types/api';

// Query keys
export const designSystemKeys = {
  all: ['designSystems'] as const,
  lists: () => [...designSystemKeys.all, 'list'] as const,
  list: (page: number, pageSize: number) => [...designSystemKeys.lists(), { page, pageSize }] as const,
  detail: (id: number) => [...designSystemKeys.all, 'detail', id] as const,
  audits: (id: number) => [...designSystemKeys.all, 'audits', id] as const,
};

// List design systems
export function useDesignSystems(page = 1, pageSize = 20) {
  return useQuery({
    queryKey: designSystemKeys.list(page, pageSize),
    queryFn: () => api.listDesignSystems(page, pageSize),
    staleTime: 30_000,
  });
}

// Get single design system
export function useDesignSystem(id: number) {
  return useQuery({
    queryKey: designSystemKeys.detail(id),
    queryFn: () => api.getDesignSystem(id),
    enabled: !!id,
    staleTime: 30_000,
  });
}

// Create design system
export function useCreateDesignSystem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; root_path: string }) => api.createDesignSystem(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: designSystemKeys.lists() });
    },
  });
}

// Update design system
export function useUpdateDesignSystem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<DesignSystem> }) => api.updateDesignSystem(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: designSystemKeys.lists() });
      queryClient.invalidateQueries({ queryKey: designSystemKeys.detail(variables.id) });
    },
  });
}

// Delete design system
export function useDeleteDesignSystem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.deleteDesignSystem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: designSystemKeys.lists() });
    },
  });
}

// Extract design system
export function useExtractDesignSystem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: ExtractRequest) => api.extractDesignSystem(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: designSystemKeys.lists() });
    },
  });
}