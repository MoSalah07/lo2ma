import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ClientMessages } from '@/components/client-messages';
import { SignInForm } from '@/features/auth/sign-in-form';
import { safeNext } from '@/features/auth/verify-url';

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
        <div className="flex items-baseline gap-2">
          <span className="text-44 leading-none font-extrabold">{t('brand')}</span>
          <span aria-hidden className="size-3 rounded-full bg-primary" />
        </div>
        <p className="text-17 leading-body font-medium text-ink-2">{t('tagline')}</p>
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
