import { ChevronLeft, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { iconButtonVariants } from '@/components/ui/icon-button';
import { Link } from '@/i18n/navigation';

interface TopBarProps {
  title?: string;
  /** Where the leading button goes. "close" shows ×, "back" shows a chevron that flips in Arabic. */
  leading?: { href: string; label: string; icon: 'back' | 'close' };
  /** An optional action at the end, such as «تخطي». */
  trailing?: ReactNode;
}

/** The 60px bar at the top of flow screens: a back or close button, a centered title, an optional action. */
export function TopBar({ title, leading, trailing }: TopBarProps) {
  return (
    <header className="flex h-15 shrink-0 items-center justify-between gap-2 px-bar">
      {leading ? (
        <Link href={leading.href} aria-label={leading.label} className={iconButtonVariants()}>
          {leading.icon === 'back' ? (
            <ChevronLeft aria-hidden className="size-5 rtl:rotate-180" />
          ) : (
            <X aria-hidden className="size-5" />
          )}
        </Link>
      ) : (
        <span aria-hidden className="size-11" />
      )}
      {title && <h1 className="truncate text-16 font-bold">{title}</h1>}
      {trailing ?? <span aria-hidden className="size-11" />}
    </header>
  );
}
