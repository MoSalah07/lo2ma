import { suggestionSchema } from '@lo2ma/core';
import { useQuery } from '@tanstack/react-query';
import { api, orNull } from '@/lib/api';

/** One suggestion by id, or null when it doesn't exist. */
export function useSuggestion(id: string) {
  return useQuery({
    queryKey: ['suggestion', id],
    queryFn: () => orNull(api(`/suggestions/${encodeURIComponent(id)}`, suggestionSchema), [404]),
    staleTime: Infinity,
  });
}
