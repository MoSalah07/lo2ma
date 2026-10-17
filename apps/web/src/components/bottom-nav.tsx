'use client';

import { CalendarDays, ListOrdered, MessageCircle, UserRound } from 'lucide-react';
import { focusRing } from '@/components/ui/focus';
import { Link, usePathname } from '@/i18n/navigation';
import { cn } from '@/lib/cn';

const tabs = [
  { key: 'chat', href: '/chat', icon: MessageCircle },
  { key: 'plan', href: '/plan', icon: CalendarDays },
  { key: 'orders', href: '/orders', icon: ListOrdered },
  { key: 'account', href: '/account', icon: UserRound },
] as const;

export type TabKey = (typeof tabs)[number]['key'];

interface BottomNavProps {
  label: string;
  labels: Record<TabKey, string>;
}

/** The floating glass tab bar at the bottom of the main screens. */
export function BottomNav({ label, labels }: BottomNavProps) {
  const pathname = usePathname();

  return (
    <nav
      aria-label={label}
      className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-app px-bar pt-2.5 pb-nav-end"
    >
      <ul className="grid h-16 grid-cols-4 gap-1 rounded-32 bg-glass p-1.5 shadow-glass backdrop-blur-xl">
        {tabs.map(({ key, href, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={key}>
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex h-full flex-col items-center justify-center gap-0.5 rounded-26 text-caption-sm',
                  active ? 'bg-tint font-semibold text-on-tint' : 'font-medium text-muted',
                  focusRing,
                )}
              >
                <Icon aria-hidden className="size-5" />
                {labels[key]}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
