import { sessionUserSchema, type OtpRequest, type OtpVerify } from '@lo2ma/core';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { api, jsonBody, orNull, request } from '@/lib/api';

export const sessionKey = ['session'] as const;

/** The signed-in user, or null for guests. */
export function useSession() {
  return useQuery({
    queryKey: sessionKey,
    queryFn: () => orNull(api('/auth/session', sessionUserSchema)),
  });
}

export function useRequestOtp() {
  return useMutation({
    mutationFn: (body: OtpRequest) =>
      api('/auth/otp', z.object({ expiresIn: z.int() }), { method: 'POST', ...jsonBody(body) }),
  });
}

export function useVerifyOtp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: OtpVerify) =>
      api('/auth/verify', sessionUserSchema, { method: 'POST', ...jsonBody(body) }),
    onSuccess: (user) => queryClient.setQueryData(sessionKey, user),
  });
}

export function useSignOut() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => request('/auth/sign-out', { method: 'POST' }),
    onSuccess: () => queryClient.setQueryData(sessionKey, null),
  });
}
