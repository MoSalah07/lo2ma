import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import { AgentScreen } from '@/features/admin/agent/agent-screen';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('admin.agent');
  return { title: t('title') };
}

// The chosen conversation and filters are read from the URL in the browser.
export default function AdminAgentPage() {
  return (
    <Suspense>
      <AgentScreen />
    </Suspense>
  );
}
