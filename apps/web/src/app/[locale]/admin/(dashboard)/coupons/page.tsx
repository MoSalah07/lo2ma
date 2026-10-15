import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { CouponsScreen } from '@/features/admin/coupons/coupons-screen';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('admin.coupons');
  return { title: t('title') };
}

export default function AdminCouponsPage() {
  return <CouponsScreen />;
}
