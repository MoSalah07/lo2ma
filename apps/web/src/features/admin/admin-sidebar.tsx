'use client';

import { Bot, LayoutDashboard, List, LogOut, TicketPercent, type LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { IconButton } from '@/components/ui/icon-button';
import { focusRing } from '@/components/ui/focus';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { cn } from '@/lib/cn';
import { useAdminSession, useAdminSignOut } from './api';
import { AdminBrand } from './brand';

type NavKey = 'overview' | 'orders' | 'coupons' | 'agent';

// Customers, companies, restaurants and settings join this list once their screens are designed.
const items: { key: NavKey; href: string; icon: LucideIcon }[] = [
  { key: 'overview', href: '/admin', icon: LayoutDashboard },
  { key: 'orders', href: '/admin/orders', icon: List },
  { key: 'coupons', href: '/admin/coupons', icon: TicketPercent },
  { key: 'agent', href: '/admin/agent', icon: Bot },
];

/** The admin menu: a column beside the content on wide screens, a scrolling row on top on narrow ones. */
export function AdminSidebar() {
  const t = useTranslations('admin');
  const tCommon = useTranslations('common');
  const pathname = usePathname();
  const router = useRouter();
  const session = useAdminSession();
  const signOut = useAdminSignOut();

  return (
    <aside className="shrink-0 lg:sticky lg:top-6 lg:w-64">
      <nav
        aria-label={t('nav.label')}
        className="flex flex-col gap-4 rounded-28 bg-surface p-4 shadow-card"
      >
        <div className="px-2 pt-1">
          <AdminBrand name={tCommon('brand')} badge={t('badge')} />
        </div>

        <ul className="-mx-1 flex gap-1 overflow-x-auto px-1 lg:flex-col">
          {items.map(({ key, href, icon: Icon }) => {
            const current = pathname === href;
            return (
              <li key={key} className="shrink-0">
                <Link
                  href={href}
                  aria-current={current ? 'page' : undefined}
                  className={cn(
                    'flex h-11 items-center gap-2.5 rounded-full px-3 text-14 whitespace-nowrap transition-colors',
                    current
                      ? 'bg-tint font-semibold text-on-tint'
                      : 'font-medium text-ink-2 hover:bg-surface-2',
                    focusRing,
                  )}
                >
                  <Icon aria-hidden className="size-4.5" />
                  {t(`nav.${key}`)}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-2.5 border-t border-divider px-1 pt-3">
          <span
            aria-hidden
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-tint text-14 font-bold text-on-tint"
          >
            {t('initial')}
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-px">
            <span className="text-13 font-semibold">{t('who')}</span>
            {session.data && (
              <bdi dir="ltr" className="truncate text-start text-12 text-muted">
                {session.data.email}
              </bdi>
            )}
          </div>
          <IconButton
            label={t('signOut')}
            icon={LogOut}
            variant="ghost"
            flipInRtl
            disabled={signOut.isPending}
            onClick={() =>
              signOut.mutate(undefined, { onSuccess: () => router.replace('/admin/sign-in') })
            }
          />
        </div>
      </nav>
    </aside>
  );
}
