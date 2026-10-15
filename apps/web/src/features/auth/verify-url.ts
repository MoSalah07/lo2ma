import type { OtpChannel } from '@lo2ma/core';

/** Where to go after asking for a code: the verify screen, which then returns the user to `next`. */
export function verifyUrl(channel: OtpChannel, destination: string, next: string): string {
  const params = new URLSearchParams({ channel, to: destination, next });
  return `/sign-in/verify?${params.toString()}`;
}

/** Only same-site paths are allowed as `next`, so a link can't send people to another site after sign-in. */
export function safeNext(next: string | undefined, fallback = '/chat'): string {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : fallback;
}
