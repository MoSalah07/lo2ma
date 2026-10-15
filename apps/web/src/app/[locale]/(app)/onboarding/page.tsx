import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ClientMessages } from '@/components/client-messages';
import { TopBar } from '@/components/top-bar';
import { buttonVariants } from '@/components/ui/button';
import { OnboardingForm } from '@/features/onboarding/onboarding-form';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/cn';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('onboarding');
  return { title: t('title') };
}

export default async function OnboardingPage() {
  const t = await getTranslations('common');
  return (
    <>
      <TopBar
        leading={{ href: '/', label: t('back'), icon: 'back' }}
        trailing={
          <Link
            href="/chat"
            className={cn(buttonVariants({ variant: 'link', size: 'sm' }), 'text-muted')}
          >
            {t('skip')}
          </Link>
        }
      />
      <main>
        <ClientMessages namespaces={['common', 'onboarding', 'prefs']}>
          <OnboardingForm />
        </ClientMessages>
      </main>
    </>
  );
}
