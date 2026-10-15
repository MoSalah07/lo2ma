import { userPrefsSchema, workplaceSchema, type UserPrefs } from '@lo2ma/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { api, jsonBody, orNull } from '@/lib/api';

export const prefsKey = ['prefs'] as const;

/** The saved preferences, or null before onboarding. */
export function usePrefs() {
  return useQuery({ queryKey: prefsKey, queryFn: () => orNull(api('/prefs', userPrefsSchema)) });
}

export function useWorkplaces() {
  return useQuery({
    queryKey: ['workplaces'],
    queryFn: () => api('/workplaces', z.array(workplaceSchema)),
    staleTime: Infinity,
  });
}

export function useSavePrefs() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (prefs: UserPrefs) =>
      api('/prefs', userPrefsSchema, { method: 'PUT', ...jsonBody(prefs) }),
    onSuccess: (prefs) => {
      queryClient.setQueryData(prefsKey, prefs);
      // The weekly plan is built from the preferences.
      void queryClient.invalidateQueries({ queryKey: ['plan'] });
    },
  });
}
