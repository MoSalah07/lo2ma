import { Wordmark } from '@/components/wordmark';
import { Badge } from '@/components/ui/badge';

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
      <Wordmark name={name} size={large ? 'lg' : 'sm'} />
      <Badge tone="inverse" size={large ? 'md' : 'sm'}>
        {badge}
      </Badge>
    </div>
  );
}
