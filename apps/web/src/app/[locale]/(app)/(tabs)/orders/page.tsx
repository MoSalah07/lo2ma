import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ClientMessages } from '@/components/client-messages';
import { OrdersScreen } from '@/features/orders/orders-screen';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('orders');
  return { title: t('title') };
}

export default function OrdersPage() {
  return (
    <ClientMessages namespaces={['common', 'orders', 'tracking']}>
      <OrdersScreen />
    </ClientMessages>
  );
}
