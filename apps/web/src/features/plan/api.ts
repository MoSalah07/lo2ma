import { weeklyPlanSchema, type WeeklyPlan } from '@lo2ma/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { api, ApiError, orNull } from '@/lib/api';

const planKey = ['plan'] as const;

/** How often a paid week asks for fresh day statuses while some day is still to come. */
const PLAN_POLL_MS = 30_000;

const weekGoesOn = (plan: WeeklyPlan | null | undefined) =>
  plan?.confirmed === true && plan.days.some((day) => day.status !== 'delivered');

/** The plan tab's week: next week's draft, or the paid week as it goes by. Null before onboarding. */
export function usePlan() {
  return useQuery({
    queryKey: planKey,
    queryFn: () => orNull(api('/plan', weeklyPlanSchema), [404]),
    refetchInterval: (query) => (weekGoesOn(query.state.data) ? PLAN_POLL_MS : false),
  });
}

export function useSwapDay() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (date: string) =>
      api(`/plan/days/${date}/swap`, weeklyPlanSchema, { method: 'POST' }),
    onSuccess: (plan) => queryClient.setQueryData(planKey, plan),
    // A refused swap usually means the day locked in the meantime: show the plan as it is now.
    onError: () => void queryClient.invalidateQueries({ queryKey: planKey }),
  });
}

export function useConfirmPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api('/plan/confirm', weeklyPlanSchema, { method: 'POST' }),
    onSuccess: (plan) => queryClient.setQueryData(planKey, plan),
    onError: () => void queryClient.invalidateQueries({ queryKey: planKey }),
  });
}

/** Turns a refused plan request into a message the user understands, or undefined for the generic one. */
export function usePlanErrorText() {
  const t = useTranslations('plan');
  return (error: unknown) => {
    if (!(error instanceof ApiError)) return undefined;
    if (error.code === 'day_locked') return t('dayLocked');
    if (error.code === 'plan_expired') return t('expired');
    return undefined;
  };
}
