/** React Query hooks for Audits */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import type { AuditRequest } from '../types/api';

export const auditKeys = {
  all: ['audits'] as const,
  lists: (designSystemId: number) => [...auditKeys.all, 'list', designSystemId] as const,
  list: (designSystemId: number, page: number, pageSize: number) => [...auditKeys.lists(designSystemId), { page, pageSize }] as const,
  detail: (designSystemId: number, auditId: number) => [...auditKeys.all, 'detail', designSystemId, auditId] as const,
};

export function useAudits(designSystemId: number, page = 1, pageSize = 20) {
  return useQuery({
    queryKey: auditKeys.list(designSystemId, page, pageSize),
    queryFn: () => api.listAudits(designSystemId, page, pageSize),
    enabled: !!designSystemId,
    staleTime: 30_000,
  });
}

export function useAudit(designSystemId: number, auditId: number) {
  return useQuery({
    queryKey: auditKeys.detail(designSystemId, auditId),
    queryFn: () => api.getAudit(designSystemId, auditId),
    enabled: !!designSystemId && !!auditId,
    staleTime: 30_000,
  });
}

export function useRunAudit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (request: AuditRequest) => api.runAudit(request),
    onSuccess: (_, request) => {
      queryClient.invalidateQueries({ queryKey: auditKeys.lists(request.design_system_id) });
    },
  });
}

export function useDeleteAudit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ designSystemId: _designSystemId, auditId }: { designSystemId: number; auditId: number }) =>
      api.deleteDesignSystem(auditId), // Note: API uses design-system delete for audits too
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: auditKeys.lists(variables.designSystemId) });
    },
  });
}