import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { ClientMessages } from '@/components/client-messages';

// The dashboard is for the team only, so search engines should never list it.
export const metadata: Metadata = { robots: { index: false, follow: false } };

/** Everything under /admin is a client island fed by the mock API, so it gets the admin messages. */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <ClientMessages namespaces={['common', 'format', 'weekdays', 'admin']}>
      {children}
    </ClientMessages>
  );
}
