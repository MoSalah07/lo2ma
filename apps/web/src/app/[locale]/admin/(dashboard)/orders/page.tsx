import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import { OrdersScreen } from '@/features/admin/orders/orders-screen';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('admin.orders');
  return { title: t('title') };
}

// The filters are read from the URL in the browser, so the screen renders there (Suspense marks the edge).
export default function AdminOrdersPage() {
  return (
    <Suspense>
      <OrdersScreen />
    </Suspense>
  );
}
