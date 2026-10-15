import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ClientMessages } from '@/components/client-messages';
import { TopBar } from '@/components/top-bar';
import { TrackingScreen } from '@/features/tracking/tracking-screen';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('tracking');
  return { title: t('title') };
}

export default async function TrackingPage({ params }: PageProps<'/[locale]/orders/[id]'>) {
  const { id } = await params;
  const t = await getTranslations();
  return (
    <>
      <TopBar
        title={t('tracking.title')}
        leading={{ href: '/chat', label: t('common.close'), icon: 'close' }}
      />
      <main>
        <ClientMessages namespaces={['common', 'tracking']}>
          <TrackingScreen id={decodeURIComponent(id)} />
        </ClientMessages>
      </main>
    </>
  );
}
