import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/cn';

interface CalorieLineProps {
  /** Already formatted, e.g. «حوالي 900 سعر». */
  text: string;
  /** «تقدير AI» when the number is an estimate. Every calorie number shows where it comes from. */
  estimateLabel?: string;
  className?: string;
}

export function CalorieLine({ text, estimateLabel, className }: CalorieLineProps) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <span>{text}</span>
      {estimateLabel && <Badge tone="lilac">{estimateLabel}</Badge>}
    </span>
  );
}
