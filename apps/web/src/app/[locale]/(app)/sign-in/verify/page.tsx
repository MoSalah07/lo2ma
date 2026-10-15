import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import { ClientMessages } from '@/components/client-messages';
import { TopBar } from '@/components/top-bar';
import { VerifyForm } from '@/features/auth/verify-form';
import { safeNext } from '@/features/auth/verify-url';
import { redirect } from '@/i18n/navigation';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('auth.otp');
  return { title: t('title') };
}

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

export default async function VerifyPage({ searchParams }: PageProps<'/[locale]/sign-in/verify'>) {
  const [locale, query] = await Promise.all([getLocale(), searchParams]);
  const channel = first(query.channel) === 'email' ? 'email' : 'phone';
  const destination = first(query.to);
  const next = safeNext(first(query.next));
  if (!destination) redirect({ href: '/sign-in', locale });

  const t = await getTranslations('common');
  return (
    <>
      <TopBar leading={{ href: `/sign-in?channel=${channel}`, label: t('back'), icon: 'back' }} />
      <main>
        <ClientMessages namespaces={['common', 'auth']}>
          <VerifyForm channel={channel} destination={destination ?? ''} next={next} />
        </ClientMessages>
      </main>
    </>
  );
}
