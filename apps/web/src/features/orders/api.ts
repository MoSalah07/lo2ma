import { orderSchema, savedPaymentMethodSchema, type CreateOrder } from '@lo2ma/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { api, jsonBody, orNull } from '@/lib/api';

/** How often the tracking screen asks for a fresh status until the order arrives. */
const TRACKING_POLL_MS = 4000;

export function useOrders() {
  return useQuery({ queryKey: ['orders'], queryFn: () => api('/orders', z.array(orderSchema)) });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: ['orders', id],
    queryFn: () => orNull(api(`/orders/${encodeURIComponent(id)}`, orderSchema), [404]),
    refetchInterval: (query) =>
      query.state.data && query.state.data.status !== 'delivered' ? TRACKING_POLL_MS : false,
  });
}

export function usePaymentMethods() {
  return useQuery({
    queryKey: ['payment-methods'],
    queryFn: () => api('/payment-methods', z.array(savedPaymentMethodSchema)),
    staleTime: Infinity,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateOrder) =>
      api('/orders', orderSchema, { method: 'POST', ...jsonBody(body) }),
    onSuccess: (order) => {
      queryClient.setQueryData(['orders', order.id], order);
      void queryClient.invalidateQueries({ queryKey: ['orders'], exact: true });
    },
  });
}
