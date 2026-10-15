'use client';

import { useEffect, type ReactNode } from 'react';
import { ErrorMessage, LoadingBlocks } from '@/components/status-message';
import { usePathname, useRouter } from '@/i18n/navigation';
import { useAdminSession } from './api';

/**
 * Shows the dashboard only to a signed-in admin; anyone else goes to the admin sign-in and comes back after.
 * With the mock API the session lives in the browser, so this check runs there. In phase 2 the backend's
 * session cookie lets the server do it before any HTML is sent.
 */
export function AdminGuard({ children }: { children: ReactNode }) {
  const session = useAdminSession();
  const router = useRouter();
  const pathname = usePathname();
  const signedOut = session.isSuccess && !session.data;

  useEffect(() => {
    if (signedOut) router.replace({ pathname: '/admin/sign-in', query: { next: pathname } });
  }, [signedOut, router, pathname]);

  if (session.isError) return <ErrorMessage onRetry={() => void session.refetch()} />;
  if (!session.data) {
    return (
      <div className="mx-auto w-full max-w-md p-6">
        <LoadingBlocks />
      </div>
    );
  }
  return children;
}
