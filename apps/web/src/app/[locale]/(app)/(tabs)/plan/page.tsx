import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ClientMessages } from '@/components/client-messages';
import { PlanScreen } from '@/features/plan/plan-screen';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('plan');
  return { title: t('title') };
}

export default function PlanPage() {
  return (
    <ClientMessages
      namespaces={[
        'common',
        'plan',
        'weekdays',
        'onboarding',
        'auth',
        'tracking',
        'success',
        'fit',
      ]}
    >
      <PlanScreen />
    </ClientMessages>
  );
}
