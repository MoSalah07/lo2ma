import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ClientMessages } from '@/components/client-messages';
import { TopBar } from '@/components/top-bar';
import { MealScreen } from '@/features/meal/meal-screen';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('meal');
  return { title: t('title') };
}

export default async function MealPage({ params }: PageProps<'/[locale]/meals/[id]'>) {
  const { id } = await params;
  const t = await getTranslations();
  return (
    <>
      <TopBar
        title={t('meal.title')}
        leading={{ href: '/chat', label: t('common.back'), icon: 'back' }}
      />
      <main>
        <ClientMessages namespaces={['common', 'meal', 'bill', 'format', 'prefs', 'auth', 'fit']}>
          <MealScreen id={decodeURIComponent(id)} />
        </ClientMessages>
      </main>
    </>
  );
}
