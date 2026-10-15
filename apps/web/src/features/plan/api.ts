import { weeklyPlanSchema } from '@lo2ma/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, orNull } from '@/lib/api';

const planKey = ['plan'] as const;

/** Next week's plan, or null before onboarding. */
export function usePlan() {
  return useQuery({
    queryKey: planKey,
    queryFn: () => orNull(api('/plan', weeklyPlanSchema), [404]),
  });
}

export function useSwapDay() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (date: string) =>
      api(`/plan/days/${date}/swap`, weeklyPlanSchema, { method: 'POST' }),
    onSuccess: (plan) => queryClient.setQueryData(planKey, plan),
  });
}

export function useConfirmPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api('/plan/confirm', weeklyPlanSchema, { method: 'POST' }),
    onSuccess: (plan) => queryClient.setQueryData(planKey, plan),
  });
}
