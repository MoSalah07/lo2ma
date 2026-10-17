import { mealBreakdownSchema, suggestionSchema } from '@lo2ma/core';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api, orNull, request } from '@/lib/api';

const path = (id: string) => `/suggestions/${encodeURIComponent(id)}`;

/** One suggestion by id, or null when it doesn't exist. */
export function useSuggestion(id: string) {
  return useQuery({
    queryKey: ['suggestion', id],
    queryFn: () => orNull(api(path(id), suggestionSchema), [404]),
    staleTime: Infinity,
  });
}

/** «حسبناها ازاي»: fetched only once the sheet opens. */
export function useMealBreakdown(id: string, enabled: boolean) {
  return useQuery({
    queryKey: ['suggestion', id, 'nutrition'],
    queryFn: () => api(`${path(id)}/nutrition`, mealBreakdownSchema),
    enabled,
    staleTime: Infinity,
  });
}

/** «الطبق جالك مختلف؟»: the meal's estimated dishes go to review. */
export function useReportNutrition(id: string) {
  return useMutation({
    mutationFn: () => request(`${path(id)}/nutrition/report`, { method: 'POST' }),
  });
}
