import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ClientMessages } from '@/components/client-messages';
import { SignInForm } from '@/features/auth/sign-in-form';
import { safeNext } from '@/features/auth/verify-url';
import { Wordmark } from '@/components/wordmark';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('auth');
  return { title: t('title') };
}

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

export default async function SignInPage({ searchParams }: PageProps<'/[locale]/sign-in'>) {
  const query = await searchParams;
  const t = await getTranslations('common');
  return (
    <main className="flex flex-1 flex-col">
      <div className="flex flex-col gap-3.5 px-gutter pt-14">
        <Wordmark name={t('brand')} size="xl" />
        <p className="text-body-lg font-medium text-ink-2">{t('tagline')}</p>
      </div>
      <ClientMessages namespaces={['common', 'auth']}>
        <SignInForm
          initialChannel={first(query.channel) === 'email' ? 'email' : 'phone'}
          next={safeNext(first(query.next))}
        />
      </ClientMessages>
    </main>
  );
}
