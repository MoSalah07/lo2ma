import { ArrowRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { buttonVariants } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/cn';

interface StartLinkProps {
  /** The white version, for the primary-colored band. */
  onPrimary?: boolean;
  children: ReactNode;
}

/** The page's one action, «يلا نبدأ», at the top and again at the bottom. */
export function StartLink({ onPrimary = false, children }: StartLinkProps) {
  return (
    <Link
      href="/onboarding"
      className={cn(
        buttonVariants({ variant: onPrimary ? 'onPrimary' : 'primary' }),
        'shrink-0 px-7',
      )}
    >
      {children}
      <ArrowRight aria-hidden className="size-4.5 rtl:rotate-180" />
    </Link>
  );
}
