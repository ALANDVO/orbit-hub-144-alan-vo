/** React Query hooks for Craft Floor */

import { useMutation } from '@tanstack/react-query';
import { api } from '../api/client';
import type { CraftFloorCheckRequest, CraftFloorCheckResponse } from '../types/api';

export function useCraftFloorCheck() {
  return useMutation<CraftFloorCheckResponse, Error, CraftFloorCheckRequest>({
    mutationFn: (request) => api.checkCraftFloor(request),
  });
}

export function useCraftFloorRules(category?: string, severity?: string) {
  // Using a simple query for rules - in production use useQuery
  return {
    fetch: () => api.listCraftFloorRules(category, severity),
  };
}