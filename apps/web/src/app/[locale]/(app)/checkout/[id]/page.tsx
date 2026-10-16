import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ClientMessages } from '@/components/client-messages';
import { TopBar } from '@/components/top-bar';
import { CheckoutScreen } from '@/features/checkout/checkout-screen';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('checkout');
  return { title: t('title') };
}

export default async function CheckoutPage({ params }: PageProps<'/[locale]/checkout/[id]'>) {
  const { id } = await params;
  const suggestionId = decodeURIComponent(id);
  const t = await getTranslations();
  return (
    <>
      <TopBar
        title={t('checkout.title')}
        leading={{ href: `/meals/${suggestionId}`, label: t('common.back'), icon: 'back' }}
      />
      <main>
        <ClientMessages
          namespaces={['common', 'checkout', 'bill', 'payment', 'meal', 'auth', 'success']}
        >
          <CheckoutScreen id={suggestionId} />
        </ClientMessages>
      </main>
    </>
  );
}
