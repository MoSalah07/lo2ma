import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/cn';

interface BrandProps {
  name: string;
  badge: string;
  size?: 'md' | 'lg';
}

/** «لقمة.» with the black «أدمن» pill, at the top of the sidebar and the admin sign-in card. */
export function AdminBrand({ name, badge, size = 'md' }: BrandProps) {
  const large = size === 'lg';
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-baseline gap-1.5">
        <span className={cn('leading-none font-extrabold', large ? 'text-30' : 'text-24')}>
          {name}
        </span>
        <span
          aria-hidden
          className={cn('rounded-full bg-primary', large ? 'size-2.5' : 'size-2')}
        />
      </div>
      <Badge tone="inverse" size={large ? 'md' : 'sm'}>
        {badge}
      </Badge>
    </div>
  );
}
