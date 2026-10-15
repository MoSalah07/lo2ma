import { TrendingDown, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/cn';

interface KpiTileProps {
  label: string;
  value: string;
  /** The change, already worded: «12% عن الأربع اللي فات». */
  change: string;
  /** Read before the change by screen readers, since the arrow is only visual. */
  directionLabel?: string;
  direction: 'up' | 'down' | 'flat';
  /** Whether this move is good news (more orders, a lower AI cost). */
  good: boolean;
}

/** One headline number on the overview, with how it moved. */
export function KpiTile({ label, value, change, directionLabel, direction, good }: KpiTileProps) {
  const Arrow = direction === 'down' ? TrendingDown : TrendingUp;
  return (
    <Card className="flex flex-col gap-2 px-5 py-4.5">
      <span className="text-13 text-muted">{label}</span>
      <span className="text-30 leading-tight font-extrabold tabular-nums">{value}</span>
      <span
        className={cn(
          'inline-flex items-center gap-1 text-12 font-semibold',
          direction === 'flat' ? 'text-muted' : good ? 'text-on-good' : 'text-on-danger',
        )}
      >
        {direction !== 'flat' && <Arrow aria-hidden className="size-3.5" />}
        {directionLabel && <span className="sr-only">{directionLabel}</span>}
        {change}
      </span>
    </Card>
  );
}
