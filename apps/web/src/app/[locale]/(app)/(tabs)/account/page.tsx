import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ClientMessages } from '@/components/client-messages';
import { AccountScreen } from '@/features/account/account-screen';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('account');
  return { title: t('title') };
}

export default function AccountPage() {
  return (
    <ClientMessages namespaces={['common', 'account', 'prefs', 'payment', 'languages']}>
      <AccountScreen />
    </ClientMessages>
  );
}
