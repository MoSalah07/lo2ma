import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { BottomNav } from '@/components/bottom-nav';

/** Chat, plan, orders and account share the floating tab bar. */
export default function TabsLayout({ children }: { children: ReactNode }) {
  const t = useTranslations('nav');
  return (
    <>
      <main className="flex flex-1 flex-col">{children}</main>
      <BottomNav
        label={t('label')}
        labels={{ chat: t('chat'), plan: t('plan'), orders: t('orders'), account: t('account') }}
      />
    </>
  );
}
