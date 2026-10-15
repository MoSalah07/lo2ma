import {
  adminChallengeSchema,
  adminOrderSchema,
  adminOrdersPageSchema,
  adminOverviewSchema,
  adminUserSchema,
  agentConversationSchema,
  agentConversationSummarySchema,
  companySchema,
  couponSchema,
  type AdminOrdersQuery,
  type AdminSignIn,
  type AdminVerify,
  type AgentFilter,
  type CreateCoupon,
  type OverviewRange,
} from '@lo2ma/core';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, jsonBody, orNull, request } from '@/lib/api';

// Admin data lives under its own query keys, so signing out of the admin never touches the customer cache.
const keys = {
  session: ['admin', 'session'] as const,
  overview: (range: OverviewRange) => ['admin', 'overview', range] as const,
  orders: (query: AdminOrdersQuery) => ['admin', 'orders', query] as const,
  companies: ['admin', 'companies'] as const,
  coupons: ['admin', 'coupons'] as const,
  conversations: (filter: AgentFilter, q: string) => ['admin', 'agent', filter, q] as const,
  conversation: (id: string) => ['admin', 'agent', id] as const,
};

/** Drops empty values so the URL only carries the filters in use. */
function toSearch(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value));
  }
  const text = search.toString();
  return text ? `?${text}` : '';
}

/** The signed-in admin, or null. */
export function useAdminSession() {
  return useQuery({
    queryKey: keys.session,
    queryFn: () => orNull(api('/admin/auth/session', adminUserSchema), [401]),
  });
}

export function useAdminSignIn() {
  return useMutation({
    mutationFn: (body: AdminSignIn) =>
      api('/admin/auth/sign-in', adminChallengeSchema, { method: 'POST', ...jsonBody(body) }),
  });
}

export function useAdminVerify() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: AdminVerify) =>
      api('/admin/auth/verify', adminUserSchema, { method: 'POST', ...jsonBody(body) }),
    onSuccess: (admin) => queryClient.setQueryData(keys.session, admin),
  });
}

export function useAdminSignOut() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => request('/admin/auth/sign-out', { method: 'POST' }),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ['admin'] });
      queryClient.setQueryData(keys.session, null);
    },
  });
}

export function useOverview(range: OverviewRange) {
  return useQuery({
    queryKey: keys.overview(range),
    queryFn: () => api(`/admin/overview${toSearch({ range })}`, adminOverviewSchema),
    placeholderData: keepPreviousData,
  });
}

export function useAdminOrders(query: AdminOrdersQuery) {
  return useQuery({
    queryKey: keys.orders(query),
    queryFn: () => api(`/admin/orders${toSearch(query)}`, adminOrdersPageSchema),
    // Keep the current page on screen while the next one loads, so the table doesn't jump.
    placeholderData: keepPreviousData,
  });
}

/** Every order matching the filters, for the CSV export. Fetched on demand, not cached. */
export const fetchOrdersForExport = (query: AdminOrdersQuery) =>
  api(`/admin/orders/export${toSearch({ ...query, page: undefined })}`, adminOrderSchema.array());

export function useCompanies() {
  return useQuery({
    queryKey: keys.companies,
    queryFn: () => api('/admin/companies', companySchema.array()),
    staleTime: Infinity,
  });
}

export function useCoupons() {
  return useQuery({
    queryKey: keys.coupons,
    queryFn: () => api('/admin/coupons', couponSchema.array()),
  });
}

export function useCreateCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateCoupon) =>
      api('/admin/coupons', couponSchema, { method: 'POST', ...jsonBody(body) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.coupons }),
  });
}

export function useConversations(filter: AgentFilter, q: string) {
  return useQuery({
    queryKey: keys.conversations(filter, q),
    queryFn: () =>
      api(
        `/admin/agent/conversations${toSearch({ filter, q })}`,
        agentConversationSummarySchema.array(),
      ),
    placeholderData: keepPreviousData,
  });
}

export function useConversation(id: string | undefined) {
  return useQuery({
    queryKey: keys.conversation(id ?? ''),
    queryFn: () => api(`/admin/agent/conversations/${id}`, agentConversationSchema),
    enabled: Boolean(id),
  });
}
